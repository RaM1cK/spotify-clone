import {Track} from "../../../models/Track";
import {Observer} from "./observers/Observer";
import {Subject} from "./Subject";
import {LoadingState, PausedState, PlayerState, PlayingState, StoppedState} from "./PlayerState.ts";
import {Howl} from "howler";
import {
    ShufflePlayerStrategy,
    SimplePlayerStrategy,
    StrategyLoopDecorator,
    TrackLoopDecorator,
    PlaylistLoopDecorator,
    NoneLoopDecorator
} from "./PlayerStrategy.ts";

export class Player implements Subject {
    private static uniqueInstance: Player = new Player();
    howl: Howl | undefined;
    private observers: Observer[] = [];
    private _state: PlayerState;
    private _strategy: StrategyLoopDecorator;
    private _currentIndex: number = 0;
    private _bufferCheckInterval: ReturnType<typeof setInterval> | null = null;
    private _lastPosition: number = 0;
    private _lastPositionOnLoading: number = -1;

    private _pendingTrackId: number | null = null;
    private _lastToken: string | null = null;
    private _heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    private _volume: number = 1;
    private _streamDuration = 0;

    public get token(): string | null {
        return this._lastToken;
    }

    public get volume(): number {
        return this._volume;
    }

    public setVolume(v: number) {
        this._volume = Math.max(0, Math.min(1, v));
        this.howl?.volume(this._volume);
    }

    public get currentIndex(): number {
        return this._currentIndex;
    }

    set currentIndex(value: number) {
        this._currentIndex = value;
    }

    get state(): PlayerState {
        return this._state;
    }

    set state(value: PlayerState) {
        this._state = value;
    }

    public destroy(){
        this.stopHeartbeat()
        this.howl?.unload()
    }

    private updateMediaSession(track: Track) {
        if (!('mediaSession' in navigator)) return;

        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist,
            artwork: [
                {
                    src: `/api/files/${track.cover}`
                }
            ]
        })

        navigator.mediaSession.setActionHandler('play', () => this.play())
        navigator.mediaSession.setActionHandler('pause', () => {
            this.pause()
            navigator.mediaSession.playbackState = 'paused'
        })
        navigator.mediaSession.setActionHandler('stop', () => {
            this.pause()
            navigator.mediaSession.playbackState = 'none'
        })
        navigator.mediaSession.setActionHandler('nexttrack', () => this.next())
        navigator.mediaSession.setActionHandler('previoustrack', () => this.previous())
        navigator.mediaSession.setActionHandler('seekforward', (e) => {
            const skipTime = e.seekOffset ?? 10
            // @ts-ignore
            this.seek(this.seek() + skipTime)
            this.updatePositionState()
        })
        navigator.mediaSession.setActionHandler('seekbackward', (e) => {
            const skipTime = e.seekOffset ?? 10
            // @ts-ignore
            this.seek(this.seek() - skipTime)
            this.updatePositionState()
        })
        navigator.mediaSession.setActionHandler('seekto', (e) => {
            this.seek(e.seekTime)
            this.updatePositionState()
        })
    }

    private updateMediaSessionState(state: MediaSessionPlaybackState) {
        if (!('mediaSession' in navigator)) return;

        navigator.mediaSession.playbackState = state;
        this.updatePositionState()
    }

    private updatePositionState() {
        if (!('mediaSession' in navigator) || !this.howl) return;

        navigator.mediaSession.setPositionState({
            duration: this.track.duration || 0,
            position: this.seek() || 0,
            playbackRate: 1
        })
    }

    private startBufferWatch() {
        this.stopBufferWatch()

        this._bufferCheckInterval = setInterval(() => {
            if (!this.howl || this.isStopped() || this.isPaused()) return;

            const current = this.howl.seek()

            if (current === this._lastPosition) {
                this.state = new LoadingState()
                this.notify()
            } else {
                if (this.isLoading()) {
                    this.state = new PlayingState()
                    this.notify()
                }

                this._lastPosition = current
            }
        }, 1000)
    }

    private stopBufferWatch() {
        if (this._bufferCheckInterval) {
            clearInterval(this._bufferCheckInterval);
            this._bufferCheckInterval = null;
        }
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this._heartbeatInterval = setInterval(() => {
            if (!(this._state instanceof PlayingState)) return;
            const pos = this.howl?.seek();
            if (pos !== undefined && this._lastToken) {
                fetch('/api/tracks/heartbeat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: this._lastToken, position: Math.floor(pos) })
                }).catch(() => {});
            }
        }, 5000);
    }

    private stopHeartbeat() {
        if (this._heartbeatInterval) {
            clearInterval(this._heartbeatInterval);
            this._heartbeatInterval = null;
        }
    }

    private async handleError(track: any) {
        this.stopHeartbeat();
        const position = this.howl?.seek() || this._lastPosition
        await this.setHowl(track, position, true)
    }

    private async setHowl(track: any, startFrom: number = 0, autoplay: boolean = true) {
        this._lastPositionOnLoading = -1
        this.stopBufferWatch()
        this.state = new LoadingState()
        this.notify()

        this._pendingTrackId = track.id;

        try {
            const res = await fetch('/api/tracks/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trackId: track.id })
            });
            const data = await res.json();

            if (this._pendingTrackId !== track.id) return;

            this._lastToken = data.token;
            this.startHeartbeat();

            this.howl?.unload()

            const params = new URLSearchParams({
                token: data.token,
                duration: track.duration
            })

            this.howl = new Howl({
                src: [`/api/tracks?${params.toString()}`],
                format: ['mp3'],
                volume: this._volume,
                loop: false,
                html5: true,
                onload: () => {
                    console.log('loaded')

                    if (startFrom > 0) this.howl!.seek(startFrom)
                    else if (this._lastPositionOnLoading !== -1) this.howl!.seek(this._lastPositionOnLoading)

                    if (autoplay) this.play()
                    else {
                        this.pause()
                    }

                    this.updateMediaSession(track)
                    this.startBufferWatch()
                },
                onplay: () => {
                    this.updateMediaSessionState('playing')
                    this.state = new PlayingState();
                    this.notify()
                    this.startHeartbeat()
                },
                onpause: () => this.updateMediaSessionState('paused'),
                onend: () => {
                    this.updateMediaSessionState('none')
                    this.stopHeartbeat()
                    if (this._lastToken) {
                        const endPos = this._lastPosition || this.howl?.seek() || 0;
                        fetch('/api/tracks/heartbeat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ token: this._lastToken, position: Math.floor(endPos) })
                        }).catch(() => {});
                    }
                    this._strategy.onTrackEnd()
                },
                onloaderror: (e) => {
                    this.stopHeartbeat()
                    console.log('Load error')
                    console.error(e)
                    this.handleError(track)
                },
                onplayerror: (e) => {
                    this.stopHeartbeat()
                    console.log('Play error')
                    console.error(e)
                    this.handleError(track)
                }
            })
        } catch (err) {
            console.error('Failed to fetch track token', err);
            if (this._pendingTrackId === track.id) {
                this.state = new LoadingState()
                this.notify()
                setTimeout(() => {
                    this.setHowl(track, startFrom, autoplay)
                }, 3000)
            }
        }
    }

    public seek(num?: number) {
        if (this.howl) {
            if (num !== undefined) {
                if (this.howl.state() === 'loaded') {
                    this.howl.seek(num)
                    this._lastPositionOnLoading = -1
                    this.play()
                } else {
                    this._lastPositionOnLoading = num;
                }
            }
            else return Math.round(this.howl.seek())
        }
    }

    private constructor() {
        this._state = new StoppedState();
        this._strategy = new NoneLoopDecorator(new SimplePlayerStrategy());
    }

    public isPlaying(): boolean {
        return this.state instanceof PlayingState;
    }

    public isPaused(): boolean {
        return this.state instanceof PausedState;
    }

    public isLoading(): boolean {
        return this.state instanceof LoadingState;
    }

    public isStopped(): boolean {
        return this.state instanceof StoppedState;
    }

    public get track(): any {
        return this._strategy.wrapped.track;
    }

    public get queue(): any[] {
        return this._strategy.wrapped.queue;
    }

    public static getInstance() {
        return this.uniqueInstance;
    }

    public attach(observer: Observer): void {
        this.observers.push(observer);
    }

    public detach(observer: Observer): void {
        this.observers = this.observers.filter((o) => o !== observer);
    }

    public notify(): void {
        this.observers.forEach(async (o) => o.update())
    }

    public play() {
        this.state.play()
        this.notify()
    }

    public pause() {
        this.stopHeartbeat()
        this.state.pause()
        this.notify()
    }

    public stop() {
        this.stopHeartbeat()
        this.state.stop()
        this.notify()
    }

    public load() {
        this.state = new LoadingState();
        this.notify()
    }

    public setTrack(track: any, queue: any[], autoplay: boolean = true) {
        this.stop()

        this._strategy.execute(track, queue);
        this.setHowl(track, track.start ? track.start : 0, autoplay);
    }

    public setStrategy(strategy: string) {
        const tempTrack = this.track
        let tempQueue = this.queue

        switch (strategy) {
            case "simple":
                if (this._strategy.wrapped instanceof ShufflePlayerStrategy) tempQueue = this._strategy.wrapped.getUnshuffledQueue()
                this._strategy.wrapped = new SimplePlayerStrategy();
                break;
            case "shuffle":
                this._strategy.wrapped = new ShufflePlayerStrategy()
                break;
            case "loopPlaylist":
                this._strategy = new PlaylistLoopDecorator(this._strategy.wrapped);
                break;
            case "loopTrack":
                this._strategy = new TrackLoopDecorator(this._strategy.wrapped);
                break;
            case "noneLoop":
                this._strategy = new NoneLoopDecorator(this._strategy.wrapped);
                break;
        }

        this._strategy.execute(tempTrack, tempQueue);
    }

    public next(): void {
        this.stop()

        const queue = this.queue;

        if (queue.length !== 0) {
            this._currentIndex = (this._currentIndex + 1) % queue.length
            // @ts-ignore
            this.setHowl(queue[this._currentIndex])
        }
    }

    public previous(): void {
        const curPos = this.seek();
        const queue = this.queue;

        if (curPos !== undefined) {
            this.stop()

            if (curPos > 3) {
                this.play()
            } else {
                if (queue.length !== 0) {
                    this._currentIndex = (this._currentIndex + queue.length - 1) % queue.length
                    // @ts-ignore
                    this.setHowl(queue[this._currentIndex])
                }
            }
        }
    }
}
import {Track} from "../../../models/Track";
import {Observer} from "./observers/Observer";
import {Subject} from "./Subject";
import {LoadingState, PlayerState, PlayingState, StoppedState} from "./PlayerState.ts";
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
        this.howl?.unload()
    }

    private setHowl(track: Track): void {
        this.stop()

        if (this.howl) this.howl.unload()

        this.state = new LoadingState()
        this.notify()

        this.howl = new Howl({
            src: [track.url],
            volume: 0.06,
            loop: false,
            html5: true,
            autoplay: true,
            onload: () => {
                this.state = new PlayingState();
                this.notify()
            },
            onend: () => {
                this._strategy.onTrackEnd()
            },
            onloaderror: () => {
                console.log('Load error')
            },
            onplayerror: () => {
                console.log('PLay error')
            }
        })
    }

    public seek(num?: number) {
        if (this.howl) {
            if (num !== undefined) {
                this.howl.seek(num)

                if (!this.isLoading()) {
                    this.play()
                }
            }
            else return Math.floor(this.howl.seek() as number);
        }
    }

    private constructor() {
        const intervalCheckLoading = setInterval(() => {
            const loadingStatus = this.howl?.state()

            switch (loadingStatus) {
                case undefined:
                case "unloaded":
                case "loading":
                    if (!this.isLoading()){
                        this.state = new LoadingState();
                        this.notify()
                    }
                    break;
                case "loaded":
                    if (this.isLoading()) {
                        this.state = new PlayingState();
                        this.notify()
                    }
                    break;
            }
        }, 100)

        this._state = new StoppedState();
        this._strategy = new NoneLoopDecorator(new SimplePlayerStrategy());
    }

    public isPlaying(): boolean {
        return this.state instanceof PlayingState;
    }

    public isLoading(): boolean {
        return this.state instanceof LoadingState;
    }

    public isStopped(): boolean {
        return this.state instanceof StoppedState;
    }

    public get track(): Track {
        return this._strategy.wrapped.track;
    }

    public get queue(): Track[] {
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
        console.log(this.state)
        this.observers.forEach(async (o) => o.update())
    }

    public play() {
        this.state.play()
        this.notify()
    }

    public pause() {
        this.state.pause()
        this.notify()
    }

    public stop() {
        this.state.stop()
        this.notify()
    }

    public load() {
        this.state = new LoadingState();
        this.notify()
    }

    public setTrack(track: Track, queue: Track[]) {
        this._strategy.execute(track, queue);
        this.setHowl(track);
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

        console.log(this._strategy)
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
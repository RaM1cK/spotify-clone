import {Track} from "./models/Track";
import {Observer} from "./observers/Observer";
import {Subject} from "./Subject";
// @ts-ignore
import {LoadingState, PlayerState, PlayingState, StoppedState} from "./states/PlayerState.ts";
import {Howl} from "howler";

export class Player implements Subject {
    private static uniqueInstance: Player = new Player();
    private howl: Howl | undefined;
    private observers: Observer[] = [];
    private _state: PlayerState;
    private indexCurrent: number = 0;
    private _queue: Track[] = [];
    private _track: Track | undefined;

    public get state(): PlayerState {
        return this._state;
    }

    private setHowl(track: Track, queue: Track[]): void {
        if (this.howl) this.howl.unload()
        this.stop()

        this._queue = queue;
        this.indexCurrent = queue.findIndex((t) => t.id === track.id)
        this._track = track;
        this.load()

        this.howl = new Howl({
            src: [track.url],
            volume: 0.05,
            loop: true,
            html5: true,
            onload: () => {
                this.howl?.play()
                this.play();
            },
            onend: () => {
                this.stop()
                if (this.howl?.loop()) {
                    this.play()
                }
            }
        })
    }

    public seek(num?: number) {
        if (this.howl) {
            if (num !== undefined) this.howl.seek(num);
            else return Math.floor(this.howl.seek() as number);
        }
    }

    public set state(value: PlayerState) {
        this._state = value;
    }

    private constructor() {
        this._state = new StoppedState(this);
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

    public get track(): Track | undefined {
        return this._track;
    }

    get queue(): Track[] {
        return [...this._queue];
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
        console.log(this._state)
        this.observers.forEach(async (o) => {o.update()})
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
        this.state = new LoadingState(this);
        this.notify()
    }

    public setTrack(track: Track, queue: Track[]) {
        this.setHowl(track, queue);
    }

    public next(): void {
        if (this.howl) {
            if (this._queue.length !== 0) {
                this.indexCurrent = (this.indexCurrent + 1) % this._queue.length
                // @ts-ignore
                this.setTrack(this._queue[this.indexCurrent], this._queue)
            }
        }
    }

    public previous(): void {
        if (this.howl) {
            if (this.howl.seek() > 3) {
                this.stop();
                this.play()
            } else {
                if (this._queue.length !== 0) {
                    this.indexCurrent = (this.indexCurrent + this._queue.length - 1) % this._queue.length
                    // @ts-ignore
                    this.setTrack(this._queue[this.indexCurrent], this._queue)
                }
            }
        }
    }
}
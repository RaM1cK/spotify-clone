import {Track} from "./models/Track";
import {Observer} from "./observers/Observer";
import {Subject} from "./Subject";
// @ts-ignore
import {LoadingState, PlayerState, PlayingState, StoppedState} from "./states/PlayerState.ts";

export class Player implements Subject {
    private static uniqueInstance: Player = new Player();
    private observers: Observer[] = [];
    private _state: PlayerState;
    private indexCurrent: number = 0;
    private _queue: Track[] | undefined;
    private _track: Track | undefined;
    private timeoutPrev: number | undefined;

    public get state(): PlayerState {
        return this._state;
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

    get queue(): Track[] | undefined {
        return this._queue ? [...this._queue] : undefined;
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
        this.observers.forEach((o) => {o.update()})
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

    public setTrackByIndex(indexCurrent: number, queue: Track[] | undefined) {
        this.stop()
        this.indexCurrent = indexCurrent;
        if (queue) {
            this.load()
            this._queue = queue;
            this._track = queue[indexCurrent];
            this.play()
        }
    }

    private setTimeout() {
        this.timeoutPrev = setTimeout(() => {
            this.clearTimeout()
        }, 5000)
    }

    private clearTimeout() {
        clearTimeout(this.timeoutPrev)
        this.timeoutPrev = undefined
    }

    public next(): void {
        if (this._queue) {
            this.setTrackByIndex((++this.indexCurrent) % this._queue.length, this._queue)
        }
    }

    public previous(): void {
        if (this._queue) {
            this.setTrackByIndex((--this.indexCurrent + this._queue.length) % this._queue.length, this._queue)
        }
    }
}
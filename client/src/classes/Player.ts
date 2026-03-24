import {Track} from "./Track";
import {Observer} from "./Observer";
import {Subject} from "./Subject";
// @ts-ignore
import {LoadingState, PlayerState, PlayingState, StoppedState} from "./states/PlayerState.ts";

export class Player implements Subject {
    private static uniqueInstance: Player = new Player();
    private observers: Observer[] = [];
    private _state: PlayerState;
    private _track: Track | null = null;

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

    public get track(): Track | null {
        return this._track;
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

    public load(track: Track): void {
        this._track = track;
        this.state = new LoadingState(this)
        this.notify()
    }
}
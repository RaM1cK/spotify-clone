import {Track} from "../../../models/Track";
import {Observer} from "./observers/Observer";
import {Subject} from "./Subject";
// @ts-ignore
import {LoadingState, PlayerState, PlayingState, StoppedState} from "./states/PlayerState.ts";
import {Howl} from "howler";
// @ts-ignore
import {PlayerStrategy, ShufflePLayerStrategy, SimplePLayerStrategy} from "./PlayerStrategy.ts";

export class Player implements Subject {
    private static uniqueInstance: Player = new Player();
    private howl: Howl | undefined;
    private observers: Observer[] = [];
    private _state: PlayerState;
    private _strategy: PlayerStrategy;
    private _indexCurrent: number = 0;
    private _queue: Track[] = [];
    private _track: Track | undefined;


    public get indexCurrent(): number {
        return this._indexCurrent;
    }

    public set indexCurrent(value: number) {
        this._indexCurrent = value;
    }

    public get state(): PlayerState {
        return this._state;
    }

    public destroy(){
        this.howl?.unload()
    }

    private setHowl(track: Track, queue: Track[]): void {
        if (this.howl) this.howl.unload()
        this.stop()

        this._queue = queue;
        this._indexCurrent = queue.findIndex((t) => t.id === track.id)
        this._track = track;
        this.load()

        this.howl = new Howl({
            src: [track.url],
            volume: 0.06,
            loop: false,
            html5: true,
            onload: () => {
                this.state = new PlayingState(this)
                this.play()
                if (!this.howl?.playing()) {
                    this.howl?.play()
                }
            },
            onend: () => {
                // if (!this.howl?.loop()) {
                //     this.stop()
                // }
                this._strategy.onTrackEnd()
            },
            onloaderror: () => {
                console.log('Load error')
                this.howl?.load()
            },
            onplayerror: () => {
                console.log('Load error')
                this.howl?.load()
            }
        })
    }

    public seek(num?: number) {
        if (this.howl) {
            if (num !== undefined) {
                this.howl.seek(num)
                this.load()
            }
            else return Math.floor(this.howl.seek() as number);
        }
    }

    public set state(value: PlayerState) {
        this._state = value;
    }

    private constructor() {
        this._state = new StoppedState(this);
        this._strategy = new SimplePLayerStrategy(this);
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

    public get queue(): Track[] {
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
        this.howl?.load()
    }

    public setTrack(track: Track, queue: Track[]) {
        this.setHowl(track, queue);
    }

    public setStrategy(strategy: "simple" | "shuffle" | "loopTrack" | "loopPlaylist") {
        switch (strategy) {
            case "simple":
                this._strategy = new SimplePLayerStrategy(this);
                break;
            case "shuffle":
                this._strategy = new ShufflePLayerStrategy(this)
                break;
        }

        console.log(this._strategy)
    }

    public next() {
        this._strategy.next();
    }

    public previous() {
        this._strategy.previous();
    }
}
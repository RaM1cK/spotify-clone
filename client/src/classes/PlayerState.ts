import {Player} from "./Player.ts";

export abstract class PlayerState {
    get player(): Player {
        return Player.getInstance()
    }

    abstract play(): void;
    abstract pause(): void;
    abstract stop(): void;
}

export class PausedState extends PlayerState {
    public play(): void {
        this.player.state = new PlayingState();
        this.player.howl?.play();
    }

    public pause(): void {

    }

    public stop(): void {
        this.player.state = new StoppedState();
        this.player.howl?.stop();
    }
}

export class PlayingState extends PlayerState {
    public play(): void {
    }

    public pause(): void {
        this.player.state = new PausedState();
        this.player.howl?.pause();
    }

    public stop(): void {
        this.player.state = new StoppedState();
        this.player.howl?.stop();
    }
}

export class StoppedState extends PlayerState {
    public play(): void {
        this.player.state = new PlayingState();
        this.player.howl?.play();
    }

    public pause(): void {
    }

    public stop(): void {

    }
}

export class LoadingState extends PlayerState {
    public play(): void {
    }

    public pause(): void {
    }

    public stop(): void {

    }
}
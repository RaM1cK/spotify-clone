export interface PlayerState {
    play(): void;
    pause(): void;
    stop(): void;
}

export class PausedState implements PlayerState {
    public constructor(private readonly player: any) {
        this.player = player
    }

    public play(): void {
        this.player.state = new PlayingState(this.player);
        this.player.howl.play();
    }

    public pause(): void {

    }

    public stop(): void {
        this.player.state = new StoppedState(this.player);
        this.player.howl.stop();
    }
}

export class PlayingState implements PlayerState {
    public constructor(private readonly player: any) {
        this.player = player
    }

    public play(): void {
    }

    public pause(): void {
        this.player.state = new PausedState(this.player);
        this.player.howl.pause();
    }

    public stop(): void {
        this.player.state = new StoppedState(this.player);
        this.player.howl.stop();
    }
}

export class StoppedState implements PlayerState {
    public constructor(private readonly player: any) {
        this.player = player;
    }

    public play(): void {
        this.player.state = new PlayingState(this.player);
        this.player.howl.play();
    }

    public pause(): void {
    }

    public stop(): void {

    }
}

export class LoadingState implements PlayerState {
    public constructor(private readonly player: any) {
        this.player = player;
    }

    public play(): void {
        // this.player.state = new PlayingState(this.player);
    }

    public pause(): void {
    }

    public stop(): void {

    }
}
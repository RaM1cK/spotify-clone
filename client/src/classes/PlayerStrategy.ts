import {Track} from "../../../models/Track";
import {Player} from "./Player.ts"

export abstract class PlayerStrategy {
    protected _queue: Track[] = [];

    protected get player(): Player {
        return Player.getInstance()
    }

    public get track(): Track {
        // @ts-ignore
        return this._queue[this.player.currentIndex];
    };
    public get queue(): Track[] {
        return [...this._queue];
    };
    public onTrackEnd() {
        if (this.player.currentIndex === this._queue.length - 1) {
            this.player.stop()
            return
        }

        this.player.next()
    };
    public execute(track: Track, queue: Track[]) {
        this.player.currentIndex = queue.findIndex(t => t.id === track.id);
        this._queue = [...queue];
    };
}

export class SimplePlayerStrategy extends PlayerStrategy {
}

export class ShufflePlayerStrategy extends PlayerStrategy {
    private unshuffledQueue: Track[] = [];

    public getUnshuffledQueue() {
        return [...this.unshuffledQueue]
    }

    public execute(track: Track, queue: Track[]) {
        this.unshuffledQueue = [...queue];
        const toShuffleQueue = [...queue];
        const onStartShuffleIndex = toShuffleQueue.findIndex(t => t.id === track.id);

        for (let i = 0; i < queue.length; i++) {
            const randIndex = Math.floor(Math.random() * toShuffleQueue.length);
            // @ts-ignore
            [toShuffleQueue[i], toShuffleQueue[randIndex]] = [toShuffleQueue[randIndex], toShuffleQueue[i]];
        }

        const onEndShuffleIndex = toShuffleQueue.findIndex(t => t.id === track.id);
        [
            // @ts-ignore
            toShuffleQueue[onStartShuffleIndex], toShuffleQueue[onEndShuffleIndex]
        ] = [toShuffleQueue[onEndShuffleIndex], toShuffleQueue[onStartShuffleIndex]];

        super.execute(track, toShuffleQueue);
    }
}

export abstract class StrategyLoopDecorator extends PlayerStrategy {
    public wrapped: PlayerStrategy;

    public constructor(wrapped: PlayerStrategy) {
        super();
        this.wrapped = wrapped;
    }

    public execute(track: Track, queue: Track[]) {
        this.wrapped.execute(track, queue);
    }
}

export class TrackLoopDecorator extends StrategyLoopDecorator {
    public onTrackEnd() {
        this.player.stop();
        this.player.play();
    }
}

export class PlaylistLoopDecorator extends StrategyLoopDecorator {
    public onTrackEnd() {
        this.player.next()
    }
}

export class NoneLoopDecorator extends StrategyLoopDecorator {
    public onTrackEnd() {
        this.wrapped.onTrackEnd()
    }
}
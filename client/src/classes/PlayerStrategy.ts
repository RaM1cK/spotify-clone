import {Track} from "../../../models/Track";

export interface PlayerStrategy {
    onTrackEnd: () => void;
    next: () => void;
    previous: () => void;
}

export class SimplePLayerStrategy implements PlayerStrategy {
    constructor(protected player: any) {
        this.player.indexCurrent = this.player.queue.findIndex((t: Track) => t.id === this.player.track?.id);

        if (this.player.indexCurrent === -1) this.player.indexCurrent = 0;
    }

    public onTrackEnd(): void {
        if (this.player.indexCurrent === this.player.queue.length - 1) {
            this.player.stop()
            return
        }

        this.next()
    }

    public next(): void {
        if (this.player.queue.length !== 0) {
            this.player.indexCurrent = (this.player.indexCurrent + 1) % this.player.queue.length
            this.player.setTrack(this.player.queue[this.player.indexCurrent], this.player.queue)
        }
    }

    public previous(): void {
        const curPos = this.player.howl.seek();

        if (curPos !== undefined) {
            if (curPos > 3) {
                this.player.play()
            } else {
                if (this.player.queue.length !== 0) {
                    this.player.indexCurrent = (this.player.indexCurrent + this.player.queue.length - 1) % this.player.queue.length
                    this.player.setTrack(this.player.queue[this.player.indexCurrent], this.player.queue)
                }
            }
        }
    }
}

export class ShufflePLayerStrategy extends SimplePLayerStrategy {
    public readonly queue: Track[] = [];

    constructor(player: any) {
        super(player);

        this.queue = this.player.queue.sort(() => Math.random() - 0.5);
        const newPos = this.queue.findIndex((t: Track) => t.id === this.player.track?.id);

        // @ts-ignore
        [this.queue[newPos], this.queue[this.player.indexCurrent]] = [this.queue[this.player.indexCurrent], this.queue[newPos]];

    }


    public next(): void {
        if (this.player.queue.length !== 0) {
            this.player.indexCurrent = (this.player.indexCurrent + 1) % this.player.queue.length
            this.player.setTrack(this.queue[this.player.indexCurrent], this.queue)
        }
    }

    public previous(): void {
        const curPos = this.player.howl.seek();

        if (curPos !== undefined) {
            if (curPos > 3) {
                this.player.play()
            } else {
                if (this.player.queue.length !== 0) {
                    this.player.indexCurrent = (this.player.indexCurrent + this.player.queue.length - 1) % this.player.queue.length
                    this.player.setTrack(this.queue[this.player.indexCurrent], this.queue)
                }
            }
        }
    }
}
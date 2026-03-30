import {Observer} from "./Observer";

export class TrackUI implements Observer{
    private readonly updateCallback: () => void;

    constructor(updateCallback: () => void) {
        this.updateCallback = updateCallback;
    }

    public update() {
        this.updateCallback();
    }
}
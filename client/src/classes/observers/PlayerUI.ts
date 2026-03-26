import {Observer} from "./Observer";

export class PlayerUI implements Observer {
    private readonly updateCallback: () => void;

    constructor(updateCallback: () => void) {
        this.updateCallback = updateCallback;
    }

    public update(): void {
        this.updateCallback()
    }
}
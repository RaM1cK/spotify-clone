type T_Track = {
    id: string;
    logoURL: string;
    name: string;
    creator: string;
    url: string;
    duration: number;
}

export class Track {
    private readonly _id: string;
    private _logoURL: string;
    private _name: string;
    private _creator: string;
    private _url: string;
    private readonly _duration: number;

    constructor(track: T_Track) {
        this._id = track.id;
        this._logoURL = track.logoURL;
        this._name = track.name;
        this._creator = track.creator;
        this._url = track.url;
        this._duration = track.duration;
    }


    public get id(): string{
        return this._id;
    }

    public get logoURL(): string {
        return this._logoURL;
    }

    public set logoURL(value: string) {
        this._logoURL = value;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get creator(): string {
        return this._creator;
    }

    public set creator(value: string) {
        this._creator = value;
    }

    public get url(): string {
        return this._url;
    }

    public set url(value: string) {
        this._url = value;
    }

    public get duration(): number {
        return this._duration;
    }
}
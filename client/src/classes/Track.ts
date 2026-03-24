export class Track {
    private readonly _id: number;
    private _logoURL: string;
    private _name: string;
    private _creator: string;
    private _url: string;
    private readonly _duration: number;

    constructor({id, logoURL, name, creator, url, duration}) {
        this._id = id;
        this._logoURL = logoURL;
        this._name = name;
        this._creator = creator;
        this._url = url;
        this._duration = duration;
    }


    public get id(): number {
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
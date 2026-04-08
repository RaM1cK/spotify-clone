export class User {
    private readonly _id: bigint;
    private _name: string;
    private _avatarURL: string | null = null;
    private _email: string;

    public get id(): bigint {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get avatarURL(): string | null {
        return this._avatarURL;
    }

    public set avatarURL(value: string) {
        this._avatarURL = value;
    }

    public get email(): string {
        return this._email;
    }

    public set email(value: string) {
        this._email = value;
    }

    public constructor(id: bigint, name: string, avatarURL: string | null, email: string) {
        this._id = id;
        this._name = name;
        this._avatarURL = avatarURL;
        this._email = email;
    }
}
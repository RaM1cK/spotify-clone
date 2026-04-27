import {
    DataTypes, HasManyAddAssociationMixin,
    HasManyAddAssociationsMixin, InferAttributes, InferCreationAttributes, Model
} from "@sequelize/core";
import type {
    CreationOptional
} from "@sequelize/core";
import {Attribute, AutoIncrement, HasMany, NotNull, PrimaryKey, Table, Unique} from "@sequelize/core/decorators-legacy";
import {Track} from "./Track.ts";

@Table({
    underscored: true,
})
export class Release extends Model<InferAttributes<Release>, InferCreationAttributes<Release>>{
    @Attribute(DataTypes.BIGINT)
    @PrimaryKey
    @AutoIncrement
    declare id: number

    @Attribute(DataTypes.STRING(14))
    @Unique
    @NotNull
    declare icpn: string

    @Attribute(DataTypes.STRING(50))
    @NotNull
    declare type: string

    @Attribute(DataTypes.STRING(140))
    @NotNull
    declare title: string

    @Attribute(DataTypes.STRING(140))
    @NotNull
    declare artist: string

    @Attribute(DataTypes.STRING(50))
    @NotNull
    declare parentalWarning: string

    @HasMany(() => Track, 'releaseId')
    declare tracks?: Track[];

    getTracks(): Track[] | undefined {
        return this.tracks;
    }

    declare addTrack: HasManyAddAssociationMixin<Track, Track['id']>;
    declare addTracks: HasManyAddAssociationsMixin<Track, Track['id']>
}
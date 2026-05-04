import {
    DataTypes, HasManyAddAssociationMixin,
    HasManyAddAssociationsMixin, HasManyGetAssociationsMixinOptions, InferAttributes, InferCreationAttributes, Model,
    sql
} from "@sequelize/core";
import type {
    NonAttribute
} from "@sequelize/core";
import {
    Attribute,
    AutoIncrement,
    BelongsToMany, Default,
    HasMany,
    NotNull,
    PrimaryKey,
    Table,
    Unique
} from "@sequelize/core/decorators-legacy";
import {Track} from "./Track.ts";
import {Artist} from "./Artist.ts";

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

    @Attribute(DataTypes.TEXT)
    @NotNull
    declare cover: string

    @Attribute(DataTypes.STRING(50))
    @NotNull
    declare parentalWarning: string

    @Attribute(DataTypes.DATEONLY)
    @NotNull
    declare date: Date;

    @BelongsToMany(() => Artist, {
        through: 'ArtistRelease',
    })
    declare artists?: NonAttribute<Artist[]>

    @HasMany(() => Track, 'releaseId')
    declare tracks?: Track[];

    declare addTrack: HasManyAddAssociationMixin<Track, Track['id']>;
    declare addTracks: HasManyAddAssociationsMixin<Track, Track['id']>

    declare getTracks: HasManyGetAssociationsMixinOptions<Track>;
}
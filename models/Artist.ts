import {
    BelongsToManyAddAssociationMixin, BelongsToManyAddAssociationsMixin, BelongsToManyCountAssociationsMixin,
    BelongsToManyGetAssociationsMixin,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model
} from "@sequelize/core";
import type {
    NonAttribute
} from "@sequelize/core";
import {
    Attribute,
    AutoIncrement, BelongsToMany,
    NotNull,
    PrimaryKey,
    Table, Unique
} from "@sequelize/core/decorators-legacy";
import {Track} from "./Track.ts";
import {Release} from "./Release.ts";


@Table({
    underscored: true,
})
export class Artist extends Model<InferAttributes<Artist>, InferCreationAttributes<Artist>> {
    @Attribute(DataTypes.BIGINT)
    @PrimaryKey
    @AutoIncrement
    declare id: number;

    @Attribute(DataTypes.STRING(140))
    @Unique
    @NotNull
    declare name: string;

    // @Attribute(DataTypes.STRING(140))
    // @NotNull
    // declare name_normalized: string;

    @BelongsToMany(() => Track, {
        through: 'ArtistTrack'
    })
    declare tracks?: NonAttribute<Track[]>

    declare addTrack: BelongsToManyAddAssociationMixin<Track, Track['id']>
    declare addTracks: BelongsToManyAddAssociationsMixin<Track, Track['id']>
    declare getTracks: BelongsToManyGetAssociationsMixin<Track>
    declare countTracks: BelongsToManyCountAssociationsMixin<Track>

    @BelongsToMany(() => Release, {
        through: 'ArtistRelease'
    })
    declare releases?: NonAttribute<Release[]>

    declare addRelease: BelongsToManyAddAssociationMixin<Release, Release['id']>
    declare addReleases: BelongsToManyAddAssociationsMixin<Release, Release['id']>
    declare getReleases: BelongsToManyGetAssociationsMixin<Release>
}
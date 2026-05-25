import {
    BelongsToManyAddAssociationMixin,
    BelongsToManyAddAssociationsMixin,
    DataTypes,
    InferAttributes, InferCreationAttributes,
    Model
} from "@sequelize/core";
import type {
    NonAttribute,
    CreationOptional
} from "@sequelize/core";
import {
    Attribute, AutoIncrement, BelongsTo, BelongsToMany, Default,
    NotNull,
    PrimaryKey,
    Table,
    Unique
} from "@sequelize/core/decorators-legacy";
import {Composition} from "./Composition.ts";
import {Release} from "./Release.ts";
import {Artist} from "./Artist.ts";
import {StreamLog} from "./StreamLog.ts";

@Table({
    underscored: true,
})
export class Track extends Model<InferAttributes<Track>, InferCreationAttributes<Track>> {
    @Attribute(DataTypes.BIGINT)
    @PrimaryKey
    @AutoIncrement
    declare id: number;

    @Attribute(DataTypes.STRING(12))
    @Unique
    @NotNull
    declare isrc: string

    @Attribute(DataTypes.BIGINT)
    @NotNull
    declare releaseId: number

    @Attribute(DataTypes.STRING(140))
    @NotNull
    declare title: string

    @Attribute(DataTypes.STRING(140))
    @NotNull
    @Default('')
    declare titleNormalized: string

    @Attribute(DataTypes.STRING(140))
    @NotNull
    declare artist: string

    @Attribute(DataTypes.FLOAT)
    @NotNull
    declare duration: number

    @Attribute(DataTypes.STRING(21))
    @NotNull
    declare parentalWarning: string;

    @Attribute(DataTypes.TEXT)
    @NotNull
    declare uri: string

    @Attribute(DataTypes.TEXT)
    declare cover: string

    @BelongsToMany(() => Artist, {
        through: 'ArtistTrack',
    })
    declare artists?: NonAttribute<Artist[]>

    @BelongsToMany(() => Composition, {
        through: 'TrackComposition',
    })
    declare compositions?: NonAttribute<Composition[]>;

    declare addComposition: BelongsToManyAddAssociationMixin<Composition, Composition['id']>
    declare addCompositions: BelongsToManyAddAssociationsMixin<Composition, Composition['id']>

    declare streamLogs?: NonAttribute<StreamLog[]>
}


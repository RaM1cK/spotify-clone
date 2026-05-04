import {
    BelongsToGetAssociationMixin,
    BelongsToManyAddAssociationMixin, BelongsToManyCountAssociationsMixin,
    BelongsToManyGetAssociationsMixin, BelongsToManyRemoveAssociationMixin,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model, sql
} from "@sequelize/core";
import type {NonAttribute} from "@sequelize/core";
import {
    Attribute,
    BelongsTo,
    BelongsToMany,
    Default,
    NotNull,
    PrimaryKey,
    Table
} from "@sequelize/core/decorators-legacy";
import {Track} from "./Track.ts";
import {User} from "./User.ts";

@Table({
    underscored: true,
})
export class Playlist extends Model<InferAttributes<Playlist>, InferCreationAttributes<Playlist>> {
    @Attribute(DataTypes.UUID)
    @PrimaryKey
    @Default(sql.uuidV4)
    declare id: string

    @BelongsTo(() => User, {
        foreignKey: 'creatorId',
        inverse: {
            as: 'playlists',
            type: 'hasMany'
        }
    })
    declare user?: NonAttribute<User>
    declare getUser: BelongsToGetAssociationMixin<User>

    @Attribute(DataTypes.UUID)
    @NotNull
    declare creatorId: string

    @Attribute(DataTypes.STRING(140))
    @NotNull
    declare name: string

    @Attribute(DataTypes.TEXT)
    declare cover: string

    @BelongsToMany(() => Track, {
        through: 'PlaylistTracks',
    })
    declare tracks?: NonAttribute<Track[]>
    declare getTracks: BelongsToManyGetAssociationsMixin<Track>
    declare addTrack: BelongsToManyAddAssociationMixin<Track, Track['id']>
    declare removeTrack: BelongsToManyRemoveAssociationMixin<Track, Track['id']>
    declare countTracks: BelongsToManyCountAssociationsMixin<Track>
}
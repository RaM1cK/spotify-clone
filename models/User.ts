import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    sql, BelongsToGetAssociationMixinOptions, BelongsToManyGetAssociationsMixin, BelongsToManyAddAssociationMixin,
    BelongsToManyRemoveAssociationMixin, BelongsToManyHasAssociationMixin
} from "@sequelize/core";

import type {NonAttribute} from "@sequelize/core";
import {Attribute, BelongsToMany, Default, NotNull, PrimaryKey, Table, Unique} from "@sequelize/core/decorators-legacy";
import {Track} from "./Track.ts";
import {Artist} from "./Artist.ts";
import {Release} from "./Release.ts";

@Table({
    underscored: true,
})
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    @Attribute(DataTypes.UUID)
    @PrimaryKey
    @Default(sql.uuidV4)
    declare id: string;

    @Attribute(DataTypes.TEXT)
    @NotNull
    declare password_hash: string;

    @Attribute(DataTypes.STRING(24))
    @NotNull
    declare nickname: string;

    @Attribute(DataTypes.STRING(255))
    @Unique
    @NotNull
    declare email: string;

    @Attribute(DataTypes.UUID)
    declare avatar: string;
    
    @BelongsToMany(() => Track, {
        through: 'FavoriteTracks'
    })
    declare favoriteTracks: NonAttribute<Track[]>
    declare addFavoriteTrack: BelongsToManyAddAssociationMixin<Track, Track['id']>
    declare removeFavoriteTrack: BelongsToManyRemoveAssociationMixin<Track, Track['id']>
    declare getFavoriteTracks: BelongsToManyGetAssociationsMixin<Track>
    declare hasFavoriteTrack: BelongsToManyHasAssociationMixin<Track, Track['id']>

    @BelongsToMany(() => Artist, {
        through: 'FavoriteArtists',
    })
    declare favoriteArtists?: NonAttribute<Artist[]>
    declare addFavoriteArtist: BelongsToManyAddAssociationMixin<Artist, Artist['id']>
    declare removeFavoriteArtist: BelongsToManyRemoveAssociationMixin<Artist, Artist['id']>
    declare getFavoriteArtists: BelongsToManyGetAssociationsMixin<Artist>

    @BelongsToMany(() => Release, {
        through: 'FavoriteReleases',
    })
    declare favoriteReleases?: NonAttribute<Release[]>
    declare addFavoriteRelease: BelongsToManyAddAssociationMixin<Release, Release['id']>
    declare removeFavoriteRelease: BelongsToManyRemoveAssociationMixin<Release, Release['id']>
    declare getFavoriteReleases: BelongsToManyGetAssociationsMixin<Release>


    // @Attribute(DataTypes.UUID)
    // @NotNull
    // @Default(sql.uuidV4)
    // declare session_id: string;
}
import {DataTypes, InferAttributes, InferCreationAttributes, Model} from "@sequelize/core";
import type {NonAttribute} from "@sequelize/core";
import {
    Attribute,
    AutoIncrement,
    BelongsToMany,
    NotNull,
    PrimaryKey,
    Table,
    Unique
} from "@sequelize/core/decorators-legacy";
import {Track} from "./Track.ts";

@Table({
    underscored: true,
})
export class Composition extends Model<InferAttributes<Composition>, InferCreationAttributes<Composition>> {
    @Attribute(DataTypes.BIGINT)
    @PrimaryKey
    @AutoIncrement
    declare id: number;

    @Attribute(DataTypes.STRING(12))
    @Unique
    @NotNull
    declare iswc: string

    @BelongsToMany(() => Track, {
        through: 'TrackComposition',
    })
    declare tracks?: NonAttribute<Track[]>;
}
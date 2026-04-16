import {
    Model,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    sql
} from "@sequelize/core";

import type {
    CreationOptional
} from "@sequelize/core";

import {Attribute, Default, NotNull, PrimaryKey, Table, Unique} from "@sequelize/core/decorators-legacy";

@Table({
    underscored: true,
})
export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
    @Attribute(DataTypes.UUID)
    @PrimaryKey
    @Default(sql.uuidV4)
    declare id: CreationOptional<string>;

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
    @NotNull
    @Default(sql.uuidV4)
    declare session_id: string;
}
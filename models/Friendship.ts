import {
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model
} from "@sequelize/core";
import type {
    NonAttribute
} from "@sequelize/core";
import {
    Attribute, BelongsTo,
    Default,
    NotNull,
    PrimaryKey,
    Table
} from "@sequelize/core/decorators-legacy";
import {User} from "./User.ts";

@Table({ underscored: true })
export class Friendship extends Model<InferAttributes<Friendship>, InferCreationAttributes<Friendship>> {
    @Attribute(DataTypes.UUID)
    @PrimaryKey
    @NotNull
    declare senderId: string;

    @BelongsTo(() => User, {
        foreignKey: 'senderId',
        inverse: {
            as: 'sentRequests',
            type: 'hasMany'
        }
    })
    declare sender?: NonAttribute<User>

    @Attribute(DataTypes.UUID)
    @PrimaryKey
    @NotNull
    declare receiverId: string;

    @BelongsTo(() => User, {
        foreignKey: 'receiverId',
        inverse: {
            as: 'receivedRequests',
            type: 'hasMany'
        }
    })
    declare receiver?: NonAttribute<User>

    @Attribute(DataTypes.BOOLEAN)
    @NotNull
    @Default(false)
    declare request_accepted: boolean;
}

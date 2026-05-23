import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model, sql
} from "@sequelize/core";
import type {
    NonAttribute
} from "@sequelize/core";
import {
    Attribute,
    AutoIncrement,
    BelongsTo, Default,
    NotNull,
    PrimaryKey,
    Table
} from "@sequelize/core/decorators-legacy";
import {Track} from "./Track.ts";
import {User} from "./User.ts";

@Table({ underscored: true })
export class StreamLog extends Model<CreationOptional<StreamLog>, InferCreationAttributes<StreamLog>>{
    @Attribute(DataTypes.UUID)
    @PrimaryKey
    @Default(sql.uuidV4)
    declare id: number

    @Attribute(DataTypes.BIGINT)
    @NotNull
    declare trackId: number;

    @BelongsTo(() => Track, {
        foreignKey: "trackId",
        inverse: {
            as: 'streamLogs',
            type: 'hasMany'
        }
    })
    declare track?: NonAttribute<Track>;

    @Attribute(DataTypes.UUID)
    @NotNull
    declare userId: string;

    @BelongsTo(() => User, {
        foreignKey: "userId",
        inverse: {
            as: 'streamLogs',
            type: 'hasMany'
        }
    })
    declare user?: NonAttribute<User>;
}
import {
    BelongsToGetAssociationMixin, BelongsToManyGetAssociationsMixin, BelongsToSetAssociationMixin,
    DataTypes, HasManyGetAssociationsMixin,
    InferAttributes,
    InferCreationAttributes,
    Model,
    sql
} from "@sequelize/core";
import type {NonAttribute} from "@sequelize/core";
import {Attribute, BelongsTo, Default, HasMany, NotNull, PrimaryKey, Table} from "@sequelize/core/decorators-legacy";
import {User} from "./User.ts";
import {Chat} from "./Chat.ts";

@Table({
    underscored: true,
})
export class Message extends Model<InferAttributes<Message>, InferCreationAttributes<Message>> {
    @Attribute(DataTypes.UUID)
    @PrimaryKey
    @Default(sql.uuidV4)
    declare id: string;

    @Attribute(DataTypes.UUID)
    declare senderId: string;

    @BelongsTo(() => User, {
        foreignKey: 'senderId',
        inverse: {
            as: 'messages',
            type: 'hasMany'
        }
    })
    declare sender?: NonAttribute<User>;

    @Attribute(DataTypes.UUID)
    declare chatId: string;

    @BelongsTo(() => Chat, {
        foreignKey: 'chatId',
        inverse: {
            as: 'messages',
            type: 'hasMany'
        }
    })
    declare chat?: NonAttribute<Chat>;

    @Attribute(DataTypes.SMALLINT)
    @NotNull
    @Default(0)
    declare dataType: number

    @Attribute(DataTypes.TEXT)
    @NotNull
    @Default('')
    declare data: string;

    @Attribute(DataTypes.UUID)
    declare quotedId: string;

    declare quotedMessage?: NonAttribute<Message>;

    @HasMany(() => Message, {
        foreignKey: 'quotedId',
        inverse: {
            as: 'quotedMessage'
        }
    } as any)
    declare replies?: NonAttribute<Message[]>;
    declare getReplies: HasManyGetAssociationsMixin<Message>;
}
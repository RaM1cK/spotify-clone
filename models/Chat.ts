import {
    BelongsToManyAddAssociationMixin,
    DataTypes, HasManyAddAssociationMixin, HasManyCreateAssociationMixin, HasManyRemoveAssociationMixin,
    InferAttributes,
    InferCreationAttributes,
    Model, sql
} from "@sequelize/core";
import type {
    NonAttribute
} from "@sequelize/core";
import {
    Attribute,
    BelongsToMany,
    Default,
    HasMany,
    NotNull,
    PrimaryKey,
    Table
} from "@sequelize/core/decorators-legacy";
import {Message} from "./Message.ts";
import {User} from "./User.ts";

@Table({
    underscored: true,
})
export class Chat extends Model<InferAttributes<Chat>, InferCreationAttributes<Chat>> {
    @Attribute(DataTypes.UUID)
    @PrimaryKey
    @Default(sql.uuidV4)
    declare id: string;

    @Attribute(DataTypes.STRING(140))
    declare name: string;

    @Attribute(DataTypes.TEXT)
    declare logo: string;

    @HasMany(() => Message, {
        foreignKey: 'chatId',
        inverse: {
            as: 'chat'
        }
    } as any)
    declare messages?: NonAttribute<Message[]>
    declare addMessage: HasManyAddAssociationMixin<Message, Message['id']>
    declare deleteMessage: HasManyRemoveAssociationMixin<Message, Message['id']>
    declare createMessage: HasManyCreateAssociationMixin<Message>

    @BelongsToMany(() => User, {
        through: 'UserChats',
        inverse: {
            as: 'chats'
        }
    })
    declare users?: NonAttribute<User[]>
    declare addUser: BelongsToManyAddAssociationMixin<User, User['id']>
}
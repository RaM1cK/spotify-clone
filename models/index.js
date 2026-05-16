import { Sequelize } from '@sequelize/core';
import { PostgresDialect } from '@sequelize/postgres';
import dotenv from "dotenv";
import {User} from "./User.ts";
import {Track} from "./Track.ts";
import {Composition} from "./Composition.ts";
import {Release} from "./Release.ts";
import {Artist} from "./Artist.ts";
import {Playlist} from "./Playlist.ts";
import {Friendship} from "./Friendship.ts";
import {Message} from "./Message.ts";
import {Chat} from "./Chat.ts";
import {createClient} from "redis";

dotenv.config();

export const sequelize = new Sequelize({
    dialect: PostgresDialect,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: 5432,
    // logging: console.log,
    models: [
        User,
        Composition,
        Friendship,
        Message, Chat,
        Track,
        Playlist,
        Release,
        Artist
    ]
})

export const redisClient = new createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@spotify-clone.ru`,
})

redisClient.on('error', err => console.log(err))
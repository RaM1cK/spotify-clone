import express from 'express';
import http from 'http';
import {Server} from 'socket.io';
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
import socket from './controllers/ChatController.js'
import TrackRouter from './routers/TrackRouter.js';
import dotenv from 'dotenv';
import {sequelize} from './models/index.js';
import {User} from "./models/User.ts";
import UserRouter from "./routers/UserRouter.js";
import ReleaseRouter from "./routers/ReleaseRouter.js";
import cookieParser from "cookie-parser";
import {Track} from "./models/Track.ts";
import {Release} from "./models/Release.ts";
import axios from "axios";
import jwt from "jsonwebtoken";
import authMiddleware from "./routers/authMiddleware.js";
import ArtistRouter from "./routers/ArtistRouter.js";
import {Playlist} from "./models/Playlist.ts";
import PlaylistRouter from "./routers/PlaylistRouter.js";
import {Friendship} from "./models/Friendship.ts";
//import {Composition, Track} from "./models/Track.ts";

dotenv.config();

const app = express();
const IP_APP = process.env.IP_APP;
const SERVER_PORT = process.env.SERVER_PORT;

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

axios.defaults.withCredentials = true;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/files', express.static(path.join(__dirname, 'music')));
app.use("/users", UserRouter);
app.use(authMiddleware)
app.use("/tracks", TrackRouter);
app.use("/releases", ReleaseRouter);
app.use('/artists', ArtistRouter)
app.use('/playlists', PlaylistRouter);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", //при деплое изменить
        methods: ["GET", "POST"],
    }
});

try {
    await sequelize.authenticate();
    console.log('Connected');
    // await sequelize.sync({alter: true});

    // await sequelize.transaction(async t => {
    //     const user2 = await User.findOne({
    //         where: {
    //             email: 'spiridonow044@gmail.com'
    //         }
    //     });
    //
    //     const user1 = await User.findOne({
    //         where: {
    //             email: 'grigorijgorbunov5@gmail.com'
    //         }
    //     });
    //
    //     // await Friendship.create({
    //     //     senderId: user1.id,
    //     //     receiverId: user2.id,
    //     // }, { transaction: t})
    //
    //     // await Friendship.update(
    //     //     { request_accepted: true},
    //     //     {
    //     //         where: {
    //     //             senderId: user1.id,
    //     //             receiverId: user2.id,
    //     //         },
    //     //         transaction: t
    //     //     }
    //     // )
    // })

} catch (err) {
    console.error(err);
    await sequelize.close();
}

socket(io)

server.listen(SERVER_PORT, () => {
    console.log(`Listening on http://localhost:${SERVER_PORT}`);
});

process.on('SIGINT', async () => {
    await sequelize.close();
    console.log('CLOSED');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await sequelize.close();
    console.log('CLOSED');
    process.exit(0);
});

export default io;
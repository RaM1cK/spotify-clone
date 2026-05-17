import express from 'express';
import http from 'http';
import {Server} from 'socket.io';
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
import socket from './controllers/ChatController.js'
import TrackRouter from './routers/TrackRouter.js';
import dotenv from 'dotenv';
import {redisClient, sequelize} from './models/index.js';
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
import {Chat} from "./models/Chat.ts";
import {Resend} from "resend";
//import {Composition, Track} from "./models/Track.ts";

dotenv.config();

const app = express();
const IP_APP = process.env.IP_APP;
const SERVER_PORT = process.env.SERVER_PORT;

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

app.use(cors({
    origin: IP_APP,
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
        origin: IP_APP, //при деплое изменить
        methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 60000
});

try {
    await sequelize.authenticate();
    console.log('Connected');
    await sequelize.sync({alter: true});

    await redisClient.connect()
} catch (err) {
    console.error(err);
    await sequelize.close();
    await redisClient.close();
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
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
import {Chat} from "./models/Chat.ts";
//import {Composition, Track} from "./models/Track.ts";

dotenv.config();

const app = express();
const IP_APP = process.env.IP_APP;
const SERVER_PORT = process.env.SERVER_PORT;

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

axios.defaults.withCredentials = true;

app.use(cors({
    origin: "http://localhost:3000",
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
    },
    pingInterval: 25000,
    pingTimeout: 60000
});

try {
    await sequelize.authenticate();
    console.log('Connected');
    // await sequelize.sync({alter: true});

    // await sequelize.transaction(async t => {
    //     const user1 = await User.findByPk('e9743d48-96c9-44e3-91ce-fb87399f0435')
    //     const user2 = await User.findByPk('c76fd9c8-d804-4742-a0f4-a4f169028ed7')
    //
    //     await Friendship.create({
    //         senderId: user1.id,
    //         receiverId: user2.id,
    //     }, { transaction: t})
    //
    //     await Friendship.update(
    //         { request_accepted: true},
    //         {
    //             where: {
    //                 senderId: user1.id,
    //                 receiverId: user2.id,
    //             },
    //             transaction: t
    //         }
    //     )


        // const chat = await Chat.findByPk('adc5f5b0-4a76-485c-9aef-cc903bd92c84')
        //
        // await chat.createMessage({
        //     senderId: 'c76fd9c8-d804-4742-a0f4-a4f169028ed7',
        //     chatId: 'adc5f5b0-4a76-485c-9aef-cc903bd92c84',
        //     dataType: 0,
        //     data: 'Test Message'
        // }, {transaction: t})

        // const playlist = await Playlist.findByPk('6dcc864b-02c7-4c8c-8ba2-95a9014bf005')
        //
        // await playlist.addTrack(8, {transaction: t})
        // await playlist.addTrack(1, {transaction: t})
        // await playlist.addTrack(3, {transaction: t})
        // await playlist.addTrack(4, {transaction: t})
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
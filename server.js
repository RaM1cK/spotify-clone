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

dotenv.config();

const x = () => {
  
}

const app = express();
const IP_APP = process.env.IP_APP;
const SERVER_PORT = process.env.SERVER_PORT;

app.use(cors());
app.use(express.json());
app.use("/tracks", TrackRouter);
app.use("/users", UserRouter);

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", //при деплое изменить
        methods: ["GET", "POST"],
    }
});

try {
    await sequelize.authenticate();
    // await sequelize.sync({force: true});
    console.log('Connected');
} catch (err) {
    console.error(err);
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
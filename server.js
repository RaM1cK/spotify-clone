import express from 'express';
import http from 'http';
import {Server} from 'socket.io';
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
import socket from './controllers/ChatController.js'
import TrackRouter from './routers/TrackRouter.js';
import dotenv from 'dotenv';

dotenv.config();

const x = () => {
  
}

const app = express();
const IP_APP = process.env.IP_APP;
const SERVER_PORT = process.env.SERVER_PORT;
const CLIENT_PORT = process.env.CLIENT_PORT;
app.use(cors());
app.use(express.json());

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

// (
//     async () => {
//         const metadata = await parseFile(path.join(__dirname, '/music/Jane_Remover_-_Dancing_with_your_eyes_closed_80039450.mp3'));
//
//         console.log(inspect(metadata, {showHidden: false, depth: null}));
//         console.log(metadata.common.picture)
//     }
// ) ()

const server = http.createServer(app);

const io = new Server(server);

// app.post('/home', (req, res) => {
//     res.json({
//         id: 1,
//         text: 'Home page'
//     });
// })

// app.get('/:musicName', (req, res) => {
//     res.sendFile(path.join(__dirname + '/music/' + req.params['musicName']));
// })

app.use("/tracks", TrackRouter);

socket(io)

server.listen(SERVER_PORT, () => {
    console.log(`Listening on http://${IP_APP}:${SERVER_PORT}`);
});
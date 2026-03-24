import express from 'express';
import http from 'http';
import {Server} from 'socket.io';
import cors from 'cors';
import path from 'path';
import {fileURLToPath} from 'url';
import socket from './controllers/ChatController.js'

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// app.post('/home', (req, res) => {
//     res.json({
//         id: 1,
//         text: 'Home page'
//     });
// })

app.get('/:musicName', (req, res) => {
    res.sendFile(path.join(__dirname + '/music/' + req.params['musicName']));
})

socket(io)

server.listen(8080, () => {
    console.log('Listening on http://localhost:8080');
});
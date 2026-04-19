import jwt from "jsonwebtoken";

const socket = (io) => {
    io.use((socket, next) => {
        const token  = socket.handshake.auth.token;

        if (!token) return next(new Error('No token provided'));

        try {
            socket.email = jwt.verify(token, process.env.SECRET_KEY);
            next();
        } catch (err) {
            next(new Error("Invalid token"));
        }
    })

    io.on('connection', (socket) => {
        console.log('user connected');

        socket.join(`user:${socket.email}`);

        socket.on('send-message', ({room, message}) => {
            socket.to(room).emit('receive-message', {room, message});
        })

        socket.on('join-room', (room) => {
            socket.join(room);
        })

        socket.on('disconnect', () => {
            console.log('user disconnected');
        })
    })
}

export default socket;
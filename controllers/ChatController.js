import jwt from "jsonwebtoken";
import {User} from "../models/User.ts";

const socket = (io) => {
    // io.use(async (socket, next) => {
    //     const token  = socket.handshake.auth.token;
    //
    //     if (!token) return next(new Error('No token provided'));
    //
    //     try {
    //         const email = jwt.verify(token, process.env.SECRET_KEY).email
    //
    //         const user = await User.findOne({
    //             where: { email }
    //         })
    //
    //         if (!user) {
    //             return next(new Error("USER_DOESNT_EXISTS"));
    //         }
    //
    //         socket.email = email;
    //         next();
    //     } catch (err) {
    //         next(new Error("Invalid token"));
    //     }
    // })

    io.on('connection', (socket) => {
        console.log('user connected');

        // socket.join(`user:${socket.email}`);

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
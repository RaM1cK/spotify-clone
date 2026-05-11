import jwt from "jsonwebtoken";
import {User} from "../models/User.ts";
import {Chat} from "../models/Chat.ts";
import {sequelize} from "../models/index.js";
import {Message} from "../models/Message.ts";

const userConnections = new Map()

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

        socket.on('identity', userId => {
            socket.userId = userId;
            socket.join(`user:${userId}`);

            const count = (userConnections.get(userId) || 0) + 1;
            userConnections.set(userId, count);

            if (count === 1)
                socket.broadcast.emit('user-online', userId);
        })

        socket.on('send-message', async ({room, msg}) => {
            try {
                const chat = await Chat.findByPk(room)

                if (!chat) {
                    socket.emit('send-error', {
                        messageId: msg.id,
                        reason: 'Чат не найден'
                    })

                    return;
                }

                const message = await sequelize.transaction(async t => {
                    const message = await Message.create(msg, { transaction: t})

                    await chat.addMessage(message, { transaction: t});

                    return message.toJSON()
                })

                io.to(room).emit('receive-message', message);
            } catch (error) {
                console.log(error);

                socket.emit('send-error', {
                    messageId: msg.id,
                    reason: 'Не удалось отправить сообщение'
                })
            }
        })

        socket.on('join-room', room => {
            socket.join(room);
        })

        socket.on('disconnect', () => {
            if (!socket.userId) return

            const count = (userConnections.get(socket.userId) || 0) - 1;

            if (count <= 0) {
                userConnections.delete(socket.userId);
                socket.broadcast.emit('user-offline', socket.userId);
            } else {
                userConnections.set(socket.userId, count);
            }

            console.log('user disconnected');
        })
    })
}

export default socket;
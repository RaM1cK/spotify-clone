const socket = (io) => {
    io.on('connection', (socket) => {
        console.log('user connected');
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
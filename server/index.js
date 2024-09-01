const { Server } = require('socket.io');

const server = new Server({cors: {origin: 'http://localhost:4200'}});
const userSocketMap = new Map();

server.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('register', (userId) => {
        userSocketMap.set(userId, socket.id);
        console.log(`User ${userId} connencted to socket ${socket.id}`);
    });

    socket.on('message', (data) => {
        console.log(data);
        const receiverSocketId = userSocketMap.get(data.receiverId);
        if(receiverSocketId) {
            server.to(receiverSocketId).emit('received', {data: data});
        }
        else {
            console.log(`User ${data.receiverId} is not connected`);
        }
    });

    socket.on('checkUserOnline', (userId, callback) => {
        const isOnline = userSocketMap.has(userId);
        callback(isOnline);
    })

    socket.on('disconnect', () => {
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                break;
            }
        }
        console.log('User disconnected:', socket.id);
    });
});

server.listen(4000);
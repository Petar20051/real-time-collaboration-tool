const { Server } = require('socket.io');

const connectedUsers = {}; // Track users per room

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
  
    // Join a document room
    socket.on('join-room', ({ roomId, username }) => {
      socket.join(roomId);
      console.log(`${username} joined room ${roomId}`);
  
      // Update connected users
      if (!connectedUsers[roomId]) {
        connectedUsers[roomId] = [];
      }
      connectedUsers[roomId].push({ id: socket.id, username });
  
      // Notify all users in the room about the updated user list
      io.to(roomId).emit('user-list', connectedUsers[roomId]);
    });
  
    // Handle leave room
    socket.on('leave-room', (roomId) => {
      connectedUsers[roomId] = connectedUsers[roomId].filter(
        (user) => user.id !== socket.id
      );
      io.to(roomId).emit('user-list', connectedUsers[roomId]);
    });
  
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      for (const roomId in connectedUsers) {
        connectedUsers[roomId] = connectedUsers[roomId].filter(
          (user) => user.id !== socket.id
        );
        io.to(roomId).emit('user-list', connectedUsers[roomId]);
      }
    });
  });}
  
module.exports = socketHandler;

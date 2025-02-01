// socketHandler.js
const { Server } = require('socket.io');

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
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);
    });

    // Handle document text changes
    socket.on('send-changes', (delta, roomId) => {
      socket.to(roomId).emit('receive-changes', delta);
    });

    // Handle chat messages (optional)
    socket.on('message', (message) => {
      // Broadcast the message to all sockets in the room(s) as needed
      io.emit('message', message);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;

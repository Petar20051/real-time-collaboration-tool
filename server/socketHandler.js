// socketHandler.js
const { Server } = require('socket.io');

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000', // Adjust to your client's origin
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle incoming events from clients
    socket.on('send-changes', (delta) => {
      // Broadcast the changes to all other connected clients
      socket.broadcast.emit('receive-changes', delta);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Document = require('./models/Document');
const User = require('./models/User');

const connectedUsers = {};
const chatMessages = {}; 
const editingUsers = {};

const socketHandler = (server) => {
  const io = new Server(server, { cors: { origin: 'http://localhost:3000', methods: ['GET', 'POST'] } });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    socket.on('join-room', async ({ roomId, token }) => {
      if (!roomId || !token) return socket.emit('error', 'Authentication required.');

      try {
        const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(userId);
        if (!user) return socket.emit('error', 'User not found.');

        socket.join(roomId);
        connectedUsers[roomId] = [...(connectedUsers[roomId] || []), { id: socket.id, username: user.username }];
        io.to(roomId).emit('user-list', connectedUsers[roomId]);

      } catch {
        socket.emit('error', 'Invalid token.');
      }
    });

    socket.on('document-updated', async ({ roomId, content }) => {
      try {
        await Document.findOneAndUpdate({ roomId }, { content }, { upsert: true });
        io.to(roomId).emit('document-updated', content);
      } catch (error) {
        console.error('❌ Error updating document:', error.message);
      }
    });

    socket.on('user-start-editing', ({ roomId, username }) => {
      if (!roomId || !username) return;

      if (!editingUsers[roomId]) {
        editingUsers[roomId] = new Set();
      }

      editingUsers[roomId].add(username);
      io.to(roomId).emit('editing-users', Array.from(editingUsers[roomId]));
    });

    socket.on('user-stop-editing', ({ roomId, username }) => {
      if (!roomId || !username) return;

      if (editingUsers[roomId]) {
        editingUsers[roomId].delete(username);
      }

      io.to(roomId).emit('editing-users', Array.from(editingUsers[roomId]));
    });
    // ✅ Restored Chat Functionality
    socket.on('send-message', ({ roomId, content }) => {
      if (!roomId || !content) return;

      // Find sender in connected users
      const sender = connectedUsers[roomId]?.find((user) => user.id === socket.id) || { username: 'Anonymous' };

      const message = { username: sender.username, content, timestamp: new Date().toISOString() };

      // ✅ Store message in memory
      if (!chatMessages[roomId]) chatMessages[roomId] = [];
      chatMessages[roomId].push(message);

      // ✅ Send message to all users in the room
      io.to(roomId).emit('receive-message', message);
      console.log(`📩 Message sent to room ${roomId}:`, message);
    });

    // ✅ Handle Leaving Room & Cleanup
    socket.on('leave-room', (roomId) => {
      if (!roomId || !connectedUsers[roomId]) return;

      // ✅ Remove user from connected users
      connectedUsers[roomId] = connectedUsers[roomId].filter((user) => user.id !== socket.id);
      io.to(roomId).emit('user-list', connectedUsers[roomId]);

      // ✅ Remove user from editing list
      if (editingUsers[roomId]) {
        editingUsers[roomId].delete(socket.id);
        io.to(roomId).emit('editing-users', Array.from(editingUsers[roomId]));
      }

      // ✅ Remove chat history if no users left
      if (connectedUsers[roomId].length === 0) {
        console.log(`🗑️ Clearing chat history for room ${roomId}`);
        delete chatMessages[roomId];
      }

      socket.leave(roomId);
      console.log(`🚪 User ${socket.id} left room ${roomId}`);
    });

    // ✅ Handle Disconnect (Cleanup Users)
    socket.on('disconnect', () => {
      console.log(`🚪 User disconnected: ${socket.id}`);

      Object.keys(connectedUsers).forEach((roomId) => {
        connectedUsers[roomId] = connectedUsers[roomId].filter((user) => user.id !== socket.id);
        io.to(roomId).emit('user-list', connectedUsers[roomId]);

        if (editingUsers[roomId]) {
          editingUsers[roomId].delete(socket.id);
          io.to(roomId).emit('editing-users', Array.from(editingUsers[roomId]));
        }

        if (!connectedUsers[roomId].length) {
          console.log(`🗑️ Clearing chat history for room ${roomId}`);
          delete chatMessages[roomId];
        }
      });
    });
  });
};

module.exports = socketHandler;

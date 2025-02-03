const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Document = require('./models/Document');
const User = require('./models/User'); // Import User model to fetch username

const connectedUsers = {}; // Active users by roomId
const chatMessages = {}; // Store messages per room

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:3000', // Adjust to your frontend URL if needed
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Handle join-room event
    socket.on('join-room', async ({ roomId, token }) => {
      console.log('📩 Received join-room data:', { roomId });

      if (!roomId) {
        console.error('❌ Room ID is required.');
        return;
      }

      if (!token) {
        console.error('❌ No token provided, rejecting join request.');
        socket.emit('error', 'Authentication required.');
        return;
      }

      // Verify token and extract user ID
      let userId, username;
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded?.id; // Extract user ID from token

        // Fetch username from database
        const user = await User.findById(userId);
        if (!user) {
          console.error('❌ User not found in database');
          socket.emit('error', 'User not found');
          return;
        }

        username = user.username; // Get username from database
        console.log(`🔑 User authenticated: ${username} (${userId})`);
      } catch (error) {
        console.error('❌ Invalid token:', error.message);
        socket.emit('error', 'Invalid token.');
        return;
      }

      // Join room
      socket.join(roomId);
      if (!connectedUsers[roomId]) connectedUsers[roomId] = [];

      // Store username instead of user ID
      if (!connectedUsers[roomId].some((user) => user.id === socket.id)) {
        connectedUsers[roomId].push({ id: socket.id, username });
      }

      // Send updated user list to the room
      io.to(roomId).emit('user-list', connectedUsers[roomId]);

      // Send chat history to new users in the room
      if (chatMessages[roomId]) {
        socket.emit('chat-history', chatMessages[roomId]);
      }
    });

    // Handle send-changes event (editor changes)
    socket.on('send-changes', async ({ delta, roomId }) => {
      if (!roomId || !delta) return;

      // Broadcast changes to other users in the room
      socket.to(roomId).emit('receive-changes', delta);

      // Save changes to the document
      try {
        const existingDocument = await Document.findOne({ roomId });
        if (!existingDocument) return;

        const updatedContent = existingDocument.content;
        updatedContent.ops.push(...delta.ops);

        await Document.findOneAndUpdate(
          { roomId },
          { $set: { content: updatedContent } },
          { new: true }
        );

        console.log(`✅ Document saved in room ${roomId}`);
      } catch (error) {
        console.error('❌ Error saving document:', error.message);
      }
    });

    // Handle send-message event (for Chat)
    socket.on('send-message', ({ roomId, content }) => {
      if (!roomId || !content) return;

      // Find sender in connected users
      const sender = connectedUsers[roomId]?.find((user) => user.id === socket.id);
      const username = sender?.username || 'Anonymous';

      const message = {
        username,
        content,
        timestamp: new Date().toISOString(),
      };

      // Store message in memory
      if (!chatMessages[roomId]) chatMessages[roomId] = [];
      chatMessages[roomId].push(message);

      // Send message to all users in the room
      io.to(roomId).emit('receive-message', message);
      console.log(`📩 Message sent to room ${roomId}:`, message);
    });

    // Handle leave-room event
    socket.on('leave-room', (roomId) => {
      if (!roomId || !connectedUsers[roomId]) return;

      // Remove user from the connectedUsers list
      connectedUsers[roomId] = connectedUsers[roomId].filter(
        (user) => user.id !== socket.id
      );
      io.to(roomId).emit('user-list', connectedUsers[roomId]);

      // If last user leaves, clear chat history
      if (connectedUsers[roomId].length === 0) {
        console.log(`🗑️ Clearing chat history for room ${roomId}`);
        delete chatMessages[roomId];
      }

      // Leave the room
      socket.leave(roomId);
      console.log(`🚪 User ${socket.id} left room ${roomId}`);
    });

    // Handle disconnect event
    socket.on('disconnect', () => {
      console.log(`🚪 User disconnected: ${socket.id}`);
      Object.keys(connectedUsers).forEach((roomId) => {
        connectedUsers[roomId] = connectedUsers[roomId].filter(
          (user) => user.id !== socket.id
        );
        io.to(roomId).emit('user-list', connectedUsers[roomId]);

        // If last user leaves, clear chat history
        if (connectedUsers[roomId].length === 0) {
          console.log(`🗑️ Clearing chat history for room ${roomId}`);
          delete chatMessages[roomId];
        }
      });
    });
  });
};

module.exports = socketHandler;

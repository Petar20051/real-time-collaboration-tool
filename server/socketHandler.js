const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Document = require('./models/Document');
const User = require('./models/User');
const Comment = require('./models/Comment');

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


    socket.on('add-comment', async ({ roomId, content, token }) => {
      if (!content) return;
    
      try {
        // ✅ Verify JWT to authenticate user
        const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(userId);
        if (!user) return socket.emit('error', 'User not found.');
    
        // ✅ Save comment in MongoDB
        const newComment = new Comment({ roomId, userId, username: user.username, content });
        await newComment.save();
    
        // ✅ Broadcast comment to all users in the room
        io.to(roomId).emit('new-comment', newComment);
      } catch (error) {
        console.error('❌ Error adding comment:', error.message);
        socket.emit('error', 'Failed to add comment.');
      }
    });
    

    // ✅ Handle Comment Deletion
    socket.on('delete-comment', async ({ commentId, token }) => {
      try {
        if (!token) {
          console.error('❌ Unauthorized: No token provided.');
          return socket.emit('error', 'Unauthorized');
        }
    
        // ✅ Verify token to get userId
        const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(userId);
        if (!user) {
          return socket.emit('error', 'User not found');
        }
    
        const comment = await Comment.findById(commentId);
        if (!comment) {
          return socket.emit('error', 'Comment not found');
        }
    
        // ✅ Only allow comment author to delete
        if (comment.userId.toString() !== userId) {
          return socket.emit('error', 'Unauthorized to delete this comment');
        }
    
        await comment.deleteOne();
        
        // ✅ Emit event to all users in the room
        io.to(comment.roomId).emit('comment-deleted', commentId);
        console.log(`✅ Comment deleted: ${commentId}`);
      } catch (error) {
        console.error('❌ Error deleting comment:', error.message);
        socket.emit('error', 'Error deleting comment');
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
    setInterval(async () => {
      for (const roomId in connectedUsers) {
        try {
          const document = await Document.findOne({ roomId });
          if (!document) continue;

          document.versions.push({ content: document.content });
          await document.save();
          console.log(`✅ Auto-saved version for room ${roomId}`);
        } catch (error) {
          console.error(`❌ Error auto-saving version for room ${roomId}:`, error.message);
        }
      }
    }, 300000); 

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
      

    socket.on('sync-offline-changes', async ({ roomId, changes }) => {
      if (!roomId || !changes.length) return;
    
      try {
        const existingDocument = await Document.findOne({ roomId });
        if (!existingDocument) return;
    
        // Apply changes to the document
        changes.forEach(delta => {
          existingDocument.content.ops.push(...delta.ops);
        });
    
        await existingDocument.save();
        console.log(`✅ Offline changes synced for room ${roomId}`);
    
        // Send updated document to all users
        io.to(roomId).emit('receive-changes', changes);
      } catch (error) {
        console.error('❌ Error syncing offline changes:', error.message);
      }
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

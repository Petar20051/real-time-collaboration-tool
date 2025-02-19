const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Document = require('./models/Document');
const User = require('./models/User');
const Comment = require('./models/Comment');

const connectedUsers = {};
const chatMessages = {}; 
const editingUsers = {};
const userCursors = {};
const audioUsers={};
const audioRooms = {};

const socketHandler = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true, 
    },
    transports: ["websocket", "polling"], 
  });
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    socket.on("start-audio", (roomId) => {
      if (audioRooms[roomId]) {
        console.log(`⚠️ Meeting already active in room ${roomId}`);
        return;
      }
      audioRooms[roomId] = { users: new Set() };
      console.log(`🎙️ Meeting started in room ${roomId}`);
      audioRooms[roomId].users.add(socket.id);
      socket.join(roomId);
      io.to(roomId).emit("meeting-started", roomId);
     
      io.to(socket.id).emit("join-audio", roomId);
    });

    socket.on("join-audio", (roomId) => {
      if (!audioRooms[roomId]) {
        console.log(`⚠️ No active meeting in room ${roomId}`);
        return;
      }
      if (audioRooms[roomId].users.has(socket.id)) {
        console.log(`⚠️ User ${socket.id} is already in room ${roomId}, preventing duplicate join.`);
        return;
      }
      socket.join(roomId);
      audioRooms[roomId].users.add(socket.id);
      console.log(`🔊 User ${socket.id} joined audio in room ${roomId}`);
      
      io.to(socket.id).emit("request-microphone");
      io.to(roomId).emit("update-participants", {
        participants: Array.from(audioRooms[roomId].users),
        muteStates: audioUsers,
      });
    });


socket.on("get-meeting-status", (roomId) => {
  if (audioRooms[roomId]) {
    console.log(`Meeting is already active in room ${roomId} for socket ${socket.id}`);
    socket.emit("meeting-started", roomId);
  }
});


    socket.on("toggle-mute", ({ roomId, userId, isMuted }) => {
      if (!audioRooms[roomId] || !audioRooms[roomId].users.has(userId)) return;
      if (!audioUsers[userId]) {
        audioUsers[userId] = {};
      }
      audioUsers[userId].muted = isMuted;
      io.to(roomId).emit("user-muted", { userId, isMuted });
    });

    socket.on("leave-audio", (roomId) => {
      if (!audioRooms[roomId]) return;
      audioRooms[roomId].users.delete(socket.id);
      delete audioUsers[socket.id];
      console.log(`🚪 User ${socket.id} left audio in room ${roomId}`);
      if (audioRooms[roomId].users.size === 0) {
        console.log(`🛑 Meeting ended in room ${roomId}`);
        delete audioRooms[roomId];
        io.to(roomId).emit("meeting-ended");
      } else {
        io.to(roomId).emit("update-participants", {
          participants: Array.from(audioRooms[roomId].users),
          muteStates: audioUsers,
        });
      }
    });

    

    socket.on("webrtc-offer", ({ offer, to }) => {
      console.log(`Forwarding WebRTC offer from ${socket.id} to ${to}`);
      io.to(to).emit("webrtc-offer", { offer, from: socket.id });
    });

    socket.on("webrtc-answer", ({ answer, to }) => {
      console.log(`Forwarding WebRTC answer from ${socket.id} to ${to}`);
      io.to(to).emit("webrtc-answer", { answer, from: socket.id });
    });

    socket.on("webrtc-candidate", ({ candidate, to }) => {
      console.log(`Forwarding ICE candidate from ${socket.id} to ${to}`);
      io.to(to).emit("webrtc-candidate", { candidate, from: socket.id });
    });
    

    socket.on('join-room', async ({ roomId, token, password }) => {
      if (!roomId || !token) return socket.emit('error', 'Authentication required.');
    
      try {
        const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(userId);
        if (!user) return socket.emit('error', 'User not found.');
    
        const document = await Document.findOne({ roomId });
        if (!document) return socket.emit('error', 'Room not found.');
    
        const isOwner = document.ownerId?.toString() === userId;
    
        
        if (connectedUsers[roomId]?.some(u => u.id === socket.id)) {
          console.log(`⚠️ User ${user.username} is already in the room, preventing duplicate join.`);
          return;
        }
    
        
        if (!isOwner && document.isPrivate) {
          const isValid = await document.validatePassword(password);
          if (!isValid) return socket.emit('error', 'Incorrect password.');
        }
    
        socket.join(roomId);
        connectedUsers[roomId] = [...(connectedUsers[roomId] || []), { id: socket.id, username: user.username }];
    
        io.to(roomId).emit('user-list', connectedUsers[roomId]);
    
       
        socket.emit('room-joined', {
          message: 'Access granted',
          role: isOwner ? 'owner' : 'participant',
          ownerId: document.ownerId?.toString(),
        });
    
        console.log(`✅ User ${user.username} joined room ${roomId} as ${isOwner ? 'owner' : 'participant'}`);
    
      } catch (error) {
        console.error('❌ Error joining room:', error.message);
        socket.emit('error', 'Invalid token.');
      }
    });
    
    
    socket.on('update-cursor', ({ roomId, cursor }) => {
      if (!roomId || !cursor) return;

      if (!userCursors[roomId]) {
        userCursors[roomId] = {};
      }
      userCursors[roomId][socket.id] = cursor;

      io.to(roomId).emit('update-cursor', { userId: socket.id, cursor });
    });

    socket.on('add-comment', async ({ roomId, content, token }) => {
      if (!content) return;
    
      try {
        
        const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(userId);
        if (!user) return socket.emit('error', 'User not found.');
    
        const newComment = new Comment({ roomId, userId, username: user.username, content });
        await newComment.save();
    
        
        io.to(roomId).emit('new-comment', newComment);
      } catch (error) {
        console.error('❌ Error adding comment:', error.message);
        socket.emit('error', 'Failed to add comment.');
      }
    });
    

    
    socket.on('delete-comment', async ({ commentId, token }) => {
      try {
        if (!token) {
          console.error('❌ Unauthorized: No token provided.');
          return socket.emit('error', 'Unauthorized');
        }
    
       
        const { id: userId } = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(userId);
        if (!user) {
          return socket.emit('error', 'User not found');
        }
    
        const comment = await Comment.findById(commentId);
        if (!comment) {
          return socket.emit('error', 'Comment not found');
        }
    
     
        if (comment.userId.toString() !== userId) {
          return socket.emit('error', 'Unauthorized to delete this comment');
        }
    
        await comment.deleteOne();
        
       
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
    

    socket.on('user-start-editing', ({ roomId, username }) => {
      if (!roomId || !username) return;
    
      if (!editingUsers[roomId]) {
        editingUsers[roomId] = new Set();
      }
    
      editingUsers[roomId].add(username);
      console.log(`📝 ${username} is editing in room ${roomId}`);
    
      io.to(roomId).emit('editing-users', Array.from(editingUsers[roomId])); 
    });
    
    socket.on('user-stop-editing', ({ roomId, username }) => {
      if (!roomId || !username) return;
    
      if (editingUsers[roomId]) {
        editingUsers[roomId].delete(username);
    
        
        const usersArray = editingUsers[roomId].size > 0 ? Array.from(editingUsers[roomId]) : [];
    
        io.to(roomId).emit('editing-users', usersArray);
      }
    });
    
   
    socket.on('send-message', ({ roomId, content }) => {
      if (!roomId || !content) return;

      
      const sender = connectedUsers[roomId]?.find((user) => user.id === socket.id) || { username: 'Anonymous' };

      const message = { username: sender.username, content, timestamp: new Date().toISOString() };

      
      if (!chatMessages[roomId]) chatMessages[roomId] = [];
      chatMessages[roomId].push(message);

      
      io.to(roomId).emit('receive-message', message);
      console.log(`📩 Message sent to room ${roomId}:`, message);
    });

    
    socket.on('leave-room', (roomId) => {
      if (!roomId || !connectedUsers[roomId]) return;

     
      connectedUsers[roomId] = connectedUsers[roomId].filter((user) => user.id !== socket.id);
      io.to(roomId).emit('user-list', connectedUsers[roomId]);

      
      if (editingUsers[roomId]) {
        editingUsers[roomId].delete(socket.id);
        io.to(roomId).emit('editing-users', Array.from(editingUsers[roomId]));
      }

      
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
    
       
        changes.forEach(delta => {
          existingDocument.content.ops.push(...delta.ops);
        });
    
        await existingDocument.save();
        console.log(`✅ Offline changes synced for room ${roomId}`);
    
        
        io.to(roomId).emit('receive-changes', changes);
      } catch (error) {
        console.error('❌ Error syncing offline changes:', error.message);
      }
    });
    
    
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
        Object.keys(userCursors).forEach((roomId) => delete userCursors[roomId][socket.id]);
        Object.keys(audioRooms).forEach((roomId) => {
          if (audioRooms[roomId].users.has(socket.id)) {
            audioRooms[roomId].users.delete(socket.id);
            console.log(`🚪 Disconnected user ${socket.id} removed from room ${roomId}`);
  
            if (audioRooms[roomId].users.size === 0) {
              console.log(`🛑 Meeting ended in room ${roomId}`);
              delete audioRooms[roomId]; 
              io.to(roomId).emit("meeting-ended"); 
            } else {
              io.to(roomId).emit("user-left-audio", socket.id);
            }
          }
      });
    });
  });
});}

module.exports = socketHandler; 

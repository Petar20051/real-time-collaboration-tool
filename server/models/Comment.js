const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true, // Links comment to a specific document
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // Links to the user who wrote the comment
  },
  username: {
    type: String,
    required: true, // Store username for display
  },
  content: {
    type: String,
    required: true, // Comment text
  },
  position: {
    type: Number, // Optional: If we want to link to a specific position in the document
  },
  timestamp: {
    type: Date,
    default: Date.now, // When the comment was made
  },
});

module.exports = mongoose.model('Comment', CommentSchema);
 
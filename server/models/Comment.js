const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true, 
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, 
  },
  username: {
    type: String,
    required: true, 
  },
  content: {
    type: String,
    required: true, 
  },
  position: {
    type: Number, 
  },
  timestamp: {
    type: Date,
    default: Date.now, 
  },
});

module.exports = mongoose.model('Comment', CommentSchema);
 
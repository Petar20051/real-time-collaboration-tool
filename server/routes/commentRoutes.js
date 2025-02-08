const express = require('express');
const Comment = require('../models/Comment');
const User = require('../models/User'); 
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// ✅ Fetch Comments for a Room
router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const comments = await Comment.find({ roomId }).sort({ timestamp: 1 }); // Sort by oldest first
    res.status(200).json(comments);
  } catch (error) {
    console.error('❌ Error fetching comments:', error.message);
    res.status(500).json({ message: 'Error fetching comments' });
  }
});

router.post('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, position } = req.body;
    const userId = req.user.id; // ✅ Extract userId from token

    if (!content) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    // ✅ Fetch username from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const username = user.username; // ✅ Get username from DB

    // ✅ Create the new comment
    const newComment = new Comment({ roomId, userId, username, content, position });
    await newComment.save();

    // ✅ Emit real-time update
    req.io.to(roomId).emit('comment-added', newComment);

    res.status(201).json(newComment);
  } catch (error) {
    console.error('❌ Error adding comment:', error.message);
    res.status(500).json({ message: 'Error adding comment' });
  }
});


// ✅ Delete a Comment
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only allow the author or an admin to delete
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    await comment.deleteOne();

    // Emit real-time delete update
    req.io.to(comment.roomId).emit('comment-deleted', commentId);

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting comment:', error.message);
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

module.exports = router;

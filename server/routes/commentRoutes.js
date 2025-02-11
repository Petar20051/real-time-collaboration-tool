const express = require('express');
const Comment = require('../models/Comment');
const User = require('../models/User'); 
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();


router.get('/:roomId', authenticateToken, async (req, res) => {
  try {
    const { roomId } = req.params;
    const comments = await Comment.find({ roomId }).sort({ timestamp: 1 }); 
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
    const userId = req.user.id; 

    if (!content) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const username = user.username; 

   
    const newComment = new Comment({ roomId, userId, username, content, position });
    await newComment.save();

   
    req.io.to(roomId).emit('comment-added', newComment);

    res.status(201).json(newComment);
  } catch (error) {
    console.error('❌ Error adding comment:', error.message);
    res.status(500).json({ message: 'Error adding comment' });
  }
});


router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }


    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    await comment.deleteOne();

    
    req.io.to(comment.roomId).emit('comment-deleted', commentId);

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting comment:', error.message);
    res.status(500).json({ message: 'Error deleting comment' });
  }
});

module.exports = router;

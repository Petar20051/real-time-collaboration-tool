
const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
const router = express.Router();


router.get('/profile', authenticateToken, async (req, res) => {
  try {
    
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/profile', authenticateToken, async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = password; 

    await user.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

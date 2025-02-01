// routes/authRoutes.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Generate JWT token
const generateToken = (id, role) => {
  // Ensure id is a string (this helps avoid potential issues)
  const payload = { id: id.toString(), role };
  // Log the payload for debugging (remove in production)
  console.log('Generating token with payload:', payload);
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Register a new user
router.post('/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({ username, email, password, role });
    const token = generateToken(user._id, user.role);
    console.log('Registration successful. Token generated:', token);
    res.status(201).json({ token });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id, user.role);
      console.log('Login successful. Token generated:', token);
      res.json({ token });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

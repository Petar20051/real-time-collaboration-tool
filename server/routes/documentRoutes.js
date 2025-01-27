const express = require('express');
const Document = require('../models/Document'); // Import the Document model
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware to authenticate all routes
router.use(authenticateToken);

// Validation middleware for roomId
const validateRoomId = (req, res, next) => {
  const { roomId } = req.params;
  if (!roomId || typeof roomId !== 'string') {
    return res.status(400).json({ message: 'Invalid roomId' });
  }
  next();
};

// Validation middleware for content
const validateContent = (req, res, next) => {
  const { content } = req.body;
  if (!content || typeof content !== 'object') {
    return res.status(400).json({ message: 'Invalid content format. Content must be an object.' });
  }
  next();
};

// Fetch a document by roomId
router.get('/:roomId', validateRoomId, async (req, res) => {
  const { roomId } = req.params;

  try {
    let document = await Document.findOne({ roomId });
    if (!document) {
      document = await Document.create({ roomId, content: {} });
    }
    res.status(200).json(document);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching document' });
  }
});

// Save or update document content
router.post('/:roomId', [validateRoomId, validateContent], async (req, res) => {
  const { roomId } = req.params;
  const { content } = req.body;

  try {
    const document = await Document.findOneAndUpdate(
      { roomId },
      { content },
      { new: true, upsert: true }
    );
    res.status(200).json(document);
  } catch (err) {
    res.status(500).json({ message: 'Error saving document' });
  }
});

module.exports = router;

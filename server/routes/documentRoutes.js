// routes/documentRoutes.js
const express = require('express');
const Document = require('../models/Document');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all routes below
router.use(authenticateToken);

// GET a document by roomId (creates a new one if it doesn’t exist)
router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    let document = await Document.findOne({ roomId });
    if (!document) {
      document = await Document.create({ roomId, content: {} });
    }
    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching document' });
  }
});

// POST updated document content
router.post('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  const { content } = req.body;
  try {
    const document = await Document.findOneAndUpdate(
      { roomId },
      { content },
      { new: true, upsert: true }
    );
    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error saving document' });
  }
});

module.exports = router;

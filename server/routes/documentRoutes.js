const express = require('express');
const Document = require('../models/Document');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

// ✅ Fetch or Create Document
router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;
  try {
    let document = await Document.findOne({ roomId });
    if (!document) {
      document = await Document.create({ roomId, content: { ops: [] } });
    }
    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching document' });
  }
});

// ✅ Save Document on Every Change
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

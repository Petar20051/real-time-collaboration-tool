const express = require('express');
const Document = require('../models/Document');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

// Fetch or Create Document
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

// Save Document on Every Change
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

router.post('/:roomId/save-version', async (req, res) => {
  const { roomId } = req.params;
  const { content, name } = req.body;

  try {
    let document = await Document.findOne({ roomId });

    if (!document) {
      console.error('❌ Document not found:', roomId);
      return res.status(404).json({ message: 'Document not found' });
    }

    // ✅ Provide a default name if none is given
    const versionName = name?.trim() || `Version ${document.versions.length + 1}`;

    if (!versionName) {
      console.error('❌ Error: Version name is required');
      return res.status(400).json({ message: 'Version name is required' });
    }

    document.versions.push({ 
      name: versionName, 
      content, 
      timestamp: new Date()  // Ensure timestamp is included
    });

    await document.save();

    console.log('✅ Version saved successfully:', versionName);
    res.status(201).json({ message: 'Version saved successfully' });

  } catch (error) {
    console.error('❌ Error saving version:', error);
    res.status(500).json({ message: 'Error saving version', error: error.message });
  }
});

// Fetch All Versions of a Document
router.get('/:roomId/versions', async (req, res) => {
  const { roomId } = req.params;

  try {
    const document = await Document.findOne({ roomId });

    if (!document || !document.versions.length) {
      return res.status(404).json({ message: 'No versions found' });
    }

    res.status(200).json(document.versions.reverse());
  } catch (error) {
    console.error('❌ Error fetching versions:', error.message);
    res.status(500).json({ message: 'Error fetching versions' });
  }
});

module.exports = router;
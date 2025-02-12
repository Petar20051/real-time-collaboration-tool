const express = require('express');
const Document = require('../models/Document');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);


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

    
    const versionName = name?.trim() || `Version ${document.versions.length + 1}`;

    if (!versionName) {
      console.error('❌ Error: Version name is required');
      return res.status(400).json({ message: 'Version name is required' });
    }

    document.versions.push({ 
      name: versionName, 
      content, 
      timestamp: new Date()  
    });

    await document.save();

    console.log('✅ Version saved successfully:', versionName);
    res.status(201).json({ message: 'Version saved successfully' });

  } catch (error) {
    console.error('❌ Error saving version:', error);
    res.status(500).json({ message: 'Error saving version', error: error.message });
  }
});


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

router.post('/:roomId/set-password', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  const { password } = req.body;
  const userId = req.user.id;

  let document = await Document.findOne({ roomId });

  if (!document) return res.status(404).json({ message: 'Document not found' });
  if (document.passwordHash) return res.status(403).json({ message: 'Document already has a password' });

  await document.setPassword(password, userId);
  await document.save();

  res.json({ message: 'Password set. Document is now private', role: 'owner' });
});


router.post('/enter-room', async (req, res) => {
  const { roomId, password } = req.body;
  const userId = req.user.id;

  let document = await Document.findOne({ roomId });

  if (!document) return res.status(404).json({ message: 'Document not found' });

  const isOwner = document.ownerId?.toString() === userId;

  if (!document.passwordHash) {
    return res.json({ message: 'Room is public', access: true, role: isOwner ? 'owner' : 'participant' });
  }

  const isValid = await document.validatePassword(password);
  if (!isValid) {
    return res.status(403).json({ message: 'Incorrect password' });
  }

  res.json({ message: 'Access granted', access: true, role: isOwner ? 'owner' : 'participant' });
});

router.post('/:roomId/remove-password', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;

  let document = await Document.findOne({ roomId });

  if (!document) return res.status(404).json({ message: 'Document not found' });
  if (!document.ownerId || document.ownerId.toString() !== userId) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  document.passwordHash = null;
  document.isPrivate = false;
 document.ownerId=null;
  await document.save();

  res.json({ message: 'Document is now public' });
});



module.exports = router;
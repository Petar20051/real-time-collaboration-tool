const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware'); // Correct import

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id; // Extract userId from JWT

    const totalUsers = await User.estimatedDocumentCount();
    const documentsCreated = await Document.countDocuments({ ownerId: userId });
    const privateDocuments = await Document.countDocuments({ ownerId: userId, isPrivate: true });
    const publicDocuments = await Document.countDocuments({ ownerId: userId, isPrivate: false });

    // Fetch roomIds and password hashes of owned documents
    const ownedRooms = await Document.find({ ownerId: userId })
      .select('roomId passwordHash')
      .lean();

    const roomData = ownedRooms.map(doc => ({
      roomId: doc.roomId,
      passwordHash: doc.passwordHash || 'No password set'
    }));

    res.json({ 
      totalUsers, 
      documentsCreated, 
      privateDocuments, 
      publicDocuments, 
      roomData 
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;

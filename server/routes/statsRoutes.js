const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Document = require('../models/Document');

router.get('/', async (req, res) => {
  try {
    const totalUsers = await User.estimatedDocumentCount();
    const documentsCreated = await Document.estimatedDocumentCount();
    const privateDocuments = await Document.countDocuments({ isPrivate: true });
    const publicDocuments = await Document.countDocuments({ isPrivate: false });
    const docsWithVersions = await Document.countDocuments({ versions: { $exists: true, $ne: [] } });

    res.json({ 
      totalUsers, 
      documentsCreated, 
      privateDocuments, 
      publicDocuments, 
      docsWithVersions 
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;

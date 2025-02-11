const express = require('express');
const multer = require('multer');
const File = require('../models/File'); 
const router = express.Router();
const path = require('path');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads')); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });


router.use('/uploads', express.static(path.join(__dirname, '../uploads')));


router.post('/:roomId', upload.single('file'), async (req, res) => {
  const { roomId } = req.params;
  const { file } = req;

  if (!roomId || !file) {
    return res.status(400).json({ error: 'Room ID and file are required.' });
  }

  try {
    const newFile = await File.create({
      roomId,
      fileName: file.originalname,
      filePath: `/uploads/${file.filename}`, 
      uploadedBy: req.user?.id || 'Anonymous',
    });

    res.status(201).json({ message: '✅ File uploaded successfully.', file: newFile });
  } catch (error) {
    console.error('❌ Error uploading file:', error.message);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});


router.get('/:roomId', async (req, res) => {
  const { roomId } = req.params;

  if (!roomId) {
    return res.status(400).json({ error: 'Room ID is required.' });
  }

  try {
    const files = await File.find({ roomId });

    if (!files.length) {
      return res.status(404).json({ error: 'No files found for this room.' });
    }

    res.status(200).json({ files });
  } catch (error) {
    console.error('❌ Error fetching files:', error.message);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});
router.get('/download/:fileId', async (req, res) => {
    try {
      const file = await File.findById(req.params.fileId);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
  
      
      const filePath = path.join(__dirname, '..', file.filePath);
  
      
      res.download(filePath, file.fileName, (err) => {
        if (err) {
          console.error('❌ Error downloading file:', err.message);
          res.status(500).json({ error: 'Error downloading file' });
        }
      });
    } catch (error) {
      console.error('❌ Error fetching file:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
module.exports = router;

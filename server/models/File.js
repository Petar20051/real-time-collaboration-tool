const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true, 
  },
  fileName: {
    type: String,
    required: true, 
  },
  filePath: {
    type: String,
    required: true, 
  },
  uploadedBy: {
    type: String, 
    required: false,
  },
  uploadedAt: {
    type: Date,
    default: Date.now, 
  },
});

module.exports = mongoose.model('File', fileSchema);

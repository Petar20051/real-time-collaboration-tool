const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true, // Associates the file with a specific room
  },
  fileName: {
    type: String,
    required: true, // Name of the file
  },
  filePath: {
    type: String,
    required: true, // Path where the file is stored
  },
  uploadedBy: {
    type: String, // Optional: User ID or username
    required: false,
  },
  uploadedAt: {
    type: Date,
    default: Date.now, // Timestamp for when the file was uploaded
  },
});

module.exports = mongoose.model('File', fileSchema);

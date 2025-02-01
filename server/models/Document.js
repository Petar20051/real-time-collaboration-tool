// models/Document.js
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: Object,
    default: {}
  }
});

module.exports = mongoose.model('Document', DocumentSchema);

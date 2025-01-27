const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true }, 
  content: { type: Object, default: {} }, 
});

module.exports = mongoose.model('Document', documentSchema);

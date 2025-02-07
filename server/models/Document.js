const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  content: {
    type: Object,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const DocumentSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: Object,
    default: {},
  },
  versions: [VersionSchema],
});

module.exports = mongoose.model('Document', DocumentSchema);

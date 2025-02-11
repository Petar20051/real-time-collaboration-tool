const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const VersionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: Object, required: true },
  timestamp: { type: Date, default: Date.now },
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
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, 
  },
  passwordHash: {
    type: String,
    default: null, 
  },
  isPrivate: {
    type: Boolean,
    default: false, 
  }
});


DocumentSchema.methods.setPassword = async function (password, userId) {
  this.passwordHash = await bcrypt.hash(password, 10);
  this.isPrivate = true;
  this.ownerId = userId;
};


DocumentSchema.methods.validatePassword = async function (password) {
  if (!this.passwordHash) return false;
  return await bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model('Document', DocumentSchema);

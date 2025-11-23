const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  age: { type: Number },
  major: { type: String },
  hobby: { type: String },
  bio: { type: String },
  interests: { type: [String], default: [] },
  embedding: { type: [Number], default: [] },
  tokens: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

// Export as 'User' model backed by the default collection name ('users')
module.exports = mongoose.models.User || mongoose.model('User', UserSchema);

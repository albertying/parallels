const mongoose = require('mongoose');

// Profile model stored in `profiles` collection. Authentication is stored separately in `auth`.
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: false },
  major: { type: String, required: false },
  hobbies: { type: String, required: false },
  bio: { type: String, required: false },
  interests: { type: String, required: false },
  embedding: { type: [Number], required: false },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'profiles' });

module.exports = mongoose.model('User', userSchema);

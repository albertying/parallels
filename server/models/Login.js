const mongoose = require('mongoose');

// Login credentials stored in a separate collection `logins`.
// This module exports a helper to create/get the Login model on a given connection.
const loginSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, required: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true }, // hashed password
  createdAt: { type: Date, default: Date.now }
}, { collection: 'auth' });

function getLoginModel(conn) {
  // conn can be a mongoose instance or a Connection created with mongoose.createConnection
  if (!conn) conn = mongoose;
  // If conn is the default mongoose instance, use conn.model
  if (conn.modelNames && conn.modelNames().includes('Login')) {
    return conn.model('Login');
  }
  try {
    return conn.model('Login');
  } catch (e) {
    return conn.model('Login', loginSchema, 'logins');
  }
}

module.exports = { getLoginModel };

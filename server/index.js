const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

dotenv.config();

// If env vars weren't loaded (e.g. running from `server/` directory while .env is in project root),
// attempt to load the parent `.env` file as a fallback.
if (!process.env.OPENAI_API_KEY || !process.env.MONGODB_URI) {
  try {
    const path = require('path');
    const parentEnv = path.resolve(__dirname, '../.env');
    dotenv.config({ path: parentEnv });
    console.log('Loaded fallback env from', parentEnv);
  } catch (e) {
    // ignore — we'll check below and show a helpful error
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

const User = require('./models/User');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME || process.env.MONGODB_DB || 'parallels'
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
}

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY not set. Embedding endpoint will not work until you set OPENAI_API_KEY in .env or the environment.');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

function generateToken(user) {
  const payload = { userId: user._id, email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET || 'replace_this_with_secure_secret', { expiresIn: '7d' });
}

async function authenticateToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid authorization header format' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'replace_this_with_secure_secret');
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, age, major, hobby, bio, interests } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({ name, email, passwordHash, age, major, hobby, bio, interests });
    await user.save();

    const token = generateToken(user);
    // persist issued token (optional)
    user.tokens.push(token);
    await user.save();

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, age: user.age, major: user.major, hobby: user.hobby, bio: user.bio, interests: user.interests } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user);
    // persist issued token (optional)
    user.tokens.push(token);
    await user.save();

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, age: user.age, major: user.major, hobby: user.hobby, bio: user.bio, interests: user.interests } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Protected example: create embedding (only for authenticated users)
app.post('/embed', authenticateToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    const response = await openai.embeddings.create({ model: 'text-embedding-3-small', input: text });
    res.json({ embedding: response.data[0].embedding });
  } catch (err) {
    console.error('OpenAI Error:', err);
    res.status(500).json({ error: 'OpenAI request failed' });
  }
});

// Start server only after DB connection
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to DB connection error', err);
    process.exit(1);
  });

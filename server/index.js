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
app.use(cors());
const PORT = process.env.PORT || 3000;

const User = require('./models/User');
const { getLoginModel } = require('./models/Login');
let Login = null; // will be initialized after DB connect (can use separate connection)

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

async function initLoginModel() {
  // If LOGIN_DB_URI provided, create a separate connection for auth storage
  if (process.env.LOGIN_DB_URI) {
    try {
      const loginConn = await mongoose.createConnection(process.env.LOGIN_DB_URI, {
        dbName: process.env.LOGIN_DB_NAME || 'parallels_auth'
      }).asPromise();
      Login = getLoginModel(loginConn);
      console.log('Login model initialized on separate DB connection');
      return;
    } catch (e) {
      console.error('Failed to connect separate LOGIN_DB_URI, falling back to main DB', e);
    }
  }
  // fallback: use the default mongoose connection
  Login = getLoginModel(mongoose);
  console.log('Login model initialized on main DB connection');
}

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY not set. Embedding endpoint will not work until you set OPENAI_API_KEY in .env or the environment.');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());

// Use the `User` model from models/User.js as the Profile model (stored in `profiles` collection)
const Profile = User;

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
// Register: create an auth record in `auth` collection linked to a profile in `profiles` by id
app.post('/auth/register', async (req, res) => {
  try {
    const { profileId, username, password } = req.body;
    if (!profileId || !username || !password) return res.status(400).json({ error: 'profileId, username and password are required' });

    // ensure profile exists
    const profile = await Profile.findById(profileId);
    if (!profile) return res.status(404).json({ error: 'Profile not found for provided profileId' });

    // validate username and password strength
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username must be 3-30 characters and contain only letters, numbers, or underscores.' });
    }

    const pwOk = typeof password === 'string' && password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
    if (!pwOk) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and include letters and numbers.' });
    }

    // ensure username not taken in auth collection
    const existingLogin = await Login.findOne({ username });
    if (existingLogin) return res.status(409).json({ error: 'Username already in use' });

    const passwordHash = await bcrypt.hash(password, 10);

    // create auth document with _id equal to profile._id
    const authDoc = new Login({ _id: profile._id, username, passwordHash });
    await authDoc.save();

    // respond with minimal info — do not send passwordHash
    res.status(201).json({ message: 'Auth record created', id: authDoc._id, username: authDoc.username });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
// Login against the `auth` collection (username)
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const auth = await Login.findOne({ username });
    if (!auth) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, auth.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    // Build token payload containing the linked profile id
    const profileId = auth._id;
    const token = jwt.sign({ profileId }, process.env.JWT_SECRET || 'replace_this_with_secure_secret', { expiresIn: '7d' });

    // Optionally return the linked profile
    const profile = await Profile.findById(profileId).select('-embedding');

    res.json({ token, profile: profile || null });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});
// Create profile with embedding
app.post("/profile", async (req, res) => {
  try {
    const { name, age, major, interests, hobbies, bio } = req.body;

    // Validate required fields
    if (!name || !age || !major || !interests || !hobbies || !bio) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Create text for embedding (interests, hobbies, bio)
    const textToEmbed = `Interests: ${interests}\nHobbies: ${hobbies}\nBio: ${bio}`;

    // Get embedding from OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: textToEmbed,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Create and save profile
    const profile = new Profile({
      name,
      age: parseInt(age),
      major,
      interests,
      hobbies,
      bio,
      embedding,
    });

    await profile.save();

    res.status(201).json({
      message: "Profile created successfully",
      profile: {
        id: profile._id,
        name: profile.name,
        age: profile.age,
        major: profile.major,
        interests: profile.interests,
        hobbies: profile.hobbies,
        bio: profile.bio,
        createdAt: profile.createdAt,
      },
    });
  } catch (err) {
    console.error("Profile creation error:", err);
    res.status(500).json({ error: "Failed to create profile" });
  }
});

// Get all profiles
app.get("/profiles", async (req, res) => {
  try {
    const profiles = await Profile.find().select("-embedding");
    res.json(profiles);
  } catch (err) {
    console.error("Error fetching profiles:", err);
    res.status(500).json({ error: "Failed to fetch profiles" });
  }
});

// Get single profile by ID
app.get("/profile/:id", async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }
    res.json(profile);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
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
  .then(async () => {
    await initLoginModel();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server due to DB connection error', err);
    process.exit(1);
  });

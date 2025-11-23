const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const cors = require("cors");
dotenv.config();
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME,
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}
connectDB();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Profile Schema
const profileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  major: {
    type: String,
    required: true,
  },
  interests: {
    type: String,
    required: true,
  },
  hobbies: {
    type: String,
    required: true,
  },
  bio: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Profile = mongoose.model("Profile", profileSchema);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.post("/embed", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    res.json({
      embedding: response.data[0].embedding,
    });
  } catch (err) {
    console.error("OpenAI Error:", err);
    res.status(500).json({ error: "OpenAI request failed" });
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

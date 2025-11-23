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
  console.log(process.env.OPENAI_API_KEY)

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

    if (!name || !age || !major || !interests || !hobbies || !bio) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const textToEmbed = `Interests: ${interests}\nHobbies: ${hobbies}\nBio: ${bio}`;

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: textToEmbed,
    });

    const embedding = embeddingResponse.data[0].embedding;

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

app.get("/similar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const profile = await Profile.findById(id);

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    const results = await Profile.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: profile.embedding,
          numCandidates: 100,
          limit: limit + 1,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          age: 1,
          major: 1,
          interests: 1,
          hobbies: 1,
          bio: 1,
          createdAt: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    const similarProfiles = results.filter((p) => p._id.toString() !== id);

    res.json({
      originalProfile: {
        id: profile._id,
        name: profile.name,
      },
      similarProfiles: similarProfiles.slice(0, limit),
    });
  } catch (err) {
    console.error("Similar profiles search error:", err);
    res.status(500).json({ error: "Failed to find similar profiles" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'parallels';
const embeddingDim = parseInt(process.env.EMBEDDING_DIM || '1536', 10);

function randomVector(dim) {
  const v = new Array(dim).fill(0).map(() => Math.random() - 0.5);
  // normalize to unit length for cosine similarity
  const len = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / len);
}

const sampleUsers = [
  {
    name: 'Alice',
    email: 'alice@example.com',
    age: 25,
    major: 'Geography',
    hobby: 'hiking',
    bio: 'Outdoor photographer who loves trails and landscapes',
    interests: ['hiking', 'photography']
  },
  {
    name: 'Bob',
    email: 'bob@example.com',
    age: 22,
    major: 'Computer Science',
    hobby: 'gaming',
    bio: 'Indie game developer and tech enthusiast',
    interests: ['gaming', 'tech']
  },
  {
    name: 'Carol',
    email: 'carol@example.com',
    age: 29,
    major: 'Culinary Arts',
    hobby: 'travel',
    bio: 'Chef who loves exploring world cuisines',
    interests: ['cooking', 'travel']
  },
  {
    name: 'Dan',
    email: 'dan@example.com',
    age: 27,
    major: 'Music',
    hobby: 'guitar',
    bio: 'Musician and songwriter playing in local venues',
    interests: ['music', 'guitar']
  },
  {
    name: 'Eve',
    email: 'eve@example.com',
    age: 24,
    major: 'English',
    hobby: 'reading',
    bio: 'Writer and editor who enjoys short stories',
    interests: ['reading', 'writing']
  }
];

const client = new MongoClient(uri);

async function main() {
  console.log('Connecting to', uri, 'DB:', dbName);
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');

  // optional: clear existing data
  await users.deleteMany({});

  // add embeddings and timestamps
  const docs = sampleUsers.map((u) => ({
    ...u,
    embedding: randomVector(embeddingDim),
    createdAt: new Date()
  }));

  const res = await users.insertMany(docs);
  console.log('Inserted users:', Object.values(res.insertedIds));

  // basic indexes
  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ createdAt: -1 });

  console.log('\nNOTE: For vector search you must create an Atlas Search (vector) index.');
  console.log('Sample Atlas Search index definition (create this in the Atlas UI or via the Atlas Admin API):\n');
  console.log(JSON.stringify({
    mappings: {
      dynamic: false,
      fields: {
        embedding: {
          type: 'knnVector',
          dimensions: embeddingDim
        }
      }
    }
  }, null, 2));

  await client.close();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

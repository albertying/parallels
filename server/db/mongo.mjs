import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Missing MONGODB_URI in environment (set in .env)');
}

const client = new MongoClient(uri, {
  // optional: tweak options here
});

export async function getDb(dbName = process.env.MONGODB_DB || 'parallels') {
  if (!client.topology || !client.topology.isConnected()) {
    await client.connect();
  }
  return client.db(dbName);
}

export async function closeClient() {
  await client.close();
}

export { client };

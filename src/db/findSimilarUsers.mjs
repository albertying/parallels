import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGODB_DB || 'parallels';

const client = new MongoClient(uri);

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { k: 5 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--userId') opts.userId = args[++i];
    else if (a === '--vector') opts.vector = args[++i];
    else if (a === '--k') opts.k = parseInt(args[++i], 10);
  }
  return opts;
}

function parseVector(str) {
  return str.split(',').map((s) => parseFloat(s));
}

async function main() {
  const opts = parseArgs();
  await client.connect();
  const db = client.db(dbName);
  const users = db.collection('users');

  let queryVector = null;
  if (opts.userId) {
    const u = await users.findOne({ _id: new ObjectId(opts.userId) });
    if (!u) throw new Error('User not found');
    if (!u.embedding) throw new Error('User has no embedding');
    queryVector = u.embedding;
  } else if (opts.vector) {
    queryVector = parseVector(opts.vector);
  } else {
    console.error('Provide --userId <id> or --vector "v1,v2,..."');
    process.exit(1);
  }

  const k = opts.k || 5;

  // Use Atlas Search knnBeta stage. This requires an Atlas Search index (knnVector) on `embedding`.
  const pipeline = [
    {
      $search: {
        knnBeta: {
          vector: queryVector,
          path: 'embedding',
          k: k
        }
      }
    },
    { $project: { score: { $meta: 'searchScore' }, name: 1, email: 1, interests: 1 } },
    { $limit: k }
  ];

  try {
    const cursor = users.aggregate(pipeline);
    const results = await cursor.toArray();
    console.log('Top', results.length, 'matches:');
    results.forEach((r) => console.log(r));
  } catch (err) {
    console.error('Query failed. If you are not using Atlas Search with a vector index, this will fail.');
    console.error(err);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

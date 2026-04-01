import { MongoClient } from 'mongodb';

// Vercel securely injects your MONGO_URI from its environment variables
const uri = process.env.MONGO_URI;
const DB_NAME = "exam_database";
const COLLECTION_NAME = "results_2024_al_rescrutiny";

let client;
let clientPromise;

if (!uri) {
  throw new Error('Please add your Mongo URI to Vercel Environment Variables');
}

// Caching the MongoDB connection so it doesn't reconnect on every single search
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { q } = req.query;
  if (!q || q.length < 3) {
    return res.status(400).json({ error: 'Search query must be at least 3 characters' });
  }

  try {
    const database = (await clientPromise).db(DB_NAME);
    const collection = database.collection(COLLECTION_NAME);

    let results = [];
    
    // 1. Check if the user typed an Index Number (all digits)
    if (/^\d+$/.test(q)) {
      const student = await collection.findOne({ _id: q });
      if (student) results = [student];
    } 
    // 2. Otherwise, do a Fuzzy Search on the Name
    else {
      results = await collection.find({ 
        "d.nam": { $regex: q, $options: 'i' } 
      }).limit(20).toArray(); // Limit to 20 to prevent lag
    }

    res.status(200).json(results);
  } catch (e) {
    console.error("Database Error:", e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

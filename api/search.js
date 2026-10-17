import { MongoClient } from 'mongodb';

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('exam_database'); // Change to your MongoDB database name if different
  cachedDb = db;
  return db;
}

// Sri Lankan ID birthday and gender parsing logic
function parseSriLankanID(nic) {
  let year, days;
  if (!nic || (nic.length !== 12 && nic.length !== 10)) {
    return { birthday: 'N/A', gender: 'N/A' };
  }
  
  if (nic.length === 12) {
    year = parseInt(nic.substring(0, 4), 10);
    days = parseInt(nic.substring(4, 7), 10);
  } else {
    year = parseInt("19" + nic.substring(0, 2), 10);
    days = parseInt(nic.substring(2, 5), 10);
  }

  let md = days - 1;
  let gender = "Male";
  
  if (md >= 500) {
    gender = "Female";
    md = md - 500;
  }

  const date = new Date(year, 0);
  date.setDate(md + 1);
  
  return {
    birthday: date.toISOString().split('T')[0],
    gender: gender
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, examYear, username, password } = req.body;

  // Check admin privileges against Vercel Environment Variables
  const ADMIN_USER = process.env.SPECIAL_USERNAME;
  const ADMIN_PASS = process.env.SPECIAL_PASSWORD;
  const isPrivileged = (username === ADMIN_USER && password === ADMIN_PASS);

  // Map exam year to MongoDB collection names
  const validCollections = {
    "2025": "results_2025",
    "2026": "results_2026"
  };
  const collectionName = validCollections[examYear] || "results_2025";

  try {
    const db = await connectToDatabase();
    const collection = db.collection(collectionName);

    // Search query matching index number (d.ind) or NIC (d.nic)
    let dbQuery = {
      $or: [
        { "d.ind": query },
        { "d.nic": query }
      ]
    };

    // Hide records marked with `hidden: true` from normal users
    if (!isPrivileged) {
      dbQuery.hidden = { $ne: true };
    }

    const records = await collection.find(dbQuery).toArray();

    // Format records to match your database schema (`d` and `r`)
    const formattedResults = records.map(rawRecord => {
      const idInfo = parseSriLankanID(rawRecord.d.nic);
      
      return {
        indexNumber: rawRecord.d.ind,
        name: rawRecord.d.nam,
        stream: rawRecord.d.sub,
        zScore: rawRecord.d['z -'],
        districtRank: rawRecord.d.dis,
        islandRank: rawRecord.d.isl,
        results: rawRecord.r,
        
        // Sensitive fields only revealed if privileged login succeeds
        nic: isPrivileged ? rawRecord.d.nic : null,
        birthday: isPrivileged ? idInfo.birthday : null,
        gender: isPrivileged ? idInfo.gender : null,
        isPrivilegedView: isPrivileged
      };
    });

    return res.status(200).json({ success: true, data: formattedResults });
  } catch (error) {
    console.error("Database search error:", error);
    return res.status(500).json({ error: 'Database search failed' });
  }
}

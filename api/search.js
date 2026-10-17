import { MongoClient } from 'mongodb';

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGO_URI environment variable is missing.");
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('exam_database');
  cachedDb = db;
  return db;
}

function parseSriLankanID(nic) {
  let year, days;
  const nicStr = String(nic || '');
  if (nicStr.length !== 12 && nicStr.length !== 10) {
    return { birthday: 'N/A', gender: 'N/A' };
  }
  
  if (nicStr.length === 12) {
    year = parseInt(nicStr.substring(0, 4), 10);
    days = parseInt(nicStr.substring(4, 7), 10);
  } else {
    year = parseInt("19" + nicStr.substring(0, 2), 10);
    days = parseInt(nicStr.substring(2, 5), 10);
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

  const ADMIN_USER = process.env.SPECIAL_USERNAME || "admin";
  const ADMIN_PASS = process.env.SPECIAL_PASSWORD || "secret123";
  const isPrivileged = (username === ADMIN_USER && password === ADMIN_PASS);

  const validCollections = {
    "2025": "results_2025",
    "2026": "results_2026"
  };
  const collectionName = validCollections[examYear] || "results_2025";

  try {
    const db = await connectToDatabase();
    const collection = db.collection(collectionName);

    const cleanQuery = query ? query.trim() : "";
    const numericQuery = !isNaN(cleanQuery) && cleanQuery !== "" ? Number(cleanQuery) : null;

    let searchConditions = [
      { "d.ind": cleanQuery },
      { "d.nic": cleanQuery },
      { "d.nam": { $regex: cleanQuery, $options: "i" } }
    ];

    if (numericQuery !== null) {
      searchConditions.push({ "d.ind": numericQuery });
      searchConditions.push({ "d.nic": numericQuery });
    }

    let dbQuery = { $or: searchConditions };

    if (!isPrivileged) {
      dbQuery.hidden = { $ne: true };
    }

    const records = await collection.find(dbQuery).toArray();

    const formattedResults = records.map(rawRecord => {
      const fullIndex = String(rawRecord.d?.ind || '');
      // Normal users see only first 3 numbers + animated hacker dots
      const indexNumber = isPrivileged ? fullIndex : (fullIndex.slice(0, 3) + '••••••');
      
      const nicVal = rawRecord.d?.nic ? String(rawRecord.d.nic) : '';
      const idInfo = parseSriLankanID(nicVal);
      
      return {
        indexNumber,
        name: rawRecord.d?.nam,
        stream: rawRecord.d?.sub,
        zScore: rawRecord.d?.['z -'],
        districtRank: rawRecord.d?.dis,
        islandRank: rawRecord.d?.isl,
        results: rawRecord.r || [],
        
        nic: isPrivileged ? nicVal : null,
        birthday: isPrivileged ? idInfo.birthday : null,
        gender: isPrivileged ? idInfo.gender : null,
        isPrivilegedView: isPrivileged
      };
    });

    return res.status(200).json({ 
      success: true, 
      data: formattedResults, 
      isPrivileged 
    });
  } catch (error) {
    console.error("Database search critical error:", error);
    return res.status(500).json({ error: error.message || 'Database search failed' });
  }
}

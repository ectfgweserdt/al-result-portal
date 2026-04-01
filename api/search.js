import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const DB_NAME = "exam_database";
const COLLECTION_NAME = "results_2024_al_rescrutiny";

let client;
let clientPromise;

if (!uri) throw new Error('MONGO_URI missing');

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
  const { q } = req.query;
  if (!q || q.length < 3) return res.status(400).json({ error: 'Min 3 chars' });

  try {
    const database = (await clientPromise).db(DB_NAME);
    const collection = database.collection(COLLECTION_NAME);

    let rawResults = [];
    const isIndexSearch = /^\d+$/.test(q);

    if (isIndexSearch) {
      // 1. Exact Index Search
      const student = await collection.findOne({ _id: q });
      if (student) rawResults = [student];
    } else {
      // 2. INTELLIGENT NAME SEARCH
      // Splits "malidu nimsara" into ["malidu", "nimsara"] and requires ALL words to match
      const searchTerms = q.trim().split(/\s+/);
      const regexConditions = searchTerms.map(term => ({
        "d.nam": { $regex: term, $options: 'i' }
      }));
      
      rawResults = await collection.find({ $and: regexConditions })
        .sort({ "d.nam": 1 }) // Sort alphabetically to make finding names easier
        .limit(50)            // Increased limit to 50 to show more results
        .toArray();
    }

    // 3. PRIVACY & UNIQUE ID MAPPING
    const maskedResults = rawResults.map((student, index) => {
      const nic = student.d?.nic || "";
      let birthYear = "N/A";
      
      if (nic.length === 12) birthYear = nic.substring(0, 4);
      else if (nic.length === 10) birthYear = "19" + nic.substring(0, 2);

      return {
        // We create a unique hidden ID so React doesn't highlight multiple students
        _uiKey: `student_${index}_${Math.random().toString(36).substr(2, 9)}`,
        
        // This is what the user actually sees on the screen
        displayIndex: isIndexSearch ? student._id : student._id.substring(0, 3) + "****",
        
        r: student.r || [],
        d: {
          nam: student.d?.nam || "N/A",
          sub: student.d?.sub || "N/A",
          zsc: student.d?.["z -"] || student.d?.zsc || "N/A", 
          dis: student.d?.dis || "N/A",
          isl: student.d?.isl || "N/A",
          nic: isIndexSearch ? nic : nic.substring(0, 4) + "********",
          birthYear: birthYear
        }
      };
    });

    res.status(200).json(maskedResults);
  } catch (e) {
    res.status(500).json({ error: 'DB Error' });
  }
}

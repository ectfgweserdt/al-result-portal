// api/search.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, examYear, username, password } = req.body;

  // Define your admin credentials securely using Vercel Environment Variables
  const ADMIN_USER = process.env.SPECIAL_USERNAME || "admin";
  const ADMIN_PASS = process.env.SPECIAL_PASSWORD || "secret123";

  const isPrivileged = (username === ADMIN_USER && password === ADMIN_PASS);

  // Map exam year to database table name safely
  const validTables = {
    "2025": "al_results_2025",
    "2026": "al_results_2026"
  };

  const tableName = validTables[examYear] || "al_results_2025";

  try {
    // TODO: Connect to your database (e.g., Supabase, MongoDB, PostgreSQL, Firebase)
    // Example query concept: 
    // const results = await db.query(`SELECT * FROM ${tableName} WHERE index_number = $1 OR nic = $1`, [query]);

    // Mock response for demonstration:
    const mockStudent = {
      indexNumber: "1234567",
      name: "John Doe",
      nic: "200212301234", // 12-digit NIC format
      stream: "Physical Science",
      results: "A, B, C",
      // Only included if privileged login succeeds:
      phoneNumber: isPrivileged ? "0771234567" : null,
      isPrivilegedView: isPrivileged
    };

    return res.status(200).json({ success: true, data: [mockStudent] });
  } catch (error) {
    return res.status(500).json({ error: 'Database search failed' });
  }
}

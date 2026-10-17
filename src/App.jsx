import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  const [examYear, setExamYear] = useState("2025");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [darkMode, setDarkMode] = useState(true);
  
  // Special Privileges State
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const canvasRef = useRef(null);

  // Transparent Hacking / Matrix Rain Effect Hook
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]<>//\\*#@!$_';
    const alphabet = katakana + latin;

    const fontSize = 16;
    const columns = canvas.width / fontSize;
    const rainDrops = Array.from({ length: columns }).fill(1);

    const render = () => {
      ctx.fillStyle = darkMode ? 'rgba(10, 15, 30, 0.08)' : 'rgba(240, 244, 248, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = darkMode ? '#00ff66' : '#008833'; 
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < rainDrops.length; i++) {
        const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        ctx.fillText(text, i * fontSize, rainDrops[i] * fontSize);

        if (rainDrops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i]++;
      }
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [darkMode]);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          examYear,
          username,
          password
        })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
      }
    } catch (err) {
      console.error("Search error", err);
    }
  };

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <canvas ref={canvasRef} className="hacking-canvas" />

      <header className="header">
        <div className="logo">🛡️ A/L Result Portal</div>
        <div className="nav-controls">
          <select value={examYear} onChange={(e) => setExamYear(e.target.value)} className="year-selector">
            <option value="2025">2025 A/L Exam</option>
            <option value="2026">2026 A/L Exam</option>
          </select>
          <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle">
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button onClick={() => setShowLogin(!showLogin)} className="admin-toggle-btn">
            {isLoggedIn ? '🔓 Admin Active' : '🔒 Admin Login'}
          </button>
        </div>
      </header>

      {showLogin && !isLoggedIn && (
        <div className="login-modal">
          <h3>Special Privileges</h3>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          <button onClick={() => setShowLogin(false)}>Confirm Credentials</button>
        </div>
      )}

      <main className="main-content">
        <h1>Advanced Level Result Portal</h1>
        <p>Active Exam Database: <strong>{examYear}</strong></p>

        <form onSubmit={handleSearch} className="search-box">
          <input 
            type="text" 
            placeholder="Enter Index Number or NIC..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
          <button type="submit">Search Result</button>
        </form>

        <div className="results-container">
          {results.map((student, idx) => (
            <div key={idx} className="result-card">
              <h2>{student.name}</h2>
              <div className="meta-grid">
                <p><strong>Index:</strong> {student.indexNumber}</p>
                <p><strong>Stream:</strong> {student.stream}</p>
                <p><strong>Z-Score:</strong> {student.zScore}</p>
                <p><strong>District Rank:</strong> {student.districtRank}</p>
                <p><strong>Island Rank:</strong> {student.islandRank}</p>
              </div>

              <div className="subjects-list">
                <h4>Subject Results:</h4>
                <ul>
                  {student.results?.map((sub, sIdx) => (
                    <li key={sIdx}><span>{sub.s}</span> <strong>{sub.g}</strong></li>
                  ))}
                </ul>
              </div>

              {/* Special Privileges View */}
              {student.isPrivilegedView && (
                <div className="privileged-data">
                  <h4>🔒 Privileged Details</h4>
                  <p><strong>NIC Number:</strong> {student.nic}</p>
                  <p><strong>Calculated Birthday:</strong> {student.birthday}</p>
                  <p><strong>Gender:</strong> {student.gender}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

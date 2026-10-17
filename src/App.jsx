import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  const [examYear, setExamYear] = useState("2025");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Admin & Privileges State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");

  const canvasRef = useRef(null);

  // Transparent Matrix Hacking Rain Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]<>//\\*#@!$_';
    const alphabet = katakana + latin;

    const fontSize = 15;
    const columns = canvas.width / fontSize;
    const rainDrops = Array.from({ length: columns }).fill(1);

    const render = () => {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.08)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00ff66'; 
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
  }, []);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError("Please enter both username and password.");
      return;
    }
    // We test credentials with an immediate search trigger or token verification
    setIsLoggedIn(true);
    setLoginError("");
    setLoginSuccess("Privileges unlocked successfully!");
    setTimeout(() => {
      setShowLoginModal(false);
      setLoginSuccess("");
    }, 1500);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          examYear,
          username,
          password
        })
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data);
        if (data.isPrivileged && username) {
          setIsLoggedIn(true);
        }
      }
    } catch (err) {
      console.error("Search error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <canvas ref={canvasRef} className="hacking-canvas" />

      <header className="header">
        <div className="logo-area">
          <span className="logo-icon">🛡️</span>
          <div>
            <h2>National A/L Portal</h2>
            <p>Advanced Examination Database</p>
          </div>
        </div>
        <div className="nav-controls">
          <div className="select-wrapper">
            <select value={examYear} onChange={(e) => setExamYear(e.target.value)} className="year-selector">
              <option value="2025">2025 Examination</option>
              <option value="2026">2026 Examination</option>
            </select>
          </div>
          <button 
            onClick={() => setShowLoginModal(!showLoginModal)} 
            className={`admin-toggle-btn ${isLoggedIn ? 'active' : ''}`}
          >
            {isLoggedIn ? '🔓 Privileges Active' : '🔒 Secure Login'}
          </button>
        </div>
      </header>

      {showLoginModal && (
        <div className="modal-backdrop">
          <div className="login-modal">
            <div className="modal-header">
              <h3>Special Privilege Access</h3>
              <button className="close-btn" onClick={() => setShowLoginModal(false)}>✕</button>
            </div>
            <p className="modal-desc">Enter authorization credentials to reveal restricted records, NIC numbers, and calculated birthdates.</p>
            
            <form onSubmit={handleLoginSubmit} className="login-form">
              <input 
                type="text" 
                placeholder="Username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
              />
              {loginError && <p className="error-text">{loginError}</p>}
              {loginSuccess && <p className="success-text">{loginSuccess}</p>}
              <button type="submit" className="tactile-btn">Authorize Session</button>
            </form>
          </div>
        </div>
      )}

      <main className="main-content">
        <div className="hero-section">
          <h1>Examination Result Query System</h1>
          <p>Target Database Collection: <strong>results_{examYear}</strong></p>
        </div>

        <form onSubmit={handleSearch} className="search-box-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Enter Index Number (e.g. 5000998) or NIC..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
            />
          </div>
          <button type="submit" className="tactile-btn search-btn" disabled={loading}>
            {loading ? 'Searching...' : 'Search Record'}
          </button>
        </form>

        <div className="results-container">
          {loading && <div className="loading-state">Querying secure database...</div>}

          {!loading && hasSearched && results.length === 0 && (
            <div className="no-results-card">
              <p>No matching student record found or record is restricted.</p>
            </div>
          )}

          {!loading && results.map((student, idx) => (
            <div key={idx} className="result-card">
              <div className="student-header">
                <h3>{student.name}</h3>
                <span className="index-badge">Index: {student.indexNumber}</span>
              </div>

              <div className="meta-grid">
                <div className="meta-item">
                  <span className="label">Stream</span>
                  <span className="value">{student.stream}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Z-Score</span>
                  <span className="value">{student.zScore}</span>
                </div>
                <div className="meta-item">
                  <span className="label">District Rank</span>
                  <span className="value">{student.districtRank}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Island Rank</span>
                  <span className="value">{student.islandRank}</span>
                </div>
              </div>

              <div className="subjects-section">
                <h4>Subject Breakdown</h4>
                <div className="subjects-grid">
                  {student.results?.map((sub, sIdx) => (
                    <div key={sIdx} className="subject-item">
                      <span className="sub-name">{sub.s}</span>
                      <span className={`sub-grade grade-${sub.g}`}>{sub.g}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Privileged View */}
              {student.isPrivilegedView && (
                <div className="privileged-data-box">
                  <div className="priv-header">
                    <span>🔓 Authorized Privileged Insights</span>
                  </div>
                  <div className="priv-grid">
                    <p><strong>NIC Number:</strong> {student.nic}</p>
                    <p><strong>Calculated Birthday:</strong> {student.birthday}</p>
                    <p><strong>Gender:</strong> {student.gender}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

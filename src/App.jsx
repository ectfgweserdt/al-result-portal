import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  const [examYear, setExamYear] = useState("2025");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Admin & Privileges State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [alreadyGrantedPopup, setAlreadyGrantedPopup] = useState(false);

  const canvasRef = useRef(null);

  // Deep OLED Hacker Matrix & Gas Animation Effect
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
      ctx.fillStyle = 'rgba(1, 3, 8, 0.08)';
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

  const handleLoginClick = () => {
    if (isLoggedIn) {
      setAlreadyGrantedPopup(true);
      setTimeout(() => setAlreadyGrantedPopup(false), 3500);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setLoginError("Please provide credentials.");
      return;
    }

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test', examYear, username, password })
      });
      const data = await res.json();
      
      if (data.isPrivileged) {
        setIsLoggedIn(true);
        setLoginError("");
        setLoginSuccess("Access granted. Privileges unlocked.");
        setTimeout(() => {
          setShowLoginModal(false);
          setLoginSuccess("");
        }, 1500);
      } else {
        // Wrong credentials: pop down and erase details
        setLoginError("Invalid credentials. Access denied.");
        setUsername("");
        setPassword("");
        setTimeout(() => {
          setShowLoginModal(false);
          setLoginError("");
        }, 2000);
      }
    } catch (err) {
      setLoginError("Authorization server error.");
      setUsername("");
      setPassword("");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setSelectedIdx(0);
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
      }
    } catch (err) {
      console.error("Search error", err);
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = results[selectedIdx];

  return (
    <div className="app-container">
      <canvas ref={canvasRef} className="hacking-canvas" />
      <div className="ambient-glow"></div>

      <header className="header">
        <div className="logo-area">
          <span className="logo-icon">🛡️</span>
          <div>
            <h2>National Examination Portal</h2>
            <p>Secure Academic Directory</p>
          </div>
        </div>
        <div className="nav-controls">
          <div className="custom-dropdown">
            <div className="dropdown-selected" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <span>{examYear} Examination</span>
              <span className={`arrow ${isDropdownOpen ? 'open' : ''}`}>▾</span>
            </div>
            <div className={`dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
              <div onClick={() => { setExamYear("2025"); setIsDropdownOpen(false); }}>2025 Examination</div>
              <div onClick={() => { setExamYear("2026"); setIsDropdownOpen(false); }}>2026 Examination</div>
            </div>
          </div>

          <button 
            onClick={handleLoginClick} 
            className={`admin-toggle-btn ${isLoggedIn ? 'active' : ''}`}
          >
            {isLoggedIn ? '🔓 Privileged Session' : '🔒 Secure Login'}
          </button>
        </div>
      </header>

      {alreadyGrantedPopup && (
        <div className="floating-toast">
          <span>⚠️ Access already granted, Administrator. Session active.</span>
        </div>
      )}

      {showLoginModal && (
        <div className="modal-backdrop">
          <div className="login-modal">
            <div className="modal-header">
              <h3>Administrator Authorization</h3>
              <button className="close-btn" onClick={() => setShowLoginModal(false)}>✕</button>
            </div>
            <p className="modal-desc">Enter security credentials to decrypt privileged student records and identities.</p>
            
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
              <button type="submit" className="tactile-btn">Authenticate</button>
            </form>
          </div>
        </div>
      )}

      <main className="main-content">
        <div className="hero-section">
          <h1>Explore Academic Records</h1>
          <p>Search by student name, index number, or NIC number.</p>
        </div>

        <form onSubmit={handleSearch} className="search-box-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Search name, index, or NIC..." 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
            />
          </div>
          <button type="submit" className="tactile-btn search-btn" disabled={loading}>
            {loading ? 'Searching...' : 'Search Record'}
          </button>
        </form>

        {loading && <div className="loading-state">Querying encrypted database...</div>}

        {!loading && hasSearched && results.length === 0 && (
          <div className="no-results-card">
            <p>No matching record found or record is restricted.</p>
          </div>
        )}

        {/* Split Screen Master-Detail Layout */}
        {!loading && results.length > 0 && (
          <div className="split-screen-container">
            {/* Left Side: Student List (Independently Scrollable) */}
            <div className="left-student-list">
              <div className="list-header">Search Results ({results.length})</div>
              {results.map((student, idx) => (
                <div 
                  key={idx} 
                  className={`student-list-item ${selectedIdx === idx ? 'active' : ''}`}
                  onClick={() => setSelectedIdx(idx)}
                >
                  <h4>{student.name}</h4>
                  <div className="item-sub">
                    <span>Index: <span className="masked-index">{student.indexNumber}</span></span>
                    <span className="stream-tag">{student.stream}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Side: Detailed View (Fixed, Independent of Left Scroll) */}
            <div className="right-student-detail">
              {selectedStudent ? (
                <div className="result-card">
                  <div className="student-header">
                    <h3>{selectedStudent.name}</h3>
                    <span className="index-badge">Index: {selectedStudent.indexNumber}</span>
                  </div>

                  <div className="meta-grid">
                    <div className="meta-item">
                      <span className="label">Stream</span>
                      <span className="value">{selectedStudent.stream}</span>
                    </div>
                    <div className="meta-item">
                      <span className="label">Z-Score</span>
                      <span className="value">{selectedStudent.zScore}</span>
                    </div>
                    <div className="meta-item">
                      <span className="label">District Rank</span>
                      <span className="value">{selectedStudent.districtRank}</span>
                    </div>
                    <div className="meta-item">
                      <span className="label">Island Rank</span>
                      <span className="value">{selectedStudent.islandRank}</span>
                    </div>
                  </div>

                  <div className="subjects-section">
                    <h4>Subject Breakdown</h4>
                    <div className="subjects-grid">
                      {selectedStudent.results?.map((sub, sIdx) => (
                        <div key={sIdx} className="subject-item">
                          <span className="sub-name">{sub.s}</span>
                          <span className="sub-grade">{sub.g}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedStudent.isPrivilegedView && (
                    <div className="privileged-data-box">
                      <div className="priv-header">
                        <span>🔓 Authorized Privileged Decryption</span>
                      </div>
                      <div className="priv-grid">
                        <p><strong>NIC Number:</strong> {selectedStudent.nic}</p>
                        <p><strong>Calculated Birthday:</strong> {selectedStudent.birthday}</p>
                        <p><strong>Gender:</strong> {selectedStudent.gender}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="select-prompt">Select a student record from the left directory.</div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="footer-syndicate">
        <p>Secured & Maintained by <strong>Dark Devil</strong> // Elite Syndicate</p>
      </footer>
    </div>
  );
}

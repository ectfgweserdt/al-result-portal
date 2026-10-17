import React, { useState, useEffect, useRef } from 'react';
import './App.css';

export default function App() {
  const [examYear, setExamYear] = useState("2025");
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

  // Matrix Falling Symbols Canvas Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const katakana = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン';
    const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789{}[]<>//\\*#@!$_';
    const alphabet = katakana + latin;

    const fontSize = 15;
    const columns = Math.floor(canvas.width / fontSize);
    const rainDrops = Array.from({ length: columns }).fill(1);

    const render = () => {
      ctx.fillStyle = 'rgba(1, 3, 8, 0.18)'; 
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

  const toggleHideStudent = async (targetIndex, currentHiddenStatus) => {
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleHide',
          examYear,
          username,
          password,
          targetIndex,
          hiddenStatus: !currentHiddenStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setResults(prev => prev.map(s => s.fullIndex === targetIndex ? { ...s, hidden: !currentHiddenStatus } : s));
      }
    } catch (err) {
      console.error("Toggle hide error", err);
    }
  };

  const selectedStudent = results[selectedIdx];

  return (
    <div className="app-container">
      <canvas ref={canvasRef} className="hacking-canvas" />
      <div className="ambient-glow"></div>

      <header className="header">
        <div className="logo-area">
          <svg className="css-icon shield-icon" viewBox="0 0 24 24" width="26" height="26" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          <div>
            <h2>National Examination Portal</h2>
            <p>Secure Academic Directory</p>
          </div>
        </div>

        <div className="nav-controls">
          {/* Cyber Year Selector Buttons for 2025, 2026, and 2027 */}
          <div className="year-tabs">
            <button 
              type="button" 
              className={`year-tab ${examYear === '2025' ? 'active' : ''}`}
              onClick={() => setExamYear('2025')}
            >
              2025
            </button>
            <button 
              type="button" 
              className={`year-tab ${examYear === '2026' ? 'active' : ''}`}
              onClick={() => setExamYear('2026')}
            >
              2026
            </button>
            <button 
              type="button" 
              className={`year-tab ${examYear === '2027' ? 'active' : ''}`}
              onClick={() => setExamYear('2027')}
            >
              2027
            </button>
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
        <div className="modal-backdrop" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
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
          <p>Target Collection: <strong>results_{examYear}</strong></p>
        </div>

        <form onSubmit={handleSearch} className="search-box-container">
          <div className="search-input-wrapper">
            <svg className="css-icon search-icon" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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

        {!loading && results.length > 0 && (
          <div className="split-screen-container">
            {/* Left Column: Student List */}
            <div className="left-student-list">
              <div className="list-header">Search Results ({results.length})</div>
              {results.map((student, idx) => (
                <div 
                  key={idx} 
                  className={`student-list-item ${selectedIdx === idx ? 'active' : ''} ${student.hidden ? 'hidden-item' : ''}`}
                  onClick={() => setSelectedIdx(idx)}
                >
                  <h4>{student.name} {student.hidden && <span className="hidden-tag">[HIDDEN]</span>}</h4>
                  <div className="item-sub">
                    <span>Index: <span className="masked-index">{student.indexNumber}</span></span>
                    <span className="stream-tag">{student.stream}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Student Result Sheet */}
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
                        <span>🔓 Authorized Privileged Decryption & Controls</span>
                      </div>
                      <div className="priv-grid">
                        <p><strong>NIC Number:</strong> {selectedStudent.nic}</p>
                        <p><strong>Calculated Birthday:</strong> {selectedStudent.birthday}</p>
                        <p><strong>Gender:</strong> {selectedStudent.gender}</p>
                        <div className="admin-action-row">
                          <button 
                            className={`hide-toggle-btn ${selectedStudent.hidden ? 'unhide' : 'hide'}`}
                            onClick={() => toggleHideStudent(selectedStudent.fullIndex, selectedStudent.hidden)}
                          >
                            {selectedStudent.hidden ? '👁️ Unhide from Public Search' : '🔒 Hide from Public Search'}
                          </button>
                        </div>
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
        <div className="scared-footer-text">
          <span>Executed & Controlled by</span> <span className="glitch-nickname">Dark Devil</span>
        </div>
      </footer>
    </div>
  );
}

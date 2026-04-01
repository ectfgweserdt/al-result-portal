import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, BrainCircuit, Loader2, AlertTriangle, Zap, Calendar } from 'lucide-react';

// This helper function safely grabs your Gemini Key from Vercel's settings
const getApiKey = () => {
  try { return [import.meta.env.VITE_GEMINI_KEY || ""]; } 
  catch (e) { return [""]; }
};

const GEMINI_KEYS = getApiKey();

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [aiCache, setAiCache] = useState({});
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Load AI reports from local storage to save API credits
  useEffect(() => {
    const saved = localStorage.getItem('ai_analysis_cache');
    if (saved) setAiCache(JSON.parse(saved));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm || searchTerm.length < 3) {
      setError("Please enter at least 3 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // 🚀 REAL PRODUCTION API CALL 🚀
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search database.");
      }

      if (data.length === 0) {
        setError("No students found matching that Index or Name.");
        setResults([]);
      } else {
        setResults(data);
        if (data.length === 1) setSelectedStudent(data[0]);
      }
    } catch (err) {
      setError("Database connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getAIAnalysis = async (student) => {
    if (aiCache[student._id]) return;

    setAnalyzing(true);
    const key = GEMINI_KEYS[0]; 
    
    if (!key) {
      setError("AI Key not found. Please check Vercel Environment Variables.");
      setAnalyzing(false);
      return;
    }

    // Creating a clean prompt using the mapped data from your backend
    const studentData = `Name: ${student.d.nam}, Stream: ${student.d.sub}, Z-Score: ${student.d.zsc}, Results: ${JSON.stringify(student.r)}`;
    const prompt = `Based on these Sri Lankan A/L results, provide exactly 3 sentences of encouraging career or university advice: ${studentData}`;

    try {
      // Updated to standard 1.5-flash which is more stable
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: prompt }] }] 
        })
      });
      
      const data = await response.json();
      
      if (response.status === 429) {
        throw new Error("AI Limit reached for this minute. Please wait 60 seconds.");
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) throw new Error("Could not generate advice.");
      
      const newCache = { ...aiCache, [student._id]: text };
      setAiCache(newCache);
      localStorage.setItem('ai_analysis_cache', JSON.stringify(newCache));
    } catch (err) {
      setError(err.message || "AI Service is currently busy.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl">
              <GraduationCap className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">AL-INSIGHT SL</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">2025 Exam Intelligence</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">System Online</span>
          </div>
        </header>

        {/* Search Input */}
        <div className="bg-white p-2 rounded-3xl shadow-xl mb-10 border border-slate-100">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="pl-6 text-slate-300"><Search /></div>
            <input
              type="text"
              placeholder="Search Name or Index..."
              className="w-full p-4 md:p-6 outline-none text-lg font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="bg-indigo-600 text-white px-8 py-4 md:py-5 rounded-2xl font-bold shadow-lg transition-transform active:scale-95">
              {loading ? <Loader2 className="animate-spin" /> : "SEARCH"}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Results List */}
          <div className="lg:col-span-4 space-y-3">
            {results.map(s => (
              <div 
                key={s._id} 
                onClick={() => setSelectedStudent(s)}
                className={`p-5 rounded-2xl cursor-pointer transition-all border-2 ${selectedStudent?._id === s._id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg translate-x-2' : 'bg-white border-transparent hover:border-slate-200 shadow-sm'}`}
              >
                <p className="font-bold uppercase text-xs truncate">{s.d.nam}</p>
                <div className="flex items-center gap-3 mt-1 opacity-60 text-[10px] font-bold uppercase">
                   <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {s.d.birthYear}</span>
                   <span>ID: {s._id}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Display */}
          <div className="lg:col-span-8">
            {selectedStudent ? (
              <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-50">
                <div className="p-8 md:p-10 bg-slate-900 text-white">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black bg-indigo-500 px-3 py-1 rounded-full uppercase tracking-widest">{selectedStudent.d.sub}</span>
                    <span className="text-[10px] font-bold opacity-50 uppercase">Born: {selectedStudent.d.birthYear}</span>
                  </div>
                  <h2 className="text-2xl font-black uppercase mb-8 leading-tight tracking-tight">{selectedStudent.d.nam}</h2>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                      <p className="text-[9px] uppercase opacity-50 font-black mb-1">Z-Score</p>
                      <p className="text-2xl font-black text-indigo-400">{selectedStudent.d.zsc}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                      <p className="text-[9px] uppercase opacity-50 font-black mb-1">Dist. Rank</p>
                      <p className="text-2xl font-black">#{selectedStudent.d.dis}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center">
                      <p className="text-[9px] uppercase opacity-50 font-black mb-1">Island Rank</p>
                      <p className="text-2xl font-black text-slate-400">#{selectedStudent.d.isl}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 md:p-10">
                  <div className="space-y-2 mb-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Exam Results</h4>
                    {selectedStudent.r.map((r, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700 text-xs">{r.s}</span>
                        <span className={`font-black text-sm ${r.g === 'A' ? 'text-green-600' : 'text-indigo-600'}`}>{r.g}</span>
                      </div>
                    ))}
                  </div>

                  {!aiCache[selectedStudent._id] ? (
                    <button 
                      disabled={analyzing}
                      onClick={() => getAIAnalysis(selectedStudent)}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl transition-all"
                    >
                      {analyzing ? <Loader2 className="animate-spin" /> : <BrainCircuit className="w-5 h-5"/>}
                      {analyzing ? "AI GENERATING..." : "GENERATE CAREER ADVICE"}
                    </button>
                  ) : (
                    <div className="p-6 bg-indigo-50 rounded-2xl border-2 border-indigo-100 relative overflow-hidden animate-in fade-in zoom-in duration-300">
                      <Zap className="absolute -right-4 -top-4 w-20 h-20 text-indigo-100/50 rotate-12" />
                      <p className="relative z-10 text-indigo-950 font-semibold text-sm leading-relaxed">
                        {aiCache[selectedStudent._id]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-300 p-10 text-center">
                <Search className="opacity-10 mb-4 w-12 h-12" />
                <p className="text-sm font-bold uppercase tracking-widest">Select a student profile to view insights</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

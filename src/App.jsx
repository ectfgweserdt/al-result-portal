import React, { useState, useEffect } from 'react';
import { Search, GraduationCap, BrainCircuit, Loader2, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';

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

  // Load any previously generated AI advice from the browser's memory
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
    setResults([]);
    setSelectedStudent(null);
    
    try {
      // 🚀 CALLS YOUR BACKEND API (search.js) 🚀
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to search database.");
      }

      if (data.length === 0) {
        setError("No students found matching that Index or Name.");
      } else {
        if (data.length === 1) setSelectedStudent(data[0]);
        setResults(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAIAnalysis = async (student) => {
    if (aiCache[student._id]) return;

    setAnalyzing(true);
    const key = GEMINI_KEYS[Math.floor(Math.random() * GEMINI_KEYS.length)]; 
    
    if (!key) {
      setError("AI Key not configured. Set VITE_GEMINI_KEY in Vercel settings.");
      setAnalyzing(false);
      return;
    }

    const prompt = `Student: ${student.d.nam}. Results: ${JSON.stringify(student.r)}. Z-Score: ${student.d.zsc}. 
    Provide a 3-sentence encouraging career advice for this Sri Lankan student based on these A-Level results.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-lite:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Report unavailable.";
      
      const newCache = { ...aiCache, [student._id]: text };
      setAiCache(newCache);
      localStorage.setItem('ai_analysis_cache', JSON.stringify(newCache));
    } catch (err) {
      setError("AI Limit Reached. Please try again later.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 p-4 md:p-10">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl">
              <GraduationCap className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">AL-INSIGHT SL</h1>
              <p className="text-slate-500 text-sm">2024 Exam Intelligence</p>
            </div>
          </div>
          <div className="px-4 py-2 bg-white rounded-full border border-slate-200 shadow-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live Database Connected</span>
          </div>
        </div>

        {/* Search Input Area */}
        <div className="bg-white p-2 rounded-3xl shadow-2xl mb-10 border border-slate-100">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="pl-6 text-slate-300"><Search /></div>
            <input
              type="text"
              placeholder="Search by Name or Index Number..."
              className="w-full p-4 md:p-6 outline-none text-lg font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="bg-indigo-600 text-white px-8 py-4 md:py-5 rounded-2xl font-bold shadow-lg transition-transform active:scale-95">
              {loading ? <Loader2 className="animate-spin" /> : "FIND"}
            </button>
          </form>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Results Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {results.map(s => (
              <div 
                key={s._id} 
                onClick={() => setSelectedStudent(s)}
                className={`p-6 rounded-3xl cursor-pointer transition-all border-2 ${selectedStudent?._id === s._id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl translate-x-1' : 'bg-white border-transparent hover:border-slate-200'}`}
              >
                <p className="font-bold uppercase text-sm">{s.d.nam}</p>
                <p className="text-xs opacity-60">Index: {s._id} | NIC: {s.d.nic || 'N/A'}</p>
              </div>
            ))}
          </div>

          {/* Detailed View Area */}
          <div className="lg:col-span-8">
            {selectedStudent ? (
              <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-50 animate-in slide-in-from-bottom-4 duration-500">
                <div className="p-8 md:p-12 bg-slate-900 text-white">
                  <span className="text-[10px] font-bold bg-indigo-500 px-2 py-1 rounded mb-4 inline-block">{selectedStudent.d.sub} STREAM</span>
                  <h2 className="text-3xl font-black uppercase mb-6 leading-tight">{selectedStudent.d.nam}</h2>
                  <div className="flex gap-10">
                    <div>
                      <p className="text-[10px] uppercase opacity-50 font-bold">Z-Score</p>
                      <p className="text-4xl font-black text-indigo-400">{selectedStudent.d.zsc || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase opacity-50 font-bold">Island Rank</p>
                      <p className="text-4xl font-black">#{selectedStudent.d.isl || '---'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 md:p-12">
                  <div className="space-y-3 mb-10">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Results Detail</h4>
                    {selectedStudent.r.map((r, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                        <span className="font-bold text-slate-600 text-sm">{r.s}</span>
                        <span className="font-black text-indigo-600">{r.g}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI Button/Display */}
                  {!aiCache[selectedStudent._id] ? (
                    <button 
                      disabled={analyzing}
                      onClick={() => getAIAnalysis(selectedStudent)}
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-indigo-100"
                    >
                      {analyzing ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
                      GENERATE CAREER ADVICE
                    </button>
                  ) : (
                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100 relative overflow-hidden">
                      <Zap className="absolute -right-6 -top-6 w-24 h-24 text-indigo-100 rotate-12" />
                      <p className="relative z-10 text-indigo-900 font-medium leading-relaxed">
                        {aiCache[selectedStudent._id]}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 text-slate-400 p-10 text-center">
                <Search className="opacity-20 mb-4 w-12 h-12" />
                <p className="text-sm font-bold">Search and select a student to see the breakdown</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

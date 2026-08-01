import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Shield, AlertTriangle, CheckCircle, Search, Link as LinkIcon, FileText, 
  History, Info, ExternalLink, LogOut, User as UserIcon, MessageSquare, 
  Flag, Share2, BarChart3, ShieldCheck, Activity, Lock, Globe, X, Send, RefreshCw, UploadCloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Login from './components/Login';
import Register from './components/Register';
import AdminDashboard from './components/AdminDashboard';
import './App.css';
import { initParticlesEngine, Particles } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

import { API_BASE_URL } from './config';

const API_URL = API_BASE_URL;

function App() {
  const [init, setInit] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  // this should be run only once per application lifetime
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);
  const [scanType, setScanType] = useState('url');
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [isReporting, setIsReporting] = useState(false);
  const [history, setHistory] = useState([]);
  const [view, setView] = useState(user ? 'home' : 'login');
  
  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { type: 'ai', text: 'Hello! I am your AI Security Assistant. Need help understanding a scan result?' }
  ]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (user) fetchHistory();
    else setHistory([]);
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/history`, getAuthHeaders());
      setHistory(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setView('login');
      }
    }
  };

  const [isDragOver, setIsDragOver] = useState(false);

  const handleTabChange = (type) => {
    setScanType(type);
    setInput('');
    setImageFile(null);
    setResult(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    setIsScanning(true);
    setResult(null);
    try {
      let res;
      if (scanType === 'image') {
        if (!imageFile) {
          alert('Please select an image file to scan.');
          setIsScanning(false);
          return;
        }
        const formData = new FormData();
        formData.append('image', imageFile);
        res = await axios.post(`${API_URL}/scan-image`, formData, getAuthHeaders());
      } else {
        res = await axios.post(`${API_URL}/scan`, { type: scanType, content: input }, getAuthHeaders());
      }
      setResult(res.data);
      fetchHistory();
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setView('login');
        alert('Your session has expired. Please log in again.');
      } else {
        alert(err.response?.data?.error || 'Scan failed.');
      }
    } finally { setIsScanning(false); }
  };

  const handleReport = async () => {
    if (!result?._id) return;
    setIsReporting(true);
    try {
      await axios.post(`${API_URL}/report/${result._id}`, {}, getAuthHeaders());
      setResult({ ...result, reportedByCommunity: true, reportCount: (result.reportCount || 0) + 1 });
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setView('login');
      } else {
        alert('Already reported.');
      }
    } finally { setIsReporting(false); }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = { type: 'user', text: chatInput };
    setChatMessages([...chatMessages, userMsg]);
    setChatInput('');
    
    // Show "typing" indicator
    setChatMessages(prev => [...prev, { type: 'ai', text: '...' }]);
    
    try {
      const res = await axios.post(`${API_URL}/chat`, { 
        message: chatInput,
        scanContext: result // Pass the latest scan result for context
      }, getAuthHeaders());

      setChatMessages(prev => {
        const withoutDots = prev.slice(0, -1);
        return [...withoutDots, { type: 'ai', text: res.data.text }];
      });
    } catch (err) {
      setChatMessages(prev => {
        const withoutDots = prev.slice(0, -1);
        return [...withoutDots, { 
          type: 'ai', 
          text: err.response?.data?.error || "I couldn't connect to my brain. Please check your API key in the .env file." 
        }];
      });
    }
  };

  const stats = {
    total: history.length,
    malicious: history.filter(h => h.riskLevel === 'Malicious').length,
    safe: history.filter(h => h.riskLevel === 'Safe').length
  };

  if (view === 'login') return <Login onLogin={(u) => { setUser(u); setView('home'); }} onSwitch={() => setView('register')} />;
  if (view === 'register') return <Register onRegister={(u) => { setUser(u); setView('home'); }} onSwitch={() => setView('login')} />;

  return (
    <div className="app-wrapper">
      {init && (
        <Particles
          id="tsparticles"
          options={{
            background: { color: { value: "transparent" } },
            fpsLimit: 120,
            interactivity: {
              events: { onHover: { enable: true, mode: "grab" } },
              modes: { grab: { distance: 140, links: { opacity: 0.5 } } }
            },
            particles: {
              color: { value: "#3B82F6" },
              links: { color: "#3B82F6", distance: 150, enable: true, opacity: 0.2, width: 1 },
              move: { enable: true, speed: 0.6, direction: "none", outModes: { default: "out" } },
              number: { density: { enable: true, area: 800 }, value: 50 },
              opacity: { value: 0.3 },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 3 } }
            },
            detectRetina: true,
          }}
        />
      )}
      <div className="background-decor-overlay">
        <div className="glow-blob" style={{ top: '10%', left: '10%' }}></div>
        <div className="glow-blob" style={{ bottom: '20%', right: '15%', animationDelay: '-5s' }}></div>
      </div>

      <nav className="navbar container">
        <div className="logo" onClick={() => setView('home')} style={{ cursor: 'pointer' }}>
          <Shield className="logo-icon" color="var(--primary)" size={28} />
          <span>Cyber Guard</span>
        </div>
        <div className="nav-links">
          <button onClick={() => setView('home')} className={view === 'home' ? 'active' : ''}>
            <Search size={16} /> Scanner
          </button>
          <button onClick={() => setView('history')} className={view === 'history' ? 'active' : ''}>
            <BarChart3 size={16} /> Dashboard
          </button>
          {user?.role === 'admin' && (
            <button onClick={() => setView('admin')} className={view === 'admin' ? 'active alert-link' : 'alert-link'}>
              <ShieldCheck size={16} /> Admin Panel
            </button>
          )}
        </div>
        <div className="auth-nav">
          {user && (
            <div className="user-profile glass-card">
              <div className="user-info">
                <UserIcon size={16} color="var(--primary)" />
                <span className="user-name">{user.username}</span>
                <span className="role-tag">{user.role}</span>
              </div>
              <button 
                onClick={() => { localStorage.clear(); setUser(null); setView('login'); }} 
                className="logout-btn"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="container main-content">
        <AnimatePresence mode="wait">
          {view === 'admin' ? (
            <AdminDashboard key="admin" />
          ) : view === 'history' ? (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="history-section">
              <div className="analytics-grid">
                <div className="stat-card glass-card">
                  <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}><Activity color="var(--primary)" /></div>
                  <div className="stat-info"><span className="stat-label">Global Scans</span><span className="stat-value">{stats.total}</span></div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}><Shield color="var(--danger)" /></div>
                  <div className="stat-info"><span className="stat-label">Threats Blocked</span><span className="stat-value">{stats.malicious}</span></div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)' }}><Globe color="var(--safe)" /></div>
                  <div className="stat-info"><span className="stat-label">Safe Verified</span><span className="stat-value">{stats.safe}</span></div>
                </div>
              </div>
              
              <div className="history-header">
                <h2>Scan Repository</h2>
                <p>Detailed historical analysis of your digital interactions.</p>
              </div>
              <div className="history-grid">
                {history.map(item => (
                  <div key={item._id} className="history-item glass-card" onClick={() => setResult(item)} style={{ cursor: 'pointer' }}>
                    <div className="item-type">{item.type.toUpperCase()}</div>
                    <p className="item-content">{item.content.substring(0, 80)}...</p>
                    <div className="item-footer">
                      <span style={{ color: `var(--${item.riskLevel.toLowerCase()})`, fontWeight: 700 }}>{item.riskLevel}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="hero-section">
              <div className="header-text">
                <h1>Detect Phishing Links & Online Scams Instantly</h1>
                <p>Analyze URLs, messages, and WhatsApp scams using AI-powered security detection.</p>
              </div>

              <div className="scanner-container glass-card">
                <div className="tab-buttons">
                  <button className={scanType === 'url' ? 'tab-btn active' : 'tab-btn'} onClick={() => handleTabChange('url')}><LinkIcon size={20} /> URL</button>
                  <button className={scanType === 'text' ? 'tab-btn active' : 'tab-btn'} onClick={() => handleTabChange('text')}><FileText size={20} /> Text</button>
                  <button className={scanType === 'whatsapp' ? 'tab-btn active' : 'tab-btn'} onClick={() => handleTabChange('whatsapp')}><MessageSquare size={20} color="#22C55E" /> WhatsApp</button>
                  <button className={scanType === 'image' ? 'tab-btn active' : 'tab-btn'} onClick={() => handleTabChange('image')}><Activity size={20} /> OCR</button>
                </div>

                <form onSubmit={handleScan} className="scan-form">
                  {scanType === 'image' ? (
                    <div 
                      className={`file-upload-container ${isDragOver ? 'drag-over' : ''}`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setImageFile(e.target.files[0])} 
                        id="image-upload"
                        className="file-upload-input"
                        required
                      />
                      <label htmlFor="image-upload" className="file-upload-label">
                        <UploadCloud size={40} className="upload-icon" />
                        {imageFile ? (
                          <div className="selected-file-info">
                            <span className="file-name">{imageFile.name}</span>
                            <span className="file-size">({(imageFile.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        ) : (
                          <>
                            <span className="upload-title">Upload Screenshot / Image</span>
                            <span className="upload-subtitle">Drag and drop or click to browse</span>
                          </>
                        )}
                      </label>
                    </div>
                  ) : (
                    <div className="input-with-icon">
                      <Search className="field-icon" size={20} color="var(--primary)" />
                      <textarea 
                        placeholder={scanType === 'url' ? "Paste a suspicious link (e.g. bit.ly/free-offer)" : scanType === 'whatsapp' ? "Paste suspicious WhatsApp message or chat..." : "Paste a suspicious message or chat content..."}
                        value={input} onChange={(e) => setInput(e.target.value)} rows={4} required 
                      />
                    </div>
                  )}
                  <div className="form-info">
                    <span className="privacy-note"><Lock size={12} /> We do not store your data</span>
                    <span className="analysis-note">AI + Multi-engine detection</span>
                  </div>
                  <button type="submit" className="scan-btn btn-primary pulse-glow" disabled={isScanning}>
                    {isScanning ? (
                      <div className="loading-group">
                        <RefreshCw className="spinner" size={18} /> Analyzing Intelligence...
                      </div>
                    ) : 'Scan Now'}
                  </button>
                </form>
              </div>

              <div className="trust-strip">
                <div className="trust-item"><ShieldCheck size={18} /> <span>Real-time analysis</span></div>
                <div className="trust-item"><Globe size={18} /> <span>Privacy-first</span></div>
                <div className="trust-item"><BarChart3 size={18} /> <span>Multi-engine</span></div>
              </div>

              <div className="feature-grid">
                <div className="feature-item glass-card">
                  <LinkIcon size={24} color="var(--primary)" />
                  <h4>URL scanning</h4>
                  <p>Deep link & domain analysis</p>
                </div>
                <div className="feature-item glass-card">
                  <FileText size={24} color="var(--primary)" />
                  <h4>Message analysis</h4>
                  <p>Keyword & sentiment detection</p>
                </div>
                <div className="feature-item glass-card">
                  <MessageSquare size={24} color="#22C55E" />
                  <h4>WhatsApp detection</h4>
                  <p>Specialized chat takeover protection</p>
                </div>
                <div className="feature-item glass-card">
                  <Activity size={24} color="var(--primary)" />
                  <h4>OCR scanning</h4>
                  <p>Extract text from screenshots</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Scan Result Modal Popup */}
      <AnimatePresence>
        {result && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setResult(null)}
          >
            <motion.div 
              className="modal-card glass-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="modal-close-btn" 
                onClick={() => setResult(null)}
                title="Close Popup"
              >
                <X size={20} />
              </button>

              <div className="result-header">
                <div className="risk-badge">
                  {result.riskLevel === 'Safe' ? (
                    <ShieldCheck size={60} color="var(--safe)" />
                  ) : (
                    <AlertTriangle size={60} color={`var(--${result.riskLevel ? result.riskLevel.toLowerCase() : 'safe'})`} />
                  )}
                  <div className="risk-info">
                    <div className="risk-top">
                      <h3>
                        {result.riskLevel === 'Safe' ? 'Safe - No Scam Detected' : result.riskLevel === 'Suspicious' ? 'Suspicious - Caution Advised' : 'High Scam Risk - Dangerous'}
                      </h3>
                      {result.reportedByCommunity && <span className="community-flag">Global Report #{result.reportCount}</span>}
                    </div>
                    <p>{result.riskLevel === 'Safe' ? 'Safety Confidence: 100%' : `Scam Likelihood: ${result.riskScore}%`}</p>
                  </div>
                </div>
              </div>

              <div className="engine-breakdown">
                <h4><BarChart3 size={16} /> AI & Safety Checks</h4>
                <div className="engine-grid">
                  {result.engineBreakdown && Object.entries(result.engineBreakdown).map(([name, score]) => {
                    const engineLabelMap = {
                      'Gemini AI Intelligence': 'AI Threat Detection',
                      'Address Safety': 'Web Link Safety',
                      'Identity Check': 'Brand & Company Check',
                      'Smart Scanner': 'Link Pattern Check',
                      'Trust Scanner': 'Message Content Check',
                      'Pressure Detector': 'Urgency & Panic Check',
                      'Faker Finder': 'Impersonation Check',
                      'Chat Security': 'WhatsApp Safety Check'
                    };
                    const label = engineLabelMap[name] || name;
                    return (
                      <div key={name} className="engine-stat">
                        <span className="stat-name">{label}</span>
                        <span className="stat-val">{score}%</span>
                        <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${score}%` }}></div></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="result-actions">
                <button onClick={handleReport} className="action-btn report-btn" disabled={isReporting || result.reportedByCommunity}>
                  <Flag size={16} /> {result.reportedByCommunity ? 'Reported' : 'Report as Scam'}
                </button>
                <button className="action-btn share-btn"><Share2 size={16} /> Share Report</button>
              </div>

              <div className="result-details">
                {(() => {
                  const isSafe = (result.riskScore === 0) || (result.riskLevel === 'Safe');
                  const displayDetails = isSafe 
                    ? ['No common phishing indicators were detected during analysis. The message does not contain suspicious links, credential requests, impersonation attempts, or other common phishing techniques.']
                    : (result.details || []);

                  const displayRecs = isSafe 
                    ? [
                        'The message appears safe based on our current analysis.',
                        'Continue using normal caution when interacting with emails or messages.',
                        'Verify the sender if the request is unexpected or involves sensitive information.',
                        'Never share passwords or one-time verification codes.'
                      ]
                    : (result.recommendations || []).filter(r => !['Ignore the threats in this message.', 'Delete this to stay safe.'].includes(r));

                  if (displayRecs.length === 0 && !isSafe) {
                    displayRecs.push(
                      'Do not click suspicious links.',
                      'Do not download unexpected attachments.',
                      'Do not provide passwords or personal information.',
                      'Report or delete the message if confirmed malicious.'
                    );
                  }

                  return (
                    <>
                      <div className={`detail-section ${isSafe ? 'safe-section' : 'warning-section'}`}>
                        <h4>
                          {isSafe ? (
                            <>
                              <CheckCircle size={18} color="var(--safe)" /> Why this appears safe
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={18} color="var(--danger)" /> Why this is risky
                            </>
                          )}
                        </h4>
                        <ul>{displayDetails.map((d, i) => <li key={i}>{d}</li>)}</ul>
                      </div>

                      <div className={`detail-section ${isSafe ? 'safe-section' : 'warning-section'}`}>
                        <h4>
                          <ShieldCheck size={18} color={isSafe ? "var(--safe)" : "var(--warning)"} /> Recommended Actions
                        </h4>
                        <ul>{displayRecs.map((r, i) => <li key={i}>{r}</li>)}</ul>
                      </div>

                      <div className={`detail-section ${isSafe ? 'safe-section' : 'warning-section'}`}>
                        <h4>
                          <Info size={18} color={isSafe ? "var(--safe)" : "var(--primary)"} /> AI Real-World Example (Easy Explanation)
                        </h4>
                        <p className="example-text">
                          {result.example || (isSafe 
                            ? "Think of this like a friendly letter from a known contact: it doesn't demand your secrets, passwords, or money, so it is safe to interact with."
                            : "Think of this like a stranger at your front door claiming to be a bank official, demanding your wallet and passwords immediately. Real organizations will never ask for your secrets on the spot."
                          )}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Assistant Chat */}
      <div className="ai-container">
        <span className="ai-tooltip">Ask AI about this result</span>
        <button className="ai-assistant-toggle btn-primary" onClick={() => setIsChatOpen(!isChatOpen)}>
          {isChatOpen ? <X /> : <MessageSquare />}
        </button>
      </div>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="ai-chat-window glass-card">
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <ShieldCheck size={20} color="var(--primary)" />
                <strong>Security Assistant</strong>
              </div>
              <button onClick={() => setIsChatOpen(false)} style={{ background: 'transparent', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div className="chat-messages">
              {chatMessages.map((m, i) => (
                <div key={i} className={`msg-group ${m.type === 'user' ? 'user-group' : 'ai-group'}`}>
                  <div className="msg-avatar">
                    {m.type === 'user' ? <UserIcon size={14} /> : <ShieldCheck size={14} />}
                  </div>
                  <div className="msg-bubble">
                    <div className={`msg msg-${m.type}`}>
                      {m.text === '...' ? (
                        <div className="typing-dots"><span></span><span></span><span></span></div>
                      ) : m.text}
                    </div>
                    <span className="msg-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {chatMessages.length < 2 && (
              <div className="chat-suggestions">
                <button onClick={() => setChatInput("Is this link safe to click?")} className="suggestion-chip">Is this link safe?</button>
                <button onClick={() => setChatInput("What should I do next?")} className="suggestion-chip">What should I do?</button>
                <button onClick={() => setChatInput("Explain 'Brand Squatting'.")} className="suggestion-chip">Explain Brand Squatting</button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="chat-input-area">
              <button 
                type="button" 
                className="clear-chat" 
                onClick={() => setChatMessages([{ type: 'ai', text: 'Chat history cleared. How can I help?' }])}
                title="Clear Chat"
              >
                <RefreshCw size={16} />
              </button>
              <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask security assistant..." />
              <button type="submit" className="btn-primary send-btn"><Send size={18} /></button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="footer glass-card">
        <p>© 2026 Cyber Guard. Intelligent Cybersecurity Intelligence Portfolio.</p>
      </footer>
    </div>
  );
}

export default App;

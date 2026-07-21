import { useState, useEffect, useRef } from 'react';
import CreatableSelect from 'react-select/creatable';
import './index.css';

const SECURITY_QUESTIONS = [
  "What was your first pet's name?",
  "In what city were you born?",
  "What is your mother's maiden name?",
  "What was the make of your first car?",
  "What high school did you attend?",
  "What is your favorite coffee shop?"
];

const LOGO_FILES = [
  '/logo_cyan.png', '/logo_pink.png', '/logo_orange.png', '/logo_lime.png',
  '/logo_red.png', '/logo_purple.png', '/logo_yellow.png', '/logo_mint.png',
  '/logo_bubblegum.png', '/logo_indigo.png'
];

const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    background: '#2b2b2b',
    borderColor: state.isFocused ? 'var(--theme-accent)' : '#111',
    borderWidth: '4px',
    borderRadius: '12px',
    boxShadow: state.isFocused ? '0 0 10px var(--theme-accent)' : 'inset 2px 2px 5px rgba(0,0,0,0.5)',
    padding: '4px',
    minHeight: '48px',
    cursor: 'text'
  }),
  menu: (base) => ({ ...base, background: '#2b2b2b', border: '4px solid #111', borderRadius: '12px', zIndex: 100 }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? 'var(--theme-accent)' : '#2b2b2b',
    color: state.isFocused ? '#111' : '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontFamily: 'Quicksand'
  }),
  singleValue: (base) => ({ ...base, color: '#fff', fontFamily: 'Quicksand', fontWeight: 'bold' }),
  input: (base) => ({ ...base, color: '#fff' }),
  placeholder: (base) => ({ ...base, color: '#888' })
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

function App() {
  // --- UI STATE ---
  const [currentView, setCurrentView] = useState('home');
  const [scrollY, setScrollY] = useState(0);
  const [currentLogo, setCurrentLogo] = useState(LOGO_FILES[0]);
  const entryRef = useRef(null);
  const diaryRef = useRef(null);

  // --- AUTH STATE ---
  const [authMode, setAuthMode] = useState('login'); 
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [q1Text, setQ1Text] = useState(SECURITY_QUESTIONS[0]);
  const [secQ1, setSecQ1] = useState('');
  const [q2Text, setQ2Text] = useState(SECURITY_QUESTIONS[1]);
  const [secQ2, setSecQ2] = useState('');
  const [retrievedQ1, setRetrievedQ1] = useState('');
  const [retrievedQ2, setRetrievedQ2] = useState('');

  // --- FORM STATE ---
  const [brewData, setBrewData] = useState({
    roaster: null,
    bean: null,
    brewDate: getTodayDate(),
    roastDate: '',
    method: null,
    variation: null,
    grinder: null,
    grindSize: '',
    dose: '',
    yieldOut: '',
    time: '',
    notes: ''
  });

  const methodOptions = [
    { value: 'aeropress', label: 'AeroPress' },
    { value: 'espresso', label: 'Espresso Machine' }
  ];

  const getVariationOptions = () => {
    if (!brewData.method) return [];
    if (brewData.method.value === 'aeropress') {
      return [
        { value: 'standard', label: 'Standard' },
        { value: 'inverted', label: 'Inverted' },
        { value: 'soup', label: 'SOUP (Samo Smrke)' }
      ];
    }
    if (brewData.method.value === 'espresso') {
      return [
        { value: 'standard', label: 'Standard (1:2)' },
        { value: 'turbo', label: 'Turbo Shot' },
        { value: 'ristretto', label: 'Ristretto (1:1.5)' },
        { value: 'allonge', label: 'Allongé (1:4+)' }
      ];
    }
    return [];
  };

  useEffect(() => {
    setCurrentLogo(LOGO_FILES[Math.floor(Math.random() * LOGO_FILES.length)]);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const resetMessages = () => { setMessage(''); setError(''); };

  // --- AUTH FUNCTIONS ---
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    if (authMode === 'login') {
      try {
        const response = await fetch('http://localhost:5001/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (response.ok) {
          setLoggedInUser({ id: data.user_id, username: data.username });
          setCurrentView('home'); 
          setUsername('');
          setPassword('');
        } else setError(data.error);
      } catch (err) { setError("Cannot connect to backend server."); }
    } else if (authMode === 'signup') {
      if (q1Text === q2Text) {
        setError("Please select two different security questions.");
        return;
      }
      try {
        const response = await fetch('http://localhost:5001/api/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, q1_text: q1Text, sec_q1: secQ1, q2_text: q2Text, sec_q2: secQ2 }),
        });
        const data = await response.json();
        if (response.ok) {
          setMessage(data.message);
          setUsername(''); setPassword(''); setSecQ1(''); setSecQ2('');
          setAuthMode('login'); 
        } else setError(data.error);
      } catch (err) { setError("Cannot connect to backend server."); }
    }
  };

  const handleFetchQuestions = async (e) => {
    e.preventDefault();
    resetMessages();
    try {
      const response = await fetch('http://localhost:5001/api/get-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (response.ok) {
        setRetrievedQ1(data.q1);
        setRetrievedQ2(data.q2);
        setAuthMode('forgot_reset'); 
      } else setError(data.error);
    } catch (err) { setError("Cannot connect to backend server."); }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    resetMessages();
    try {
      const response = await fetch('http://localhost:5001/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, new_password: password, ans1: secQ1, ans2: secQ2 }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setPassword(''); setSecQ1(''); setSecQ2('');
        setAuthMode('login');
      } else setError(data.error);
    } catch (err) { setError("Cannot connect to backend server."); }
  };

  const handleSaveEntry = (e) => {
    e.preventDefault();
    console.log("Saving Brew Log to Database:", brewData);
  };

  let daysRested = null;
  if (brewData.brewDate && brewData.roastDate) {
    const brewD = new Date(brewData.brewDate);
    const roastD = new Date(brewData.roastDate);
    const diffTime = brewD - roastD;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0) daysRested = diffDays;
  }

  // --- THE AUTH VIEW (Overlay Page) ---
  if (currentView === 'auth') {
    const authThemeClass = authMode === 'signup' ? 'theme-pink' : 'theme-purple';
    return (
      <div className={`auth-container ${authThemeClass}`}>
        <button className="text-link" onClick={() => { setCurrentView('home'); setAuthMode('login'); }} style={{ marginBottom: '20px' }}>
          ← Back to Home
        </button>
        <div className="subheading-text">
          {authMode === 'login' && 'System Auth'}
          {authMode === 'signup' && 'Registration'}
          {authMode.includes('forgot') && 'Account Recovery'}
        </div>
        {authMode === 'signup' && (
          <div className="notice-box">
            <strong>STRICT PRIVACY NOTICE:</strong> NO EMAILS. NO PHONES. IF YOU LOSE YOUR PASSWORD AND SECURITY ANSWERS, YOUR DATA IS PERMANENTLY INACCESSIBLE.
          </div>
        )}
        {authMode === 'login' && (
          <form onSubmit={handleAuthSubmit}>
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="solid-btn" style={{ width: '100%', marginTop: '10px' }}>Log In</button>
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button type="button" className="text-link" onClick={() => { setAuthMode('forgot_start'); resetMessages(); }}>Forgot Password?</button>
            </div>
          </form>
        )}
        {authMode === 'signup' && (
          <form onSubmit={handleAuthSubmit}>
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <div style={{ marginTop: '10px' }}>
              <label>Security Question 01</label>
              <select value={q1Text} onChange={(e) => setQ1Text(e.target.value)}>
                {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
              <input type="text" placeholder="Your Answer" value={secQ1} onChange={(e) => setSecQ1(e.target.value)} required />
              <label>Security Question 02</label>
              <select value={q2Text} onChange={(e) => setQ2Text(e.target.value)}>
                {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
              <input type="text" placeholder="Your Answer" value={secQ2} onChange={(e) => setSecQ2(e.target.value)} required />
            </div>
            <button type="submit" className="solid-btn" style={{ width: '100%', marginTop: '10px' }}>Create Record</button>
          </form>
        )}
        {authMode === 'forgot_start' && (
          <form onSubmit={handleFetchQuestions}>
            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', marginBottom: '20px', textAlign: 'center' }}>Enter your username to retrieve your security questions.</p>
            <label>Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <button type="submit" className="solid-btn" style={{ width: '100%', marginTop: '10px' }}>Find Account</button>
          </form>
        )}
        {authMode === 'forgot_reset' && (
          <form onSubmit={handlePasswordReset}>
            <label>1. {retrievedQ1}</label>
            <input type="text" value={secQ1} onChange={(e) => setSecQ1(e.target.value)} required />
            <label>2. {retrievedQ2}</label>
            <input type="text" value={secQ2} onChange={(e) => setSecQ2(e.target.value)} required />
            <label>New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="solid-btn" style={{ width: '100%', marginTop: '10px' }}>Reset Password</button>
          </form>
        )}
        {message && <p style={{ color: 'var(--c-cyan)', fontWeight: 'bold', marginTop: '20px', textAlign: 'center' }}>{message}</p>}
        {error && <p style={{ color: 'var(--c-pink)', fontWeight: 'bold', marginTop: '20px', textAlign: 'center' }}>{error}</p>}
        <div style={{ marginTop: '30px', borderTop: '2px solid #222', paddingTop: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
          {authMode !== 'login' && <button className="text-link" onClick={() => { setAuthMode('login'); resetMessages(); }}>Back to Login</button>}
          {authMode !== 'signup' && <button className="text-link" onClick={() => { setAuthMode('signup'); resetMessages(); }}>Create an Account</button>}
        </div>
      </div>
    );
  }

  // --- HOME PAGE ---
  return (
    <div>
      <nav className="top-nav" style={{ justifyContent: 'space-between' }}>
        <div className="nav-left" style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
          <input type="text" placeholder="Search beans..." className="search-bar" />
          <span onClick={() => {
            if(!loggedInUser) setCurrentView('auth');
            else entryRef.current?.scrollIntoView({ behavior: 'smooth' });
          }} style={{ cursor: 'pointer', fontFamily: 'Bagel Fat One' }}>+ MAKE ENTRY</span>
          <span onClick={() => diaryRef.current?.scrollIntoView({ behavior: 'smooth' })} style={{ cursor: 'pointer', fontFamily: 'Bagel Fat One' }}>DIARY</span>
        </div>
        <div className="nav-right">
          {loggedInUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontFamily: 'Bagel Fat One', fontSize: '1.2rem', color: 'var(--c-cyan)' }}>@{loggedInUser.username}</span>
              <button className="solid-btn" style={{ padding: '8px 20px', fontSize: '0.9rem' }} onClick={() => setLoggedInUser(null)}>LOG OUT</button>
            </div>
          ) : (
            <button className="solid-btn" style={{ padding: '8px 20px', fontSize: '0.9rem' }} onClick={() => setCurrentView('auth')}>LOG IN</button>
          )}
        </div>
      </nav>

      <header className="hero-section">
        <div style={{ opacity: Math.max(1 - scrollY * 0.003, 0) }}>
          <img src={currentLogo} className="floating-logo" alt="Dial It In Logo" />
        </div>
      </header>

      {/* --- MAKE ENTRY SECTION --- */}
      <section className="scroll-content theme-cyan" ref={entryRef} style={{ opacity: Math.min(Math.max((scrollY - 200) * 0.005, 0), 1) }}>
        <h2 className="gradient-text">Dial In New Brew</h2>
        <form className="diary-card" onSubmit={handleSaveEntry}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label>Roaster</label>
              <CreatableSelect styles={customSelectStyles} placeholder="Select or type new..." options={[{ value: 'onyx', label: 'Onyx Coffee Lab' }, { value: 'sey', label: 'Sey Coffee' }]} onChange={(opt) => setBrewData({ ...brewData, roaster: opt })} />
            </div>
            <div>
              <label>Bean Name</label>
              <CreatableSelect styles={customSelectStyles} placeholder="Select or type new..." options={[{ value: 'southern', label: 'Southern Weather' }]} onChange={(opt) => setBrewData({ ...brewData, bean: opt })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div>
              <label>Brew Date</label>
              <input type="date" value={brewData.brewDate} onChange={(e) => setBrewData({ ...brewData, brewDate: e.target.value })} style={{ width: '100%', marginBottom: '0' }} />
            </div>
            <div>
              <label>Roast Date {daysRested !== null && (<span style={{ color: 'var(--c-cyan)', marginLeft: '8px', fontSize: '0.9rem', fontFamily: 'Quicksand' }}>({daysRested} days rested)</span>)}</label>
              <input type="date" value={brewData.roastDate} onChange={(e) => setBrewData({ ...brewData, roastDate: e.target.value })} style={{ width: '100%', marginBottom: '0' }} />
            </div>
          </div>
          <hr style={{ borderColor: '#222', margin: '30px 0' }}/>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label>Brew Method</label>
              <CreatableSelect styles={customSelectStyles} options={methodOptions} onChange={(opt) => setBrewData({ ...brewData, method: opt, variation: null })} />
            </div>
            <div style={{ opacity: brewData.method ? 1 : 0.3, pointerEvents: brewData.method ? 'auto' : 'none' }}>
              <label>Method Variation</label>
              <CreatableSelect styles={customSelectStyles} value={brewData.variation} options={getVariationOptions()} placeholder={brewData.method ? "Select variation..." : "Select method first"} onChange={(opt) => setBrewData({ ...brewData, variation: opt })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label>Dose In (g)</label>
              <input type="number" step="0.1" placeholder="15.0" value={brewData.dose} onChange={(e) => setBrewData({...brewData, dose: e.target.value})} />
            </div>
            <div>
              <label>Yield Out (g)</label>
              <input type="number" step="0.1" placeholder="250.0" value={brewData.yieldOut} onChange={(e) => setBrewData({...brewData, yieldOut: e.target.value})} />
            </div>
          </div>
          <label>Tasting Notes</label>
          <textarea rows="4" style={{ width: '100%', background: '#2b2b2b', border: '4px solid #111', borderRadius: '12px', color: '#fff', padding: '15px', fontFamily: 'Quicksand', fontSize: '1rem', marginBottom: '20px', boxSizing: 'border-box' }} placeholder="Bright acidity, lingering sweetness..." value={brewData.notes} onChange={(e) => setBrewData({...brewData, notes: e.target.value})} />
          <button type="submit" className="solid-btn" style={{ width: '100%' }}>SAVE BREW LOG</button>
        </form>
      </section>

      {/* --- BREW DIARY SECTION --- */}
      <section className="scroll-content theme-pink" ref={diaryRef} style={{ opacity: Math.min(Math.max((scrollY - 800) * 0.005, 0), 1) }}>
        <h2 className="gradient-text">Brew Log</h2>
        <div className="diary-card">
          <h4>Onyx Coffee Lab — Southern Weather</h4>
          <div className="coffee-specs">
            <div><div className="spec-label">Method</div><div className="spec-value">AeroPress (Inverted)</div></div>
            <div><div className="spec-label">Dose</div><div className="spec-value">15g In / 250g Out</div></div>
          </div>
          <p>Tasting Notes: Bright acidity, chocolatey finish.</p>
        </div>
      </section>
    </div>
  );
}

export default App;
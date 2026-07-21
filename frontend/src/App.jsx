import { useState, useEffect, useRef } from 'react';
import Select from 'react-select'; 
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

const STOCK_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=bean1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=bean2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=bean3',
  'https://api.dicebear.com/7.x/bottts/svg?seed=bean4'
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
    cursor: 'pointer'
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

function StarRating({ label, value, onChange }) {
  return (
    <div style={{ marginBottom: '15px' }}>
      <label style={{ display: 'block', marginBottom: '5px' }}>{label}</label>
      <div style={{ display: 'flex', gap: '8px', cursor: 'pointer' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => onChange(star)}
            style={{
              fontSize: '1.5rem',
              color: star <= value ? 'var(--theme-accent)' : '#444',
              transition: 'color 0.2s'
            }}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [currentView, setCurrentView] = useState('home'); 
  const [scrollY, setScrollY] = useState(0);
  const [currentLogo, setCurrentLogo] = useState(LOGO_FILES[0]);
  
  const diaryRef = useRef(null);

  const [authMode, setAuthMode] = useState('login'); 
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [userAvatar, setUserAvatar] = useState(STOCK_AVATARS[0]);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

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

  // --- DATA LIST STATES ---
  const [beansList, setBeansList] = useState([]);
  const [equipmentList, setEquipmentList] = useState([]);
  const [brewLogsList, setBrewLogsList] = useState([]);

  // --- FORM STATES ---
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showBeanForm, setShowBeanForm] = useState(false);
  const [showEquipmentForm, setShowEquipmentForm] = useState(false);

  const [brewData, setBrewData] = useState({
    roaster: null,
    bean: null,
    brewDate: getTodayDate(),
    roastDate: '',
    equipment: null,
    method: null,      
    customMethod: '',
    grinder: null,
    grindSize: '',
    temp: '',
    time: '',
    pressure: null,
    pours: '',
    dose: '',
    yieldOut: '',
    notes: ''
  });

  const [beanData, setBeanData] = useState({
    roaster: null,
    customRoaster: '',
    beans: '',
    roastLevel: '',
    origin: '',
    varietal: '',
    processing: '', 
    sweetness: 0,
    acidity: 0,
    bitterness: 0,
    body: 0,
    link: ''
  });

  const [equipmentData, setEquipmentData] = useState({
    equipmentType: null,
    manufacturer: null,
    customManufacturer: '',
    product: '',
    category: null,      
    burrType: null,      
    burrSize: ''
  });

  // --- DYNAMIC OPTIONS ---
  const uniqueRoasters = Array.isArray(beansList) ? Array.from(new Set(beansList.map(b => b.roaster))) : [];
  const addBeanRoasterOptions = [
    ...uniqueRoasters.map(r => ({ value: r, label: r })),
    { value: 'other', label: 'Other (Type manually)' }
  ];

  const uniqueManufacturers = Array.isArray(equipmentList) ? Array.from(new Set(equipmentList.map(e => e.manufacturer))) : [];
  const addEquipmentMakerOptions = [
    ...uniqueManufacturers.map(m => ({ value: m, label: m })),
    { value: 'other', label: 'Other (Type manually)' }
  ];

  const dynamicRoasters = uniqueRoasters.map(r => ({ value: r, label: r }));
  const dynamicBeans = brewData.roaster && Array.isArray(beansList)
    ? beansList.filter(b => b.roaster === brewData.roaster.value).map(b => ({ value: b.name, label: b.name }))
    : Array.isArray(beansList) ? beansList.map(b => ({ value: b.name, label: b.name })) : [];

  const dynamicBrewing = Array.isArray(equipmentList) 
    ? equipmentList.filter(e => e?.type === 'brewing').map(e => ({ value: e.id, label: `${e.manufacturer} ${e.product}`, category: e.category }))
    : [];

  const dynamicGrinders = Array.isArray(equipmentList) ? [
    ...equipmentList.filter(e => e?.type === 'grinder').map(e => ({ value: e.id, label: `${e.manufacturer} ${e.product}` })),
    { value: 'pre_ground', label: 'Pre-ground' }
  ] : [{ value: 'pre_ground', label: 'Pre-ground' }];

  const equipmentTypeOptions = [
    { value: 'brewing', label: 'Brewing Equipment / Machine' },
    { value: 'grinder', label: 'Grinder' }
  ];

  const brewingCategoryOptions = [
    { value: 'espresso', label: 'Espresso' },
    { value: 'dripper', label: 'Dripper / Pour Over' },
    { value: 'aeropress', label: 'AeroPress' },
    { value: 'french_press', label: 'French Press' }
  ];

  const grinderCategoryOptions = [
    { value: 'manual', label: 'Manual' },
    { value: 'electric', label: 'Electric' }
  ];

  const burrTypeOptions = [
    { value: 'conical', label: 'Conical' },
    { value: 'flat', label: 'Flat' },
    { value: 'ghost', label: 'Ghost' },
    { value: 'other', label: 'Other' }
  ];

  const pressureOptions = [
    { value: '6', label: '6 bar' },
    { value: '9', label: '9 bar' },
    { value: '12', label: '12 bar' },
    { value: 'variable', label: 'Variable' }
  ];

  const getMethodOptions = () => {
    if (!brewData.equipment) return [];
    const cat = brewData.equipment.category;

    if (cat === 'espresso') {
      return [
        { value: 'standard', label: 'Standard (1:2)' },
        { value: 'turbo', label: 'Turbo Shot' },
        { value: 'ristretto', label: 'Ristretto (1:1.5)' },
        { value: 'allonge', label: 'Allongé (1:4+)' },
        { value: 'other', label: 'Other' }
      ];
    }
    if (cat === 'aeropress') {
      return [
        { value: 'standard', label: 'Standard' },
        { value: 'inverted', label: 'Inverted' },
        { value: 'soup', label: 'SOUP (Samo Smrke)' },
        { value: 'other', label: 'Other' }
      ];
    }
    if (cat === 'dripper' || cat === 'pourover' || cat === 'french_press') {
      return [
        { value: 'hoffmann', label: 'James Hoffmann (Ultimate)' },
        { value: 'kasuya', label: 'Tetsu Kasuya (4:6)' },
        { value: 'osmotic', label: 'Osmotic Flow' },
        { value: 'other', label: 'Other' }
      ];
    }
    return [];
  };

  useEffect(() => {
    setCurrentLogo(LOGO_FILES[Math.floor(Math.random() * LOGO_FILES.length)]);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    
    fetchBeans();
    fetchEquipment();
    fetchBrewLogs();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchBeans = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/beans');
      if (response.ok) setBeansList(await response.json());
    } catch (err) { console.error("Failed to fetch beans:", err); }
  };

  const fetchEquipment = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/equipment');
      if (response.ok) setEquipmentList(await response.json());
    } catch (err) { console.error("Failed to fetch equipment:", err); }
  };

  const fetchBrewLogs = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/brew_logs');
      if (response.ok) setBrewLogsList(await response.json());
    } catch (err) { console.error("Failed to fetch brew logs:", err); }
  };

  const resetMessages = () => { setMessage(''); setError(''); };

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
          setUserAvatar(STOCK_AVATARS[Math.floor(Math.random() * STOCK_AVATARS.length)]);
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

  const handleSaveEntry = async (e) => {
    e.preventDefault();
    if (!loggedInUser) return;

    const payload = {
      user_id: loggedInUser.id,
      roaster: brewData.roaster?.label || '',
      bean: brewData.bean?.label || '',
      brew_date: brewData.brewDate,
      roast_date: brewData.roastDate,
      equipment: brewData.equipment?.label || '',
      method: brewData.method?.value === 'other' ? brewData.customMethod : (brewData.method?.label || ''),
      grinder: brewData.grinder?.label || '',
      grind_size: brewData.grindSize,
      temp: brewData.temp,
      time: brewData.time,
      pressure: brewData.pressure?.label || '',
      pours: brewData.pours,
      dose: brewData.dose,
      yield_out: brewData.yieldOut,
      notes: brewData.notes
    };

    try {
      const response = await fetch('http://localhost:5001/api/brew_logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setShowEntryForm(false);
        fetchBrewLogs(); 
      }
    } catch (err) { console.error("Failed to save log:", err); }
  };

  const handleSaveBean = async (e) => {
    e.preventDefault();
    if (!loggedInUser) return;

    const finalRoaster = beanData.roaster?.value === 'other' ? beanData.customRoaster : (beanData.roaster?.label || '');

    const payload = {
      user_id: loggedInUser.id,
      roaster: finalRoaster,
      name: beanData.beans,
      roast_level: beanData.roastLevel,
      origin: beanData.origin,
      varietal: beanData.varietal,
      processing: beanData.processing,
      sweetness: beanData.sweetness,
      acidity: beanData.acidity,
      bitterness: beanData.bitterness,
      body: beanData.body,
      link: beanData.link
    };

    try {
      const response = await fetch('http://localhost:5001/api/beans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setShowBeanForm(false);
        setBeanData({ roaster: null, customRoaster: '', beans: '', roastLevel: '', origin: '', varietal: '', processing: '', sweetness: 0, acidity: 0, bitterness: 0, body: 0, link: '' });
        fetchBeans(); 
      }
    } catch (err) { console.error("Failed to save bean:", err); }
  };

  const handleSaveEquipment = async (e) => {
    e.preventDefault();
    if (!loggedInUser) return;

    const finalManufacturer = equipmentData.manufacturer?.value === 'other' ? equipmentData.customManufacturer : (equipmentData.manufacturer?.label || '');

    const payload = {
      user_id: loggedInUser.id,
      type: equipmentData.equipmentType?.value || '',
      manufacturer: finalManufacturer,
      product: equipmentData.product,
      category: equipmentData.category?.value || '',
      burr_type: equipmentData.burrType?.value || '',
      burr_size: equipmentData.burrSize
    };

    try {
      const response = await fetch('http://localhost:5001/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        setShowEquipmentForm(false);
        setEquipmentData({ equipmentType: null, manufacturer: null, customManufacturer: '', product: '', category: null, burrType: null, burrSize: '' });
        fetchEquipment();
      }
    } catch (err) { console.error("Failed to save equipment:", err); }
  };

  let daysRested = null;
  if (brewData.brewDate && brewData.roastDate) {
    const brewD = new Date(brewData.brewDate);
    const roastD = new Date(brewData.roastDate);
    const diffTime = brewD - roastD;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays >= 0) daysRested = diffDays;
  }

  let brewRatio = null;
  const parsedDose = parseFloat(brewData.dose);
  const parsedYield = parseFloat(brewData.yieldOut);
  if (parsedDose > 0 && parsedYield > 0) {
    brewRatio = `1:${(parsedYield / parsedDose).toFixed(1)}`;
  }

  // --- AUTH VIEW ---
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

  // --- SEPARATE PAGE: BEANS ---
  if (currentView === 'beans') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {renderNavbar()}
        <div className="scroll-content theme-orange" style={{ padding: '10px 20px', maxWidth: '800px', width: '90%', margin: '10px auto', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="gradient-text" style={{ margin: 0 }}>Beans Catalog</h2>
            <button 
              className="solid-btn" 
              style={{ padding: '10px 20px', opacity: loggedInUser ? 1 : 0.4, cursor: loggedInUser ? 'pointer' : 'not-allowed' }}
              onClick={() => { if (loggedInUser) setShowBeanForm(!showBeanForm); }}
              title={!loggedInUser ? "Log in to add beans" : ""}
            >
              {showBeanForm ? 'Close Form' : '+ Add Beans'}
            </button>
          </div>

          {showBeanForm && loggedInUser && (
            <form className="diary-card" onSubmit={handleSaveBean} style={{ marginBottom: '40px', border: '4px solid var(--c-orange)' }}>
              <h3 style={{ fontFamily: 'Bagel Fat One', marginBottom: '20px' }}>Add New Beans</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                <div>
                  <label>Roaster</label>
                  <Select styles={customSelectStyles} options={addBeanRoasterOptions} value={beanData.roaster} onChange={(opt) => setBeanData({...beanData, roaster: opt, customRoaster: ''})} />
                  {beanData.roaster?.value === 'other' && (
                    <input type="text" placeholder="Type roaster name..." value={beanData.customRoaster} onChange={(e) => setBeanData({...beanData, customRoaster: e.target.value})} style={{ marginTop: '10px', width: '100%', boxSizing: 'border-box' }} required />
                  )}
                </div>
                <div>
                  <label>Beans Name</label>
                  <input type="text" placeholder="e.g., Southern Weather" value={beanData.beans} onChange={(e) => setBeanData({...beanData, beans: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', height: '48px' }} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                <div>
                  <label>Roast Level</label>
                  <input type="text" placeholder="e.g., Light-Medium" value={beanData.roastLevel} onChange={(e) => setBeanData({...beanData, roastLevel: e.target.value})} style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label>Origin</label>
                  <input type="text" placeholder="e.g., Colombia & Ethiopia" value={beanData.origin} onChange={(e) => setBeanData({...beanData, origin: e.target.value})} style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                <div>
                  <label>Varietal</label>
                  <input type="text" placeholder="e.g., Bourbon, Geisha" value={beanData.varietal} onChange={(e) => setBeanData({...beanData, varietal: e.target.value})} style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label>Processing Method</label>
                  <input type="text" placeholder="e.g., Washed, Natural" value={beanData.processing} onChange={(e) => setBeanData({...beanData, processing: e.target.value})} style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                <StarRating label="Sweetness" value={beanData.sweetness} onChange={(val) => setBeanData({...beanData, sweetness: val})} />
                <StarRating label="Acidity" value={beanData.acidity} onChange={(val) => setBeanData({...beanData, acidity: val})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                <StarRating label="Bitterness" value={beanData.bitterness} onChange={(val) => setBeanData({...beanData, bitterness: val})} />
                <StarRating label="Body" value={beanData.body} onChange={(val) => setBeanData({...beanData, body: val})} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label>Link / URL</label>
                <input type="url" placeholder="https://..." value={beanData.link} onChange={(e) => setBeanData({...beanData, link: e.target.value})} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" className="solid-btn" style={{ width: '100%' }}>Save Bean</button>
            </form>
          )}

          {beansList.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', marginTop: '20px', fontFamily: 'Quicksand' }}>No beans have been cataloged yet.</p>
          ) : (
            beansList.map(bean => (
              <div className="diary-card" key={bean.id}>
                <h4>{bean.roaster} — {bean.name}</h4>
                <p style={{ color: 'var(--text-light)', marginTop: '10px', fontSize: '0.95rem' }}>
                  <strong>Origin:</strong> {bean.origin || 'N/A'} &nbsp;|&nbsp; 
                  <strong> Roast:</strong> {bean.roast_level || 'N/A'} &nbsp;|&nbsp; 
                  <strong> Process:</strong> {bean.processing || 'N/A'}
                </p>
                <div style={{ display: 'flex', gap: '15px', marginTop: '15px', fontSize: '0.9rem', flexWrap: 'wrap' }}>
                  <span style={{background: '#222', border: '1px solid #333', padding: '6px 10px', borderRadius: '8px', color: 'var(--c-cyan)'}}>Sweetness: {bean.sweetness}/5</span>
                  <span style={{background: '#222', border: '1px solid #333', padding: '6px 10px', borderRadius: '8px', color: 'var(--c-pink)'}}>Acidity: {bean.acidity}/5</span>
                  <span style={{background: '#222', border: '1px solid #333', padding: '6px 10px', borderRadius: '8px', color: 'var(--c-lime)'}}>Bitterness: {bean.bitterness}/5</span>
                  <span style={{background: '#222', border: '1px solid #333', padding: '6px 10px', borderRadius: '8px', color: 'var(--c-orange)'}}>Body: {bean.body}/5</span>
                </div>
                {bean.link && (
                  <a href={bean.link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: '15px', color: 'var(--theme-accent)', fontFamily: 'Quicksand', fontWeight: 'bold' }}>View Bean Link →</a>
                )}
              </div>
            ))
          )}
        </div>
        {renderFooter()}
      </div>
    );
  }

  // --- SEPARATE PAGE: EQUIPMENT ---
  if (currentView === 'equipment') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {renderNavbar()}
        <div className="scroll-content theme-lime" style={{ padding: '10px 20px', maxWidth: '800px', width: '90%', margin: '10px auto', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="gradient-text" style={{ margin: 0 }}>Equipment Registry</h2>
            <button 
              className="solid-btn" 
              style={{ padding: '10px 20px', opacity: loggedInUser ? 1 : 0.4, cursor: loggedInUser ? 'pointer' : 'not-allowed' }}
              onClick={() => { if (loggedInUser) setShowEquipmentForm(!showEquipmentForm); }}
              title={!loggedInUser ? "Log in to add equipment" : ""}
            >
              {showEquipmentForm ? 'Close Form' : '+ Add Equipment'}
            </button>
          </div>

          {showEquipmentForm && loggedInUser && (
            <form className="diary-card" onSubmit={handleSaveEquipment} style={{ marginBottom: '40px', border: '4px solid var(--c-lime)' }}>
              <h3 style={{ fontFamily: 'Bagel Fat One', marginBottom: '20px' }}>Add New Equipment</h3>
              
              <div style={{ marginBottom: '15px' }}>
                <label>Equipment Type</label>
                <Select styles={customSelectStyles} options={equipmentTypeOptions} value={equipmentData.equipmentType} onChange={(opt) => setEquipmentData({...equipmentData, equipmentType: opt, category: null})} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                <div>
                  <label>Manufacturer</label>
                  <Select styles={customSelectStyles} options={addEquipmentMakerOptions} value={equipmentData.manufacturer} onChange={(opt) => setEquipmentData({...equipmentData, manufacturer: opt, customManufacturer: ''})} />
                  {equipmentData.manufacturer?.value === 'other' && (
                    <input type="text" placeholder="Type manufacturer..." value={equipmentData.customManufacturer} onChange={(e) => setEquipmentData({...equipmentData, customManufacturer: e.target.value})} style={{ marginTop: '10px', width: '100%', boxSizing: 'border-box' }} required />
                  )}
                </div>
                <div>
                  <label>Product Name</label>
                  <input type="text" placeholder="e.g., H10A, V60, JX-Pro" value={equipmentData.product} onChange={(e) => setEquipmentData({...equipmentData, product: e.target.value})} style={{ width: '100%', boxSizing: 'border-box', height: '48px' }} required />
                </div>
              </div>

              {equipmentData.equipmentType?.value === 'brewing' && (
                <div style={{ marginBottom: '15px' }}>
                  <label>Category</label>
                  <Select styles={customSelectStyles} options={brewingCategoryOptions} value={equipmentData.category} onChange={(opt) => setEquipmentData({...equipmentData, category: opt})} />
                </div>
              )}

              {equipmentData.equipmentType?.value === 'grinder' && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label>Category</label>
                    <Select styles={customSelectStyles} options={grinderCategoryOptions} value={equipmentData.category} onChange={(opt) => setEquipmentData({...equipmentData, category: opt})} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '15px' }}>
                    <div>
                      <label>Burr Type</label>
                      <Select styles={customSelectStyles} options={burrTypeOptions} value={equipmentData.burrType} onChange={(opt) => setEquipmentData({...equipmentData, burrType: opt})} />
                    </div>
                    <div>
                      <label>Burr Size</label>
                      <input type="text" placeholder="e.g., 64mm, 48mm" value={equipmentData.burrSize} onChange={(e) => setEquipmentData({...equipmentData, burrSize: e.target.value})} style={{ width: '100%', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="solid-btn" style={{ width: '100%', marginTop: '10px' }}>Save Equipment</button>
            </form>
          )}

          {equipmentList.length === 0 ? (
            <p style={{ color: 'var(--text-light)', textAlign: 'center', marginTop: '20px', fontFamily: 'Quicksand' }}>No equipment has been cataloged yet.</p>
          ) : (
            equipmentList.map(item => (
              <div className="diary-card" key={item.id}>
                <h4>{item.manufacturer} {item.product}</h4>
                <p style={{ color: 'var(--text-light)', marginTop: '10px', fontSize: '0.95rem' }}>
                  <strong>Type:</strong> {item.type === 'brewing' ? 'Brewer / Machine' : 'Grinder'} &nbsp;|&nbsp; 
                  <strong> Category:</strong> {item.category || 'N/A'}
                  {item.type === 'grinder' && (
                    <> &nbsp;|&nbsp; <strong>Burrs:</strong> {item.burr_size || 'N/A'} {item.burr_type || ''}</>
                  )}
                </p>
              </div>
            ))
          )}
        </div>
        {renderFooter()}
      </div>
    );
  }

  // --- SEPARATE PAGE: POSTS ---
  if (currentView === 'posts') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {renderNavbar()}
        <div className="scroll-content theme-purple" style={{ padding: '10px 20px', maxWidth: '800px', width: '90%', margin: '10px auto', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="gradient-text" style={{ margin: 0 }}>Community Posts</h2>
            <button className="solid-btn" style={{ padding: '10px 20px', opacity: 0.4, cursor: 'not-allowed' }}>
              + Add Post
            </button>
          </div>
          <div className="diary-card">
            <h4>Dialing in light roasts on the H10A</h4>
            <p style={{ color: 'var(--text-light)', marginTop: '10px' }}>Shared by @admin — Discussing pre-infusion timings and thermal stability.</p>
          </div>
        </div>
        {renderFooter()}
      </div>
    );
  }

  // --- SHARED NAVBAR ---
  function renderNavbar() {
    return (
      <nav className="top-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div className="nav-left" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span onClick={() => setCurrentView('home')} style={{ cursor: 'pointer', fontFamily: 'Bagel Fat One' }}>HOME</span>
          <span onClick={() => { setCurrentView('home'); setTimeout(() => { diaryRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 50); }} style={{ cursor: 'pointer', fontFamily: 'Bagel Fat One' }}>DIARY</span>
          <span onClick={() => setCurrentView('beans')} style={{ cursor: 'pointer', fontFamily: 'Bagel Fat One' }}>BEANS</span>
          <span onClick={() => setCurrentView('equipment')} style={{ cursor: 'pointer', fontFamily: 'Bagel Fat One' }}>EQUIPMENT</span>
          <span style={{ cursor: 'not-allowed', fontFamily: 'Bagel Fat One', opacity: 0.4 }} title="Coming Soon">POSTS</span>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 30px' }}>
          <input type="text" placeholder="Search beans..." className="search-bar" style={{ width: '100%', maxWidth: '400px', margin: 0 }} />
        </div>
        <div className="nav-right" style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {loggedInUser ? (
            <div>
              <div onClick={() => setAccountDropdownOpen(!accountDropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: '#222', padding: '6px 14px', borderRadius: '30px', border: '2px solid #333' }}>
                <img src={userAvatar} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#333' }} />
                <span style={{ fontFamily: 'Bagel Fat One', fontSize: '1rem', color: 'var(--c-cyan)' }}>@{loggedInUser.username}</span>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>▼</span>
              </div>
              {accountDropdownOpen && (
                <div style={{ position: 'absolute', right: 0, top: '55px', background: '#222', border: '3px solid #111', borderRadius: '12px', width: '180px', overflow: 'hidden', zIndex: 1000, boxShadow: '0 8px 16px rgba(0,0,0,0.6)' }}>
                  <div onClick={() => { setAccountDropdownOpen(false); setLoggedInUser(null); }} style={{ padding: '12px 16px', cursor: 'pointer', fontFamily: 'Quicksand', fontWeight: 'bold', color: 'var(--c-pink)' }} onMouseEnter={(e)=>e.target.style.background='#2b2b2b'} onMouseLeave={(e)=>e.target.style.background='transparent'}>
                    Log Out
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button className="solid-btn" style={{ padding: '8px 20px', fontSize: '0.9rem' }} onClick={() => setCurrentView('auth')}>LOG IN</button>
          )}
        </div>
      </nav>
    );
  }

  // --- SHARED FOOTER ---
  function renderFooter() {
    return (
      <footer style={{ background: '#181818', borderTop: '4px solid #111', padding: '40px 20px', textAlign: 'center', marginTop: 'auto' }}>
        <div style={{ fontFamily: 'Bagel Fat One', fontSize: '1.5rem', color: 'var(--theme-accent)', marginBottom: '15px' }}>DIAL IT IN</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', fontFamily: 'Quicksand', fontWeight: 'bold', fontSize: '1rem', marginBottom: '20px' }}>
          <a href="#contact" onClick={(e) => e.preventDefault()} style={{ color: '#fff', textDecoration: 'none', cursor: 'pointer' }}>Contact</a>
          <a href="#donate" onClick={(e) => e.preventDefault()} style={{ color: '#fff', textDecoration: 'none', cursor: 'pointer' }}>Donate / Support</a>
          <a href="#github" onClick={(e) => e.preventDefault()} style={{ color: '#fff', textDecoration: 'none', cursor: 'pointer' }}>GitHub</a>
        </div>
        <div style={{ color: '#666', fontSize: '0.85rem', fontFamily: 'Quicksand' }}>
          © {new Date().getFullYear()} Dial It In. Built for precise extraction.
        </div>
      </footer>
    );
  }

  // --- HOME / DIARY VIEW ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {renderNavbar()}

      <header className="hero-section" style={{ minHeight: '20vh', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0, padding: '5px 0' }}>
        <div style={{ opacity: Math.max(1 - scrollY * 0.003, 0), display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <img src={currentLogo} className="floating-logo" alt="Dial It In Logo" style={{ margin: '0 auto', display: 'block' }} />
        </div>
      </header>

      {/* --- DIARY & MAKE ENTRY SECTION --- */}
      <section className="scroll-content theme-cyan" ref={diaryRef} style={{ opacity: Math.min(Math.max((scrollY - 50) * 0.005, 0), 1), margin: '0 auto 60px auto', maxWidth: '800px', width: '90%', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 className="gradient-text" style={{ margin: 0 }}>Brew Diary</h2>
          
          <button 
            className="solid-btn" 
            style={{ padding: '10px 20px', opacity: loggedInUser ? 1 : 0.4, cursor: loggedInUser ? 'pointer' : 'not-allowed' }}
            onClick={() => { if (loggedInUser) setShowEntryForm(!showEntryForm); }}
            title={!loggedInUser ? "Log in to make an entry" : ""}
          >
            {showEntryForm ? 'Close Form' : '+ Make Entry'}
          </button>
        </div>

        {/* CONDITIONAL ENTRY FORM */}
        {showEntryForm && loggedInUser && (
          <form className="diary-card" onSubmit={handleSaveEntry} style={{ marginBottom: '40px', border: '4px solid var(--c-cyan)' }}>
            <h3 style={{ fontFamily: 'Bagel Fat One', marginBottom: '20px' }}>Dial In New Brew</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label>Roaster</label>
                <Select styles={customSelectStyles} options={dynamicRoasters} value={brewData.roaster} onChange={(opt) => setBrewData({ ...brewData, roaster: opt, bean: null })} />
              </div>
              <div>
                <label>Beans</label>
                <Select styles={customSelectStyles} value={brewData.bean} options={dynamicBeans} onChange={(opt) => setBrewData({ ...brewData, bean: opt })} />
              </div>
            </div>
            
            <div style={{ marginTop: '8px', textAlign: 'right', marginBottom: '20px' }}>
              <span onClick={() => { setCurrentView('beans'); setShowBeanForm(true); }} style={{ color: 'var(--theme-accent)', cursor: 'pointer', fontFamily: 'Quicksand', fontSize: '0.85rem', fontWeight: 'bold' }}>Can't see your beans? Add them</span>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label>Equipment / Machine</label>
                <Select styles={customSelectStyles} options={dynamicBrewing} value={brewData.equipment} onChange={(opt) => setBrewData({ ...brewData, equipment: opt, method: null, customMethod: '' })} />
              </div>
              <div>
                <label>Grinder</label>
                <Select styles={customSelectStyles} options={dynamicGrinders} value={brewData.grinder} onChange={(opt) => {
                  if (opt?.value === 'pre_ground') {
                    setBrewData({ ...brewData, grinder: opt, grindSize: 'Pre-ground' });
                  } else {
                    setBrewData({ ...brewData, grinder: opt });
                  }
                }} />
              </div>
            </div>

            <div style={{ marginTop: '8px', textAlign: 'right', marginBottom: '20px' }}>
              <span onClick={() => { setCurrentView('equipment'); setShowEquipmentForm(true); }} style={{ color: 'var(--theme-accent)', cursor: 'pointer', fontFamily: 'Quicksand', fontSize: '0.85rem', fontWeight: 'bold' }}>Can't see your equipment? Add it</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div style={{ opacity: brewData.equipment ? 1 : 0.3, pointerEvents: brewData.equipment ? 'auto' : 'none' }}>
                <label>Method</label>
                <Select 
                  styles={customSelectStyles} 
                  value={brewData.method} 
                  options={getMethodOptions()} 
                  placeholder={brewData.equipment ? "Select method..." : "Select equipment first"} 
                  onChange={(opt) => setBrewData({ ...brewData, method: opt, customMethod: '' })} 
                />
                {brewData.method?.value === 'other' && (
                  <input type="text" placeholder="Specify method..." value={brewData.customMethod} onChange={(e) => setBrewData({...brewData, customMethod: e.target.value})} style={{ marginTop: '10px', width: '100%', boxSizing: 'border-box' }} required />
                )}
              </div>
              <div>
                <label>Grind Size</label>
                <input 
                  type="text" 
                  inputMode="numeric" 
                  pattern="[0-9]*" 
                  placeholder={brewData.grinder?.value === 'pre_ground' ? "Pre-ground" : "e.g., 14"} 
                  disabled={brewData.grinder?.value === 'pre_ground'}
                  value={brewData.grindSize} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) setBrewData({...brewData, grindSize: val});
                  }} 
                  style={{ width: '100%', boxSizing: 'border-box', opacity: brewData.grinder?.value === 'pre_ground' ? 0.5 : 1 }} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label>Water Temp (°C / °F)</label>
                <input type="number" placeholder="95" value={brewData.temp} onChange={(e) => setBrewData({...brewData, temp: e.target.value})} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label>Brew Time (seconds)</label>
                <input type="number" placeholder="30" value={brewData.time} onChange={(e) => setBrewData({...brewData, time: e.target.value})} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              {brewData.equipment?.category === 'espresso' && (
                <div>
                  <label>Pressure (bar)</label>
                  <Select styles={customSelectStyles} options={pressureOptions} value={brewData.pressure} placeholder="" onChange={(opt) => setBrewData({ ...brewData, pressure: opt })} />
                </div>
              )}
              {(brewData.equipment?.category === 'pourover' || brewData.equipment?.category === 'dripper') && (
                <div>
                  <label>Number of Pours</label>
                  <input type="number" placeholder="" value={brewData.pours} onChange={(e) => setBrewData({...brewData, pours: e.target.value})} style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label>Dose In (g)</label>
                <input type="number" step="0.1" placeholder="15.0" value={brewData.dose} onChange={(e) => setBrewData({...brewData, dose: e.target.value})} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label>
                  Yield Out (g)
                  {brewRatio && (
                    <span style={{ color: 'var(--c-pink)', marginLeft: '8px', fontSize: '0.9rem', fontFamily: 'Quicksand' }}>
                      (Ratio {brewRatio})
                    </span>
                  )}
                </label>
                <input type="number" step="0.1" placeholder="250.0" value={brewData.yieldOut} onChange={(e) => setBrewData({...brewData, yieldOut: e.target.value})} style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>

            <label>Tasting Notes</label>
            <textarea rows="4" style={{ width: '100%', background: '#2b2b2b', border: '4px solid #111', borderRadius: '12px', color: '#fff', padding: '15px', fontFamily: 'Quicksand', fontSize: '1rem', marginBottom: '20px', boxSizing: 'border-box' }} placeholder="Bright acidity, lingering sweetness..." value={brewData.notes} onChange={(e) => setBrewData({...brewData, notes: e.target.value})} />
            
            <button type="submit" className="solid-btn" style={{ width: '100%' }}>SAVE BREW LOG</button>
          </form>
        )}

        {/* LOGGED OUT PLACEHOLDER OR PREVIOUS ENTRIES */}
        {!loggedInUser ? (
          <div className="diary-card" style={{ textAlign: 'center', padding: '50px 20px', border: '4px dashed #333' }}>
            <h3 style={{ fontFamily: 'Bagel Fat One', marginBottom: '10px', fontSize: '1.5rem' }}>Log in to start</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: '25px', fontFamily: 'Quicksand' }}>Sign in to track your extractions, view previous logs, and build your personal brew diary.</p>
            <button className="solid-btn" style={{ padding: '10px 30px' }} onClick={() => setCurrentView('auth')}>LOG IN NOW</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ fontFamily: 'Bagel Fat One', color: 'var(--text-light)', margin: 0 }}>Previous Logs</h4>
              <select style={{ background: '#2b2b2b', color: '#fff', border: '2px solid #111', borderRadius: '8px', padding: '6px 12px', fontFamily: 'Quicksand', fontWeight: 'bold' }}>
                <option>Sort by: Newest</option>
                <option>Sort by: Oldest</option>
              </select>
            </div>

            {brewLogsList.length === 0 ? (
              <p style={{ color: 'var(--text-light)', textAlign: 'center', marginTop: '20px', fontFamily: 'Quicksand' }}>No brew logs yet. Start dialing in!</p>
            ) : (
              brewLogsList.map(log => (
                <div className="diary-card" key={log.id}>
                  <h4>{log.roaster} — {log.bean}</h4>
                  <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '10px' }}>Brewed: {log.brew_date}</p>
                  <div className="coffee-specs">
                    <div><div className="spec-label">Equipment</div><div className="spec-value">{log.equipment || 'N/A'}</div></div>
                    <div><div className="spec-label">Method</div><div className="spec-value">{log.method || 'N/A'}</div></div>
                    <div><div className="spec-label">Dose</div><div className="spec-value">{log.dose ? `${log.dose}g In` : 'N/A'} {log.yield_out ? `/ ${log.yield_out}g Out` : ''}</div></div>
                  </div>
                  {log.notes && <p style={{ marginTop: '15px' }}>Tasting Notes: {log.notes}</p>}
                </div>
              ))
            )}
          </>
        )}
      </section>

      {renderFooter()}
    </div>
  );
}

export default App;
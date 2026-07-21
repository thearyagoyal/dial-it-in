import { useState, useEffect, useRef } from 'react';
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

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [scrollY, setScrollY] = useState(0); 
  const [currentLogo, setCurrentLogo] = useState(LOGO_FILES[0]);
  
  const [authMode, setAuthMode] = useState('login'); 
  const [loggedInUser, setLoggedInUser] = useState(null);
  
  // --- NEW: Controls the Make Entry Modal ---
  const [showEntryModal, setShowEntryModal] = useState(false);
  
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

  const diaryRef = useRef(null);

  useEffect(() => {
    const randomImage = LOGO_FILES[Math.floor(Math.random() * LOGO_FILES.length)];
    setCurrentLogo(randomImage);

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const resetMessages = () => { setMessage(''); setError(''); };

  const scrollToDiary = () => {
    diaryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    // Auth logic remains the same
  };

  const handleFetchQuestions = async (e) => {
    e.preventDefault();
    resetMessages();
    // Fetch logic remains the same
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    resetMessages();
    // Reset logic remains the same
  };

  if (currentView === 'auth') {
    // Auth UI remains the same (omitted for brevity, keep yours intact!)
    return <div>Your Auth Code Here</div>; 
  }

  return (
    <div>
      {/* --- MODAL: MAKE AN ENTRY --- */}
      {showEntryModal && (
        <div className="modal-overlay">
          <div className="modal-content theme-orange">
            <div className="modal-header">
              <h3>Dial It In</h3>
              <button className="close-btn" onClick={() => setShowEntryModal(false)}>X</button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); setShowEntryModal(false); }}>
              <label>Roaster & Beans</label>
              <input type="text" placeholder="e.g., Sey - Worka Chelbesa" required />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label>Method</label>
                  <select>
                    <option>V60</option>
                    <option>AeroPress (Standard)</option>
                    <option>AeroPress (Inverted)</option>
                    <option>Espresso</option>
                    <option>Chemex</option>
                    <option>French Press</option>
                  </select>
                </div>
                <div>
                  <label>Grinder & Size</label>
                  <input type="text" placeholder="e.g., Ode Gen 2 @ 4.1" required />
                </div>
              </div>

              <label>Brew Details (In / Out / Time / Temp)</label>
              <input type="text" placeholder="e.g., 20g / 300g / 3:15 / 98°C" required />

              <label>Tasting Notes</label>
              <textarea 
                placeholder="How was the cup?" 
                style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#2b2b2b', color: 'white', border: '4px solid #111', fontFamily: 'inherit', minHeight: '100px', marginBottom: '20px' }}
              />

              <button type="submit" className="solid-btn" style={{ width: '100%' }}>SAVE BREW LOG</button>
            </form>
          </div>
        </div>
      )}

      {/* --- TOP NAV --- */}
      <nav className="top-nav theme-cyan">
        <div className="nav-left">
          {/* MAKE ENTRY BUTTON */}
          <span 
            onClick={() => {
              if(!loggedInUser) setCurrentView('auth');
              else setShowEntryModal(true);
            }}
            style={{ fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Bagel Fat One', color: 'var(--c-pink)' }}
          >
            + MAKE ENTRY
          </span>

          {/* DIARY LOG BUTTON */}
          <span 
            onClick={scrollToDiary}
            style={{ fontWeight: 'bold', cursor: 'pointer', fontFamily: 'Bagel Fat One', color: 'var(--text-light)', marginLeft: '10px' }}
          >
            DIARY
          </span>
        </div>
        
        {loggedInUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ fontFamily: 'Bagel Fat One', fontSize: '1.2rem', color: 'var(--c-cyan)' }}>
              @{loggedInUser.username}
            </span>
            <button className="solid-btn" onClick={() => setLoggedInUser(null)}>
              LOG OUT
            </button>
          </div>
        ) : (
          <button className="solid-btn" onClick={() => setCurrentView('auth')}>
            LOG IN
          </button>
        )}
      </nav>

      {/* HERO SECTION */}
      <header className="hero-section">
        <div 
          style={{ 
            transform: `translateY(${scrollY * 0.4}px)`,
            opacity: Math.max(1 - scrollY * 0.002, 0),
            willChange: 'transform, opacity',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <img 
            src={currentLogo} 
            alt="Dial It In Logo" 
            className="floating-logo" 
            style={{ filter: `drop-shadow(6px 10px 0px #111)` }}
          />
        </div>
      </header>

      {/* --- DIARY / FEED SECTION --- */}
      <section className="scroll-content theme-pink" ref={diaryRef}>
        <div style={{
          opacity: Math.min(scrollY * 0.003, 1), 
          transform: `translateY(${Math.max(40 - scrollY * 0.1, 0)}px)`,
          willChange: 'opacity, transform',
          maxWidth: '650px',
          margin: '0 auto' 
        }}>

          <h2 className="gradient-text" style={{ marginBottom: '20px' }}>Brew Log</h2>
          
          {/* --- NEW: SORTING / FILTER BAR --- */}
          <div className="filter-bar">
            <select style={{ flex: 1 }}>
              <option>Sort by: Date (Newest First)</option>
              <option>Sort by: Date (Oldest First)</option>
              <option>Sort by: Roaster (A-Z)</option>
              <option>Sort by: Method</option>
            </select>
            <input 
              type="text" 
              placeholder="Filter by roaster or bean..." 
              style={{ flex: 1.5 }}
            />
          </div>
          
          {/* Example Coffee Entry 1 */}
          <div className="diary-card theme-cyan">
            <div className="diary-meta">Brewed • 10 mins ago</div>
            <h4>Onyx Coffee Lab — Southern Weather</h4>
            
            <div className="coffee-specs">
              <div className="spec-item">
                <span className="spec-label">Method</span>
                <span className="spec-value">AeroPress (Inverted)</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Grinder & Size</span>
                <span className="spec-value">Comandante C40 @ 15 Clicks</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Brew Details</span>
                <span className="spec-value">15g In / 250g Out</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Time & Temp</span>
                <span className="spec-value">2:00 Total • 95°C</span>
              </div>
            </div>

            <p className="tasting-notes">
              <strong>Notes:</strong> Really solid cup. The inverted method brought out a lot more body than the standard recipe. Bright acidity up front with a smooth chocolatey finish.
            </p>
          </div>

          <button className="solid-btn theme-purple" style={{ marginTop: '20px', width: '100%' }}>
            LOAD OLDER LOGS
          </button>
          
        </div>
      </section>
    </div>
  );
}

export default App;
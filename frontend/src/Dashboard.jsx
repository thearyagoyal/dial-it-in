import { useState } from 'react';

function Dashboard({ user, onLogout }) {
  const [roaster, setRoaster] = useState('');
  const [name, setName] = useState('');
  const [roastDate, setRoastDate] = useState('');
  const [roastLevel, setRoastLevel] = useState('Medium');
  const [message, setMessage] = useState('');

  const handleAddBean = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('http://localhost:5001/api/beans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          roaster: roaster,
          name: name,
          roast_date: roastDate,
          roast_level: roastLevel
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        // Clear form
        setRoaster(''); setName(''); setRoastDate(''); setRoastLevel('Medium');
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage("Error connecting to server.");
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Welcome, {user.username} ☕</h2>
        <button onClick={onLogout} style={{ padding: '5px 10px' }}>Log Out</button>
      </header>

      <div style={{ marginTop: '30px', border: '1px solid #ccc', padding: '20px', maxWidth: '400px' }}>
        <h3>Add New Beans</h3>
        
        <form onSubmit={handleAddBean} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>Roaster</label>
          <input type="text" value={roaster} onChange={(e) => setRoaster(e.target.value)} required />

          <label>Bean Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

          <label>Roast Date</label>
          <input type="date" value={roastDate} onChange={(e) => setRoastDate(e.target.value)} />

          <label>Roast Level</label>
          <select value={roastLevel} onChange={(e) => setRoastLevel(e.target.value)}>
            <option value="Light">Light</option>
            <option value="Medium">Medium</option>
            <option value="Dark">Dark</option>
            <option value="Espresso">Espresso Roast</option>
          </select>

          <button type="submit" style={{ marginTop: '10px', padding: '10px' }}>Save Beans</button>
        </form>

        {message && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{message}</p>}
      </div>
    </div>
  );
}

export default Dashboard;
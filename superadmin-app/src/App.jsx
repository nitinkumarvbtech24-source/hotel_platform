import './index.css';

function App() {
  return (
    <div className="superadmin-layout">
      <aside className="sidebar">
        <div className="logo">FoodNet HQ</div>
        <div className="nav-links">
          <div className="nav-link active">Overview</div>
          <div className="nav-link">Restaurant Branches</div>
          <div className="nav-link">Delivery Fleet</div>
          <div className="nav-link">System Health</div>
        </div>
      </aside>
      
      <main className="main-area">
        <div className="topbar">
          <h2 style={{ color: 'white', fontWeight: 300, fontSize: '2rem' }}>Food Chain Overview</h2>
          <input className="search-bar" type="text" placeholder="Search branches..." style={{ outline: 'none' }} />
        </div>

        <div className="card-grid">
          <div className="stat-card" style={{ '--primary': '#8b5cf6' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Active Branches</p>
            <h3 style={{ fontSize: '2.5rem', color: 'white', margin: '0.5rem 0' }}>124</h3>
          </div>
          <div className="stat-card" style={{ '--primary': '#10b981' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Live Delivery Drones</p>
            <h3 style={{ fontSize: '2.5rem', color: 'white', margin: '0.5rem 0' }}>842</h3>
          </div>
          <div className="stat-card" style={{ '--primary': '#f43f5e' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Delayed Orders</p>
            <h3 style={{ fontSize: '2.5rem', color: 'white', margin: '0.5rem 0' }}>14</h3>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

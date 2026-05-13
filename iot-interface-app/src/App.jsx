import './index.css';

function App() {
  return (
    <div className="hub-container">
      <h1 className="header">Kitchen IoT Command Hub</h1>
      <div className="grid">
        <div className="sensor-card">
          <div className="label"><span className="status-dot"></span> Smart Ovens</div>
          <div className="value">180°C</div>
          <div className="label">Preheating</div>
        </div>
        <div className="sensor-card">
          <div className="label"><span className="status-dot"></span> Cold Storage</div>
          <div className="value">-4°C</div>
          <div className="label">Optimal</div>
        </div>
        <div className="sensor-card">
          <div className="label"><span className="status-dot"></span> Dispatch Drones</div>
          <div className="value">94%</div>
          <div className="label">Battery AVG</div>
        </div>
      </div>
    </div>
  );
}

export default App;

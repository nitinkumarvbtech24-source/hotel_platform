import { useState, useEffect } from 'react';
import { 
  Activity, 
  LayoutDashboard, 
  Cpu, 
  Wifi, 
  Battery, 
  Settings, 
  Terminal, 
  AlertTriangle,
  RefreshCcw,
  Power
} from 'lucide-react';
import './index.css';

const MOCK_DEVICES = [
  { id: 'TBL-101', name: 'Table Tablet 1', type: 'Tablet', status: 'online', battery: 88, signal: 4 },
  { id: 'TBL-102', name: 'Table Tablet 2', type: 'Tablet', status: 'online', battery: 42, signal: 3 },
  { id: 'KDS-001', name: 'Kitchen Display', type: 'Station', status: 'online', battery: 100, signal: 5 },
  { id: 'TBL-103', name: 'Table Tablet 3', type: 'Tablet', status: 'warning', battery: 12, signal: 2 },
  { id: 'PRN-OFFICE', name: 'Admin Printer', type: 'Printer', status: 'offline', battery: 0, signal: 0 },
  { id: 'GTW-MAIN', name: 'Main Gateway', type: 'Gateway', status: 'online', battery: 100, signal: 5 },
];

export default function App() {
  const [devices, setDevices] = useState(MOCK_DEVICES);
  const [activeZone, setActiveZone] = useState('All Devices');

  return (
    <div className="iot-shell">
      {/* Sidebar Navigation */}
      <aside className="iot-sidebar">
        <div className="iot-brand" style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#10b981' }}>
            <Cpu size={32} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>IOT CORE</h2>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--iot-text-dim)', letterSpacing: '2px', fontWeight: 700 }}>SYSTEM VERSION 4.2.0</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeZone === 'All Devices'} onClick={() => setActiveZone('All Devices')} />
          <NavItem icon={<Activity size={20} />} label="System Health" />
          <NavItem icon={<Wifi size={20} />} label="Network Nodes" />
          <NavItem icon={<Terminal size={20} />} label="Logs & Console" />
          <NavItem icon={<Settings size={20} />} label="Configuration" />
        </nav>

        <div style={{ marginTop: 'auto', padding: '20px', background: 'rgba(218, 54, 51, 0.1)', borderRadius: '12px', border: '1px solid rgba(218, 54, 51, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#da3633', fontSize: '0.8rem', fontWeight: 700 }}>
            <AlertTriangle size={14} /> SYSTEM ALERT
          </div>
          <p style={{ fontSize: '0.7rem', marginTop: '4px', color: 'var(--iot-text-dim)' }}>3 devices reporting low battery or signal.</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="iot-main">
        <header className="iot-header">
          <div>
            <h1>{activeZone}</h1>
            <p style={{ color: 'var(--iot-text-dim)', fontSize: '0.9rem' }}>Real-time monitoring of all hotel endpoints</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ padding: '10px 16px', background: 'var(--iot-card)', border: '1px solid var(--iot-border)', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <RefreshCcw size={18} /> Sync Devices
            </button>
          </div>
        </header>

        {/* Device Grid */}
        <div className="device-grid">
          {devices.map(device => (
            <DeviceNode key={device.id} device={device} />
          ))}
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <div 
      onClick={onClick}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        padding: '12px 16px', 
        borderRadius: '10px', 
        cursor: 'pointer',
        background: active ? 'rgba(63, 76, 56, 0.2)' : 'transparent',
        color: active ? '#10b981' : 'var(--iot-text)',
        border: active ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid transparent',
        transition: 'all 0.2s'
      }}
    >
      {icon}
      <span style={{ fontWeight: active ? 700 : 500, fontSize: '0.9rem' }}>{label}</span>
    </div>
  );
}

function DeviceNode({ device }) {
  const statusColor = device.status === 'online' ? 'status-online-bg' : device.status === 'warning' ? 'status-warning-bg' : 'status-offline-bg';
  
  return (
    <div className="device-node">
      <div className={`device-status-pill ${statusColor} ${device.status === 'warning' ? 'animate-pulse-status' : ''}`}></div>
      
      <div className="node-header">
        <div className="node-title">
          <h3>{device.name}</h3>
          <span>ID: {device.id} • {device.type}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ padding: '4px', background: 'none', border: 'none', color: 'var(--iot-text-dim)', cursor: 'pointer' }}>
            <Power size={18} />
          </button>
        </div>
      </div>

      <div className="telemetry-row">
        <div className="telemetry-item">
          <div className="telemetry-label">Battery</div>
          <div className="telemetry-value" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: device.battery < 20 ? '#da3633' : 'inherit' }}>
            <Battery size={14} /> {device.battery}%
          </div>
        </div>
        <div className="telemetry-item">
          <div className="telemetry-label">Signal</div>
          <div className="telemetry-value" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wifi size={14} /> {device.signal}/5
          </div>
        </div>
        <div className="telemetry-item">
          <div className="telemetry-label">Status</div>
          <div className="telemetry-value" style={{ textTransform: 'capitalize', color: device.status === 'online' ? '#238636' : device.status === 'warning' ? '#d29922' : '#da3633' }}>
            {device.status}
          </div>
        </div>
      </div>
    </div>
  );
}

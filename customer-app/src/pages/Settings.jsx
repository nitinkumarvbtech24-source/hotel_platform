import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    User,
    Bell,
    Lock,
    Globe,
    LogOut,
    Trash2,
    Shield,
    Smartphone
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import '../styles/settings.css';

export default function Settings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('profile');

    // User State (Init from localStorage)
    const [name, setName] = useState(localStorage.getItem('customerName') || '');
    const [email, setEmail] = useState(localStorage.getItem('customerEmail') || '');

    // Form States
    const [isSaving, setIsSaving] = useState(false);

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to log out?')) {
            await signOut(auth);
            localStorage.clear();
            navigate('/login');
        }
    };

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            localStorage.setItem('customerName', name);
            localStorage.setItem('customerEmail', email);
            alert('Profile updated successfully!');
            setIsSaving(false);
        }, 1000);
    };

    const navItems = [
        { id: 'profile', label: 'Profile', icon: <User size={20} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
        { id: 'security', label: 'Security', icon: <Lock size={20} /> },
        { id: 'preferences', label: 'Preferences', icon: <Globe size={20} /> }
    ];

    return (
        <div className="settings-container">
            <header className="settings-header">
                <Link to="/dashboard" className="back-btn" style={{ textDecoration: 'none' }}>
                    <ArrowLeft size={24} />
                </Link>
                <h1>Settings</h1>
            </header>

            <div className="settings-layout">
                {/* SETTINGS SIDEBAR */}
                <nav className="settings-nav">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`settings-nav-btn ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                    <button className="settings-nav-btn" onClick={handleLogout} style={{ marginTop: 'auto', color: '#ef4444' }}>
                        <LogOut size={20} />
                        <span>Log Out</span>
                    </button>
                </nav>

                {/* SETTINGS CONTENT */}
                <main className="settings-content">
                    {activeTab === 'profile' && (
                        <div className="settings-section">
                            <h2>Profile Settings</h2>
                            <form onSubmit={handleUpdateProfile} className="settings-section">
                                <div className="settings-form-group">
                                    <label>Full Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Your Name"
                                        required
                                    />
                                </div>
                                <div className="settings-form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="email@example.com"
                                        required
                                    />
                                </div>
                                <button type="submit" className="save-settings-btn" disabled={isSaving}>
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="settings-section">
                            <h2>Notifications</h2>
                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <h4>Order Status Updates</h4>
                                    <p>Get notified when your order is accepted or ready.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <h4>Promotional Offers</h4>
                                    <p>Receive alerts about discounts and new menus.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <h4>SMS Tracking</h4>
                                    <p>Receive order tracking links via SMS.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="settings-section">
                            <h2>Security & Privacy</h2>
                            <div className="settings-form-group">
                                <label>Current Password</label>
                                <input type="password" placeholder="••••••••" />
                            </div>
                            <div className="settings-form-group">
                                <label>New Password</label>
                                <input type="password" placeholder="Min 8 characters" />
                            </div>
                            <div className="toggle-item" style={{ marginTop: 12 }}>
                                <div className="toggle-info">
                                    <h4>Two-Factor Authentication</h4>
                                    <p>Add an extra layer of security to your account.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <button className="save-settings-btn">Update Security</button>
                            
                            <button className="delete-account-btn">
                                <Trash2 size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                                Delete Account Permanently
                            </button>
                        </div>
                    )}

                    {activeTab === 'preferences' && (
                        <div className="settings-section">
                            <h2>App Preferences</h2>
                            <div className="settings-form-group">
                                <label>Default Language</label>
                                <select style={{ 
                                    padding: '14px', 
                                    borderRadius: '14px', 
                                    border: '1px solid #e2e8f0',
                                    background: '#f8fafc',
                                    fontWeight: 600
                                }}>
                                    <option>English (US)</option>
                                    <option>Hindi (हिन्दी)</option>
                                    <option>Telugu (తెలుగు)</option>
                                </select>
                            </div>
                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <h4>Order Tracking View</h4>
                                    <p>Show real-time map during doorstep delivery.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="toggle-item">
                                <div className="toggle-info">
                                    <h4>Location Services</h4>
                                    <p>Help us find your camp location automatically.</p>
                                </div>
                                <label className="switch">
                                    <input type="checkbox" defaultChecked />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

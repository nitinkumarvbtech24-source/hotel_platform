import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    signInWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';

import {
    collection,
    getDocs,
    query,
    where
} from 'firebase/firestore';

import { 
    Mail, 
    Lock, 
    ArrowRight, 
    Loader2,
    CheckCircle2
} from 'lucide-react';

import { auth, googleProvider, db } from '../firebase';
import '../Styles/auth.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem('hotelId')) {
            navigate('/hotel-select');
        }
    }, []);

    const verifyUserAccess = async (email, password) => {
        const hotelId = localStorage.getItem('hotelId');
        const selectedRole = localStorage.getItem('role')?.toLowerCase();

        if (selectedRole === 'owner') {
            const q = query(
                collection(db, 'users'),
                where('hotelId', '==', hotelId),
                where('email', '==', email)
            );
            const snapshot = await getDocs(q);
            if (snapshot.empty) throw new Error('Owner account not found for this hotel');
            
            localStorage.setItem('userRole', 'owner');
            return true;
        }

        const staffQ = query(
            collection(db, 'hotels', hotelId, 'staff'),
            where('email', '==', email),
            where('password', '==', password)
        );

        const staffSnap = await getDocs(staffQ);

        if (staffSnap.empty) {
            throw new Error(`Invalid credentials for ${selectedRole}`);
        }

        const staffData = staffSnap.docs[0].data();
        
        if (staffData.role.toLowerCase() !== selectedRole && !(selectedRole === 'chef' && staffData.role === 'KitchenStaff')) {
             throw new Error(`Role mismatch: Registered as ${staffData.role}`);
        }

        localStorage.setItem('userRole', staffData.role.toLowerCase());
        localStorage.setItem('staffName', staffData.name);
        return true;
    };

    const handleLogin = async () => {
        setLoading(true);
        try {
            setError('');
            const selectedRole = localStorage.getItem('role');

            if (selectedRole === 'owner') {
                await signInWithEmailAndPassword(auth, email, password);
            }
            
            await verifyUserAccess(email, password);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            setError('');
            const userCred = await signInWithPopup(auth, googleProvider);
            await verifyUserAccess(userCred.user.email, ''); 
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            {/* Animated Background Blobs */}
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>
            <div className="bg-blob blob-3"></div>

            <div className="auth-container-premium">
                <div className="login-vibrant-container">
                    {/* Hero Side */}
                    <div className="login-hero-vibrant">
                        <div className="brand-vibrant">
                            <span>CHILLAX HOTEL OS</span>
                            <h1>Hospitality. Redefined.</h1>
                        </div>
                        <div className="hero-quote">
                            <p style={{ color: 'white' }}>"Precision in management leads to excellence in service."</p>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600 }}>
                            TRUSTED BY 500+ HOTELS GLOBALLY
                        </div>
                    </div>

                    {/* Form Side */}
                    <div className="login-form-vibrant">
                        <div className="form-header">
                            <h2 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Login</h2>
                            <p>Enter your credentials to access your dashboard</p>
                        </div>

                        {error && <div className="error-pill">{error}</div>}

                        <div className="input-vibrant">
                            <label>Professional Email</label>
                            <div className="input-field-wrap">
                                <Mail size={22} />
                                <input
                                    type="email"
                                    placeholder="name@hotel.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="input-vibrant">
                            <label>Secure Password</label>
                            <div className="input-field-wrap">
                                <Lock size={22} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                />
                            </div>
                        </div>

                        <button 
                            className="btn-vibrant-primary" 
                            onClick={handleLogin}
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={24} />
                            ) : (
                                <>Access Dashboard <ArrowRight size={22} /></>
                            )}
                        </button>

                        <div className="divider-modern">OR SIGN IN WITH</div>

                        <button 
                            className="google-btn-modern" 
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            style={{ padding: '18px', borderRadius: '20px' }}
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="22" />
                            Google Workspace
                        </button>

                        <div style={{ marginTop: '40px', textAlign: 'center' }}>
                            <button 
                                onClick={() => navigate('/role-select')}
                                style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', textDecoration: 'underline' }}
                            >
                                Change Access Role
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
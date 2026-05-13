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
            <div className="login-split-container">
                {/* Hero Side */}
                <div className="login-hero-side">
                    <img
                        src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                        alt="Premium Hotel"
                    />
                    <div className="hero-content">
                        <div className="brand-large">
                            <span>CHILLAX HOTEL OS</span>
                            <h1>Industry Standard Hospitality.</h1>
                        </div>
                        <div className="hero-quote">
                            <p>"Efficiency is the foundation of great guest experiences."</p>
                        </div>
                    </div>
                    <div className="hero-footer" style={{ position: 'relative', z-index: 2, fontSize: '0.8rem', opacity: 0.7 }}>
                        © 2024 Chillax Systems. All rights reserved.
                    </div>
                </div>

                {/* Form Side */}
                <div className="login-form-side">
                    <div className="form-header">
                        <h2>Welcome back</h2>
                        <p>Accessing as <strong>{localStorage.getItem('role') || 'Staff'}</strong> at {localStorage.getItem('hotelName') || 'Hotel'}</p>
                    </div>

                    {error && <div className="error-pill">{error}</div>}

                    <div className="input-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} />
                            <input
                                type="email"
                                placeholder="name@hotel.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} />
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
                        className="login-btn-premium" 
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Loader2 className="animate-spin" size={20} /> Authenticating...
                            </div>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                Sign In to Dashboard <ArrowRight size={20} />
                            </div>
                        )}
                    </button>

                    <div className="divider-modern">OR</div>

                    <button 
                        className="google-btn-modern" 
                        onClick={handleGoogleLogin}
                        disabled={loading}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                        Continue with Google
                    </button>

                    <div style={{ marginTop: '32px', textAlign: 'center' }}>
                        <button 
                            onClick={() => navigate('/role-select')}
                            style={{ background: 'none', border: 'none', color: '#3f4c38', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                            ← Back to Role Selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
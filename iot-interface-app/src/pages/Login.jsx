import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Cpu, Lock, Mail, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Login({ hotel, role, onLoginSuccess, onBack }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let userData = null;

            if (role === 'owner') {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // DIRECT LOOKUP: Get user profile by Document ID (UID)
                const userDoc = await getDoc(doc(db, 'users', user.uid));

                if (userDoc.exists()) {
                    userData = { id: userDoc.id, ...userDoc.data() };
                    
                    // VALIDATE HOTEL (Owner must be linked to the selected hotel)
                    if (userData.hotelId !== hotel.id) {
                        setError(`Access Denied: Your account is not registered with ${hotel.hotelName}.`);
                        await auth.signOut();
                        return;
                    }
                } else {
                    setError('Owner profile not found. Please ensure you are registered.');
                    await auth.signOut();
                    return;
                }
            } else {
                // MANAGER LOGIN (Uses staff subcollection)
                const staffQ = query(
                    collection(db, 'hotels', hotel.id, 'staff'),
                    where('email', '==', email),
                    where('password', '==', password)
                );
                const staffSnap = await getDocs(staffQ);

                if (!staffSnap.empty) {
                    userData = { id: staffSnap.docs[0].id, ...staffSnap.docs[0].data() };
                    if (userData.role.toLowerCase() !== 'manager') {
                        setError(`Access Denied: You are registered as ${userData.role.toUpperCase()}.`);
                        return;
                    }
                } else {
                    setError('Invalid Manager credentials.');
                    return;
                }
            }

            if (userData) {
                localStorage.setItem('hotelId', hotel.id);
                localStorage.setItem('hotelName', hotel.hotelName);
                localStorage.setItem('userRole', role); // Use the role we logged in with
                onLoginSuccess(userData);
            }
        } catch (err) {
            console.error("Login Error:", err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Invalid Owner credentials. Please check your email and password.');
            } else if (err.code === 'auth/network-request-failed') {
                setError('Network error. Please check your internet connection.');
            } else {
                setError(err.message || 'Authentication Failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="iot-login-shell">
            <div className="iot-login-card">
                <button className="back-btn-iot-mini" onClick={onBack}>
                    <ArrowLeft size={16} /> Change Role
                </button>
                <div className="login-header">
                    <div className="brand-icon">
                        <Cpu size={40} />
                    </div>
                    <h1>{role.toUpperCase()} LOGIN</h1>
                    <p>Authenticating for <strong>{hotel.hotelName}</strong></p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group-iot">
                        <label>{role === 'owner' ? 'Owner Email' : 'Manager Email'}</label>
                        <div className="input-wrapper">
                            <Mail size={18} />
                            <input 
                                type="email" 
                                placeholder={role === 'owner' ? "owner@example.com" : "manager@example.com"}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group-iot">
                        <label>Security Key</label>
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input 
                                type="password" 
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>
                    </div>

                    {error && <div className="login-error"><ShieldCheck size={16} /> {error}</div>}

                    <button type="submit" disabled={loading} className="iot-btn-primary">
                        {loading ? 'Authenticating...' : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                        <ArrowRight size={20} />
                    </button>
                </form>

                <div className="login-footer">
                    <span>SECURE HARDWARE GATEWAY v4.2</span>
                    <div className="status-dot online"></div>
                </div>
            </div>
        </div>
    );
}

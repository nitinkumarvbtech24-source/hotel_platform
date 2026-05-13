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
                localStorage.setItem('userRole', userData.role);
                onLoginSuccess(userData);
            }
        } catch (err) {
            console.error(err);
            setError('Authentication Failed: Invalid credentials or network error.');
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
                    <h1>IOT CORE</h1>
                    <p>TTB Card Management & Hardware Monitor</p>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group-iot">
                        <label>Authorized Email</label>
                        <div className="input-wrapper">
                            <Mail size={18} />
                            <input 
                                type="email" 
                                placeholder="manager@chillax.com"
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
                        {loading ? 'Authenticating...' : 'Enter System'}
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

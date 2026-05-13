import { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Fetch user role from Firestore
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // VALIDATE HOTEL AND ROLE
                if (userData.hotelId !== hotel.id) {
                    setError(`Access Denied: Your account is not registered with ${hotel.hotelName}.`);
                    await auth.signOut();
                    return;
                }

                if (userData.role !== role && userData.role !== 'owner') { // Owners can login as managers usually
                    setError(`Access Denied: You are not authorized as a ${role.toUpperCase()}.`);
                    await auth.signOut();
                    return;
                }

                localStorage.setItem('hotelId', userData.hotelId);
                localStorage.setItem('hotelName', userData.hotelName);
                localStorage.setItem('userRole', userData.role);
                onLoginSuccess(userData);
            } else {
                setError('User profile not found in system.');
                await auth.signOut();
            }
        } catch (err) {
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

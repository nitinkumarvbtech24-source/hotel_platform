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

import { auth, googleProvider, db } from '../firebase';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem('hotelId')) {
            navigate('/hotel-select');
        }
    }, []);

    const verifyUserAccess = async (email, password) => {
        const hotelId = localStorage.getItem('hotelId');
        const selectedRole = localStorage.getItem('role')?.toLowerCase();

        // Case 1: Owner Login
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

        // Case 2: Staff Login
        // We check against the stored staff role (Manager, Waiter, KitchenStaff etc)
        // Note: selectedRole from RoleSelect might be 'manager', 'waiter', 'chef'
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
        
        // Match the selected role with the registered staff role (case insensitive)
        if (staffData.role.toLowerCase() !== selectedRole && !(selectedRole === 'chef' && staffData.role === 'KitchenStaff')) {
             throw new Error(`Role mismatch: Registered as ${staffData.role}`);
        }

        localStorage.setItem('userRole', staffData.role.toLowerCase());
        localStorage.setItem('staffName', staffData.name);
        return true;
    };

    const handleLogin = async () => {
        try {
            setError('');

            const selectedRole = localStorage.getItem('role');

            if (selectedRole === 'Owner') {
                // Owners use Firebase Auth
                await signInWithEmailAndPassword(auth, email, password);
            }
            
            // Verify access (for both Owner and Staff)
            await verifyUserAccess(email, password);

            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Login failed');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError('');

            const userCred = await signInWithPopup(auth, googleProvider);
            await verifyUserAccess(userCred.user.email, ''); 

            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Google login failed');
        }
    };

    return (
        <div className="login-shell">
            <div className="login-container">
                <div className="login-brand">
                    <h1>Chillax</h1>
                    <p>Order, Chill and Relax</p>
                </div>

                <div className="login-hero">
                    <img
                        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb"
                        alt="Hotel"
                    />
                </div>

                <div className="login-card">
                    <div className="login-tabs">
                        <button className="active">Log In</button>
                    </div>

                    <h2>Welcome Back</h2>
                    <p>
                        {localStorage.getItem('hotelName') || 'Selected Hotel'}
                    </p>

                    {error && <div className="login-error">{error}</div>}

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button className="login-primary-btn" onClick={handleLogin}>
                        Get Started
                    </button>

                    <div className="login-divider">Or sign in with</div>

                    <button className="social-btn" onClick={handleGoogleLogin}>
                        Continue with Google
                    </button>
                </div>
            </div>
        </div>
    );
}
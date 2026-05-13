import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    createUserWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';

import {
    addDoc,
    collection
} from 'firebase/firestore';

import {
    auth,
    googleProvider,
    db
} from '../firebase';

export default function RegisterHotel() {
    const navigate = useNavigate();

    const [hotelName, setHotelName] = useState('');
    const [location, setLocation] = useState('');
    const [phone, setPhone] = useState('');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const registerHotel = async () => {
        try {
            setLoading(true);
            setError('');

            const userCred = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const hotelRef = await addDoc(collection(db, 'hotels'), {
                hotelName,
                location,
                phone,
                ownerUid: userCred.user.uid,
                ownerEmail: email,
                createdAt: new Date()
            });

            await addDoc(collection(db, 'users'), {
                uid: userCred.user.uid,
                role: 'owner',
                hotelId: hotelRef.id,
                email
            });

            navigate('/hotel-select');
        } catch (err) {
            console.error(err);
            setError(err.code || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const registerWithGoogle = async () => {
        try {
            setLoading(true);
            setError('');

            const userCred = await signInWithPopup(auth, googleProvider);

            const hotelRef = await addDoc(collection(db, 'hotels'), {
                hotelName,
                location,
                phone,
                ownerUid: userCred.user.uid,
                ownerEmail: userCred.user.email,
                createdAt: new Date()
            });

            await addDoc(collection(db, 'users'), {
                uid: userCred.user.uid,
                role: 'owner',
                hotelId: hotelRef.id,
                email: userCred.user.email
            });

            navigate('/hotel-select');
        } catch (err) {
            console.error(err);
            setError(err.code || 'Google registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-shell">
            <div className="register-card">
                <h1>Register New Hotel</h1>
                <p>Create your hotel workspace</p>

                {error && <div className="login-error">{error}</div>}

                <input
                    placeholder="Hotel Name"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                />

                <input
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />

                <input
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />

                <input
                    type="email"
                    placeholder="Owner Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    className="login-primary-btn"
                    onClick={registerHotel}
                    disabled={loading}
                >
                    {loading ? 'Creating Hotel...' : 'Register Hotel'}
                </button>

                <button
                    className="social-btn"
                    onClick={registerWithGoogle}
                    disabled={loading}
                >
                    Continue with Google
                </button>
            </div>
        </div>
    );
}
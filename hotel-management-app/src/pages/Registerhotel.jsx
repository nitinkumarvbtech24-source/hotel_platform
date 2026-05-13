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
    Building2, 
    MapPin, 
    Phone, 
    Mail, 
    Lock, 
    Plus, 
    Loader2, 
    ArrowLeft 
} from 'lucide-react';
import {
    auth,
    googleProvider,
    db
} from '../firebase';
import '../Styles/auth.css';

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
        if (!hotelName || !email || !password) {
            setError('Please fill in all required fields');
            return;
        }
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
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const registerWithGoogle = async () => {
        if (!hotelName) {
            setError('Please enter your Hotel Name first');
            return;
        }
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
            setError(err.message || 'Google registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <div className="hotel-selection-wrapper" style={{ maxWidth: '700px' }}>
                <div className="hotel-card-modern">
                    <div className="auth-header">
                        <button 
                            onClick={() => navigate('/hotel-select')}
                            style={{ position: 'absolute', left: '0', top: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                        <h1>Register Property</h1>
                        <p>Create a new digital workspace for your hospitality business</p>
                    </div>

                    {error && <div className="error-pill">{error}</div>}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="input-group">
                            <label>Hotel Name *</label>
                            <div className="input-wrapper">
                                <Building2 size={18} />
                                <input
                                    placeholder="Grand Royal Plaza"
                                    value={hotelName}
                                    onChange={(e) => setHotelName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Location</label>
                            <div className="input-wrapper">
                                <MapPin size={18} />
                                <input
                                    placeholder="City, State"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Business Phone</label>
                        <div className="input-wrapper">
                            <Phone size={18} />
                            <input
                                placeholder="+1 (555) 000-0000"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <div style={{ margin: '24px 0', height: '1px', background: '#f1f5f9' }}></div>

                    <div className="input-group">
                        <label>Owner Email *</label>
                        <div className="input-wrapper">
                            <Mail size={18} />
                            <input
                                type="email"
                                placeholder="owner@hotel.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Security Password *</label>
                        <div className="input-wrapper">
                            <Lock size={18} />
                            <input
                                type="password"
                                placeholder="Min. 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        className="login-btn-premium"
                        onClick={registerHotel}
                        disabled={loading}
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>Create Workspace <Plus size={18} /></>
                        )}
                    </button>

                    <div className="divider-modern">OR REGISTER WITH</div>

                    <button
                        className="google-btn-modern"
                        onClick={registerWithGoogle}
                        disabled={loading}
                    >
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" />
                        Google Account
                    </button>
                </div>
            </div>
        </div>
    );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { Search, Building2, MapPin, Plus, Loader2, ArrowLeft } from 'lucide-react';
import { db } from '../firebase';
import '../Styles/auth.css';

export default function HotelSelect() {
    const navigate = useNavigate();

    const [hotels, setHotels] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHotels();
    }, []);

    const fetchHotels = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'hotels'));
            const hotelList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHotels(hotelList);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const selectHotel = (hotel) => {
        localStorage.setItem('hotelId', hotel.id);
        localStorage.setItem('hotelName', hotel.hotelName);
        navigate('/login');
    };

    const filteredHotels = hotels.filter(hotel =>
        hotel.hotelName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="auth-shell">
            {/* Animated Background Blobs */}
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>
            <div className="bg-blob blob-3"></div>

            <div className="auth-container-premium">
                <div className="hotel-card-vibrant">
                    <div className="auth-header">
                        <button 
                            onClick={() => navigate('/role-select')}
                            style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '20px' }}
                        >
                            <ArrowLeft size={20} /> Back
                        </button>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '8px' }}>Select Property</h1>
                        <p>Currently accessing as <strong>{localStorage.getItem('role') || 'Staff'}</strong></p>
                    </div>

                    <div className="search-vibrant">
                        <Search size={24} color="#64748b" />
                        <input
                            type="text"
                            placeholder="Filter registered properties..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ background: 'none', border: 'none', outline: 'none', width: '100%', fontSize: '1.1rem', fontWeight: 600 }}
                        />
                    </div>

                    <div className="hotel-list-modern">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <Loader2 className="animate-spin" size={40} color="#10b981" />
                                <p style={{ marginTop: '16px', fontWeight: 600, color: '#64748b' }}>Locating workspaces...</p>
                            </div>
                        ) : filteredHotels.length > 0 ? (
                            filteredHotels.map(hotel => (
                                <div
                                    key={hotel.id}
                                    className="hotel-item-vibrant"
                                    onClick={() => selectHotel(hotel)}
                                >
                                    <div className="hotel-icon-vibrant">
                                        <Building2 size={28} />
                                    </div>

                                    <div className="hotel-info-modern">
                                        <h3 style={{ fontSize: '1.2rem' }}>{hotel.hotelName}</h3>
                                        <span style={{ fontSize: '0.9rem' }}>
                                            <MapPin size={16} />
                                            {hotel.location || 'Industrial Zone'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                <p>No property found matching "{search}"</p>
                            </div>
                        )}
                    </div>

                    <button
                        className="btn-vibrant-primary"
                        onClick={() => navigate('/register-hotel')}
                        style={{ marginTop: '32px' }}
                    >
                        <Plus size={24} />
                        Register New Property
                    </button>
                </div>
            </div>
        </div>
    );
}
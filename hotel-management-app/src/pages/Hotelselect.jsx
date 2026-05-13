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
            <div className="hotel-selection-wrapper">
                <div className="hotel-card-modern">
                    <div className="auth-header">
                        <button 
                            onClick={() => navigate('/role-select')}
                            style={{ position: 'absolute', left: '0', top: '10px', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                        <h1>Select Hotel</h1>
                        <p>Accessing as <strong>{localStorage.getItem('role') || 'Staff'}</strong></p>
                    </div>

                    <div className="search-bar-modern">
                        <Search size={20} color="#64748b" />
                        <input
                            type="text"
                            placeholder="Search by hotel name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="hotel-list-modern">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 12px' }} />
                                <p>Finding workspaces...</p>
                            </div>
                        ) : filteredHotels.length > 0 ? (
                            filteredHotels.map(hotel => (
                                <div
                                    key={hotel.id}
                                    className="hotel-item-modern"
                                    onClick={() => selectHotel(hotel)}
                                >
                                    <div className="hotel-icon-box">
                                        <Building2 size={24} />
                                    </div>

                                    <div className="hotel-info-modern">
                                        <h3>{hotel.hotelName}</h3>
                                        <span>
                                            <MapPin size={14} />
                                            {hotel.location || 'Location not set'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                <p>No hotels found matching "{search}"</p>
                            </div>
                        )}
                    </div>

                    <button
                        className="register-btn-modern"
                        onClick={() => navigate('/register-hotel')}
                    >
                        <Plus size={20} />
                        Register New Hotel
                    </button>
                </div>
            </div>
        </div>
    );
}
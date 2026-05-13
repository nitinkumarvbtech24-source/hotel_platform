import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { Search, Building2, MapPin, Plus } from 'lucide-react';
import { db } from '../firebase';

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
        <div className="login-shell">
            <div className="hotel-select-card">
                <div className="hotel-header">
                    <h1>Select Hotel</h1>
                    <p>Choose your hotel workspace to continue</p>
                </div>

                <div className="search-wrapper">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search registered hotels..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="hotel-search"
                    />
                </div>

                <div className="hotel-list">
                    {loading ? (
                        <p className="status-text">Loading hotels...</p>
                    ) : filteredHotels.length > 0 ? (
                        filteredHotels.map(hotel => (
                            <div
                                key={hotel.id}
                                className="hotel-item"
                                onClick={() => selectHotel(hotel)}
                            >
                                <div className="hotel-icon">
                                    <Building2 size={22} />
                                </div>

                                <div className="hotel-info">
                                    <h3>{hotel.hotelName}</h3>
                                    <span>
                                        <MapPin size={14} />
                                        {hotel.location}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="status-text">No hotels found</p>
                    )}
                </div>

                <button
                    className="register-hotel-btn"
                    onClick={() => navigate('/register-hotel')}
                >
                    <Plus size={18} />
                    Register New Hotel
                </button>
            </div>
        </div>
    );
}
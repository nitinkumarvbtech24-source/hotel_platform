import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Building2, Search, ArrowRight, MapPin } from 'lucide-react';

export default function Hotelselect({ onSelect }) {
    const [hotels, setHotels] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const snap = await getDocs(collection(db, 'hotels'));
                setHotels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchHotels();
    }, []);

    const filteredHotels = hotels.filter(h => 
        h.hotelName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="iot-auth-shell">
            <div className="auth-container narrow">
                <div className="auth-header">
                    <div className="status-badge">TTB GATEWAY v4.2</div>
                    <h1>Select Property</h1>
                    <p>Access the TTB Card Manager for your specific hotel node.</p>
                </div>

                <div className="search-bar-iot">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search hotel property..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="hotel-grid-iot">
                    {loading ? (
                        <div className="loading-dots">Detecting nodes...</div>
                    ) : (
                        filteredHotels.map(hotel => (
                            <div 
                                key={hotel.id} 
                                className="hotel-card-iot"
                                onClick={() => onSelect(hotel)}
                            >
                                <div className="hotel-card-left">
                                    <div className="hotel-icon-box">
                                        <Building2 size={24} />
                                    </div>
                                    <div className="hotel-card-info">
                                        <h3>{hotel.hotelName}</h3>
                                        <span><MapPin size={12} /> {hotel.location || 'Active Node'}</span>
                                    </div>
                                </div>
                                <ArrowRight size={20} className="arrow" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

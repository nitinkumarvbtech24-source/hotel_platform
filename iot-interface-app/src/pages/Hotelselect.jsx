import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Building2, Search, ArrowRight, MapPin, AlertCircle } from 'lucide-react';

export default function Hotelselect({ onSelect }) {
    const [hotels, setHotels] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchHotels = async () => {
            try {
                setError(null);
                const snap = await getDocs(collection(db, 'hotels'));
                if (snap.empty) {
                    console.warn("No hotels found in 'hotels' collection");
                }
                setHotels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error("Firebase Fetch Error:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchHotels();
    }, []);

    const filteredHotels = hotels.filter(h => {
        const name = h.hotelName || h.name || '';
        return name.toLowerCase().includes(searchTerm.toLowerCase());
    });

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
                    ) : error ? (
                        <div className="login-error" style={{ margin: 0 }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    ) : filteredHotels.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--iot-text-dim)' }}>
                            <Building2 size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                            <p>No properties detected.</p>
                            <button 
                                onClick={() => window.location.reload()}
                                style={{ marginTop: '10px', background: 'none', border: '1px solid var(--iot-border)', color: '#fff', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                Reload
                            </button>
                        </div>
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
                                        <h3>{hotel.hotelName || hotel.name}</h3>
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

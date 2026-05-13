import { useEffect, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import {
    collection,
    getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

export default function HotelSelector({
    selectedHotel,
    setSelectedHotel
}) {
    const [hotels, setHotels] = useState([]);
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const snap = await getDocs(
                    collection(db, 'hotels')
                );

                const data = snap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setHotels(data);
            } catch (err) {
                console.error(
                    'Error fetching hotels:',
                    err
                );
            }
        };

        fetchHotels();
    }, []);

    const filteredHotels = hotels.filter(
        hotel =>
            hotel.hotelName
                ?.toLowerCase()
                .includes(
                    search.toLowerCase()
                ) ||
            hotel.location
                ?.toLowerCase()
                .includes(
                    search.toLowerCase()
                )
    );

    return (
        <div className="hotel-selector-wrapper">
            <label>
                Ordering From
            </label>

            <div className="hotel-selector">
                <Search size={18} />

                <input
                    type="text"
                    placeholder="Search hotel by name/location..."
                    value={search}
                    onChange={e => {
                        setSearch(
                            e.target.value
                        );
                        setOpen(true);
                    }}
                    onFocus={() =>
                        setOpen(true)
                    }
                />

                <ChevronDown size={18} />
            </div>

            {open && (
                <div className="hotel-dropdown">
                    {filteredHotels.length >
                        0 ? (
                        filteredHotels.map(
                            hotel => (
                                <button
                                    key={
                                        hotel.id
                                    }
                                    className={`hotel-option ${selectedHotel?.id ===
                                        hotel.id
                                        ? 'selected'
                                        : ''
                                        }`}
                                    onClick={() => {
                                        setSelectedHotel(
                                            hotel
                                        );
                                        setSearch(
                                            hotel.hotelName
                                        );
                                        setOpen(
                                            false
                                        );
                                    }}
                                >
                                    <div>
                                        <h4>
                                            {
                                                hotel.hotelName
                                            }
                                        </h4>
                                        <p>
                                            {
                                                hotel.location
                                            }
                                        </p>
                                    </div>
                                </button>
                            )
                        )
                    ) : (
                        <div className="hotel-empty">
                            No hotels found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
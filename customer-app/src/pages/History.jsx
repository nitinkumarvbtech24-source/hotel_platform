import { useEffect, useState } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import {
    History as HistoryIcon,
    Calendar,
    MapPin,
    Filter
} from 'lucide-react';
import CustomerSidebar from '../components/CustomerSidebar';
import '../styles/orders.css';

export default function History() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterDate, setFilterDate] = useState('');

    const userId = localStorage.getItem('userId') || 'anonymous';

    useEffect(() => {
        setLoading(true);
        
        // Simplified query to avoid index errors
        const q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            let data = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter(order => order.userId === userId);

            // Client-side date filtering

            // Client-side date filtering for simplicity and flexibility
            if (filterDate) {
                const searchDate = new Date(filterDate).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit'
                }).replace(/\//g, '');
                
                data = data.filter(order => order.billDate === searchDate);
            }

            setOrders(data);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching history:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId, filterDate]);

    const user = {
        name: localStorage.getItem('customerName') || 'Customer',
        email: localStorage.getItem('customerEmail') || 'No Email'
    };

    return (
        <div className="customer-dashboard-layout">
            <CustomerSidebar activePage="History" user={user} />

            <main className="customer-dashboard-main" style={{ overflowY: 'auto' }}>
                <div className="orders-page">
                    <header className="orders-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1>Order History</h1>
                            <p style={{ color: '#64748b' }}>View all your past orders</p>
                        </div>
                        <div className="filter-box" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'white', padding: '10px 20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <Calendar size={18} color="#7c3aed" />
                            <input 
                                type="date" 
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                style={{ border: 'none', outline: 'none', fontWeight: 700, color: '#1e293b' }}
                            />
                            {filterDate && (
                                <button 
                                    onClick={() => setFilterDate('')}
                                    style={{ border: 'none', background: 'none', color: '#ef4444', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </header>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading history...</div>
                    ) : orders.length === 0 ? (
                        <div className="orders-empty">
                            <HistoryIcon size={64} color="#e2e8f0" style={{ marginBottom: 20 }} />
                            <h3>No history found</h3>
                            <p>{filterDate ? "No orders found for the selected date." : "You haven't placed any orders yet."}</p>
                        </div>
                    ) : (
                        <div className="orders-list">
                            {orders.map(order => (
                                <div key={order.id} className="order-card">
                                    <div className="order-card-header">
                                        <div>
                                            <div className="hotel-info-tag" style={{ marginBottom: 8 }}>
                                                <span style={{ fontWeight: 800, color: '#1e293b' }}>{order.hotelName}</span>
                                                <span style={{ color: '#64748b', fontSize: '0.85rem', marginLeft: 8 }}>• {order.hotelLocation}</span>
                                            </div>
                                            <span className="bill-no">{order.billNumber}</span>
                                            <div className="delivery-badge" style={{ marginTop: 12 }}>
                                                <MapPin size={14} />
                                                <span>{order.deliveryMethod?.toUpperCase()}</span>
                                                {order.deliveryDetails?.campLocation && (
                                                    <span> • {order.deliveryDetails.campLocation}</span>
                                                )}
                                                {order.deliveryDetails?.blockName && (
                                                    <span> • Block {order.deliveryDetails.blockName}, Floor {order.deliveryDetails.floorNumber}, Room {order.deliveryDetails.roomNumber}</span>
                                                )}
                                                {order.timeSlot && (
                                                    <span style={{ color: '#7c3aed', background: '#f5f3ff', padding: '2px 8px', borderRadius: '6px', marginLeft: 8 }}>
                                                        {order.timeSlot.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="customer-info" style={{ marginTop: 12, padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem' }}>
                                                <div style={{ fontWeight: 600, color: '#334155' }}>👤 {order.userName || 'Guest'}</div>
                                                <div style={{ color: '#64748b', marginTop: 4 }}>✉️ {order.userEmail || 'No Email'}</div>
                                                <div style={{ color: '#64748b', marginTop: 4 }}>📞 {order.userMobile || 'No Mobile'}</div>
                                            </div>
                                        </div>
                                        <div className="order-meta">
                                            <span className="order-date">
                                                {order.createdAt?.toDate().toLocaleDateString()}
                                            </span>
                                            <span className="order-date" style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                                {order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className={`order-status ${order.status === 'passed_to_ttb' ? 'passed' : ''}`} style={{ 
                                                background: order.status === 'passed_to_ttb' ? '#dcfce7' : '#fef3c7',
                                                color: order.status === 'passed_to_ttb' ? '#166534' : '#92400e'
                                            }}>
                                                {order.status === 'passed_to_ttb' ? 'Completed/TTB' : 'Pending'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="order-items-list">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="order-item-row">
                                                <div className="item-qty-name">
                                                    <span className="item-qty">x{item.qty}</span>
                                                    <span>{item.name}</span>
                                                </div>
                                                <span className="item-price">₹{item.price * item.qty}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="order-card-footer">
                                        <div className="order-total-block">
                                            <h4>Total Bill</h4>
                                            <span className="order-total-price">₹{order.total}</span>
                                        </div>
                                        <div style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>
                                            Paid via {order.paymentMethod?.toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

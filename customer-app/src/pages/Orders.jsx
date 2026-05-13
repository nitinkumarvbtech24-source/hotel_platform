import { useEffect, useState } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import {
    Package,
    Clock,
    MapPin,
    CheckCircle,
    Send
} from 'lucide-react';
import CustomerSidebar from '../components/CustomerSidebar';
import '../styles/orders.css';

export default function Orders() {
    const [activeTab, setActiveTab] = useState('my'); // 'my' or 'ttb'
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const userId = localStorage.getItem('userId') || 'anonymous';

    useEffect(() => {
        setLoading(true);
        
        // Simplified query to avoid complex index requirements
        // We fetch all orders and filter by user and status client-side
        const q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const allData = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side filtering based on user and active tab
            const filteredData = allData.filter(order => {
                const isUser = order.userId === userId;
                if (!isUser) return false;

                if (activeTab === 'my') {
                    return order.status === 'pending' || order.status === 'ready';
                } else {
                    return order.status === 'passed_to_ttb';
                }
            });

            setOrders(filteredData);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching orders:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeTab, userId]);

    const handlePassToTTB = async (orderId) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                status: 'passed_to_ttb',
                passedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error("Error passing to TTB:", err);
            alert("Failed to pass to TTB.");
        }
    };

    const handleRevert = async (orderId) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                status: 'pending',
                revertedAt: new Date().toISOString()
            });
        } catch (err) {
            console.error("Error reverting order:", err);
            alert("Failed to revert order.");
        }
    };

    const user = {
        name: localStorage.getItem('customerName') || 'Customer',
        email: localStorage.getItem('customerEmail') || 'No Email'
    };

    return (
        <div className="customer-dashboard-layout">
            <CustomerSidebar activePage="Orders" user={user} />

            <main className="customer-dashboard-main" style={{ overflowY: 'auto' }}>
                <div className="orders-page">
                    <header className="orders-header">
                        <h1>Your Orders</h1>
                        <div className="orders-tabs">
                            <button
                                className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
                                onClick={() => setActiveTab('my')}
                            >
                                My Orders
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'ttb' ? 'active' : ''}`}
                                onClick={() => setActiveTab('ttb')}
                            >
                                TTB Orders
                            </button>
                        </div>
                    </header>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>Loading orders...</div>
                    ) : orders.length === 0 ? (
                        <div className="orders-empty">
                            <Package size={64} color="#e2e8f0" style={{ marginBottom: 20 }} />
                            <h3>No orders found</h3>
                            <p>You don't have any orders in this category yet.</p>
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
                                            <span className={`order-status ${order.status === 'passed_to_ttb' ? 'passed' : order.status === 'ready' ? 'ready' : ''}`}>
                                                {order.status === 'passed_to_ttb' ? 'Passed to TTB' : 
                                                 order.status === 'ready' ? 'READY FOR PICKUP' : 'Pending'}
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

                                    {order.status === 'ready' && (
                                        <div className="ready-notification-bar">
                                            <div className="ready-content">
                                                <CheckCircle size={18} />
                                                <span>Your order is prepared and ready at the counter!</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="order-card-footer">
                                        <div className="order-total-block">
                                            <h4>Total Bill</h4>
                                            <span className="order-total-price">₹{order.total}</span>
                                        </div>

                                        {order.status === 'pending' ? (
                                            <button
                                                className="pass-ttb-btn"
                                                onClick={() => handlePassToTTB(order.id)}
                                            >
                                                <Send size={18} style={{ marginRight: 8 }} />
                                                Pass to TTB
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                <div className="status-confirmed" style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                                                    <CheckCircle size={20} />
                                                    Confirmed
                                                </div>
                                                <button
                                                    className="pass-ttb-btn"
                                                    style={{ background: '#64748b' }}
                                                    onClick={() => handleRevert(order.id)}
                                                >
                                                    Revert
                                                </button>
                                            </div>
                                        )}
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

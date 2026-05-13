import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CreditCard, History, Search, Download, CheckCircle, Package, MapPin, Clock, User, Mail, Phone } from 'lucide-react';

export default function TTBBills() {
    const [orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
    const [dailyOrdersCount, setDailyOrdersCount] = useState(0);
    const [dailyRevenue, setDailyRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const hotelId = localStorage.getItem('hotelId');

    useEffect(() => {
        if (!hotelId) return;

        // Fetch orders ordered by createdAt to avoid needing complex composite indexes
        const q = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snap) => {
            const allHotelOrders = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter(order => order.hotelId === hotelId);

            setAllOrders(allHotelOrders);

            let data = allHotelOrders.filter(order => order.status === 'passed_to_ttb');
            
            // Sort locally by passedAt
            data.sort((a, b) => new Date(b.passedAt) - new Date(a.passedAt));
            setOrders(data);

            // Calculate daily totals for TTB/Online
            const now = new Date();
            const todayStr = now.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            }).replace(/\//g, '');

            const todayOrders = allHotelOrders.filter(order => order.billDate === todayStr);
            setDailyOrdersCount(todayOrders.length);
            setDailyRevenue(todayOrders.reduce((sum, order) => sum + (order.total || 0), 0));

            setLoading(false);
        });

        return () => unsubscribe();
    }, [hotelId]);

    const handleCompleteOrder = async (order) => {
        try {
            // 1. Update order status to completed
            const orderRef = doc(db, 'orders', order.id);
            await updateDoc(orderRef, {
                status: 'completed',
                completedAt: new Date().toISOString()
            });

            // Note: Log entry is now created immediately in Cart.jsx when order is placed.
            alert(`Order ${order.billNumber} Marked as Completed!`);
        } catch (err) {
            console.error("Error completing order:", err);
            alert("Failed to complete order.");
        }
    };

    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    return (
        <div className="ttb-bills-page" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
            <header className="dashboard-topbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b' }}>TTB Bills</h1>
                    <p style={{ color: '#64748b', marginTop: 4 }}>Manage and finalize digital payments synced from customers.</p>
                </div>
                <div className="role-badge" style={{ background: '#ecfdf5', color: '#059669', padding: '8px 16px', borderRadius: '20px', fontWeight: 600, height: 'fit-content' }}>Finance</div>
            </header>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active TTB</h3>
                    <div className="value" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginTop: '8px' }}>{orders.length}</div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Settlement</h3>
                    <div className="value" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#10b981', marginTop: '8px' }}>₹{totalRevenue}</div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Today's Orders</h3>
                    <div className="value" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#3b82f6', marginTop: '8px' }}>{dailyOrdersCount}</div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Today's Revenue</h3>
                    <div className="value" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#8b5cf6', marginTop: '8px' }}>₹{dailyRevenue}</div>
                </div>
            </div>

            <section className="monitor-section">
                <div className="section-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.25rem', color: '#334155' }}>
                        {activeTab === 'pending' ? 'Orders Ready for Finalization' : "Today's Settled TTB Bills"}
                    </h2>
                    <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                        <button 
                            onClick={() => setActiveTab('pending')}
                            style={{ 
                                padding: '8px 20px', 
                                borderRadius: '8px', 
                                border: 'none', 
                                background: activeTab === 'pending' ? 'white' : 'transparent',
                                fontWeight: 700,
                                color: activeTab === 'pending' ? '#1e293b' : '#64748b',
                                cursor: 'pointer',
                                transition: '0.2s'
                            }}
                        >
                            Pending
                        </button>
                        <button 
                            onClick={() => setActiveTab('history')}
                            style={{ 
                                padding: '8px 20px', 
                                borderRadius: '8px', 
                                border: 'none', 
                                background: activeTab === 'history' ? 'white' : 'transparent',
                                fontWeight: 700,
                                color: activeTab === 'history' ? '#1e293b' : '#64748b',
                                cursor: 'pointer',
                                transition: '0.2s'
                            }}
                        >
                            History
                        </button>
                    </div>
                </div>
                
                {loading ? (
                    <div>Loading TTB orders...</div>
                ) : (activeTab === 'pending' ? orders : allOrders.filter(o => {
                    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
                    return o.billDate === todayStr && o.status === 'completed';
                })).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', color: '#94a3b8' }}>
                        <CheckCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>{activeTab === 'pending' ? 'No orders in TTB right now.' : 'No finalized TTB bills in history for today.'}</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {(activeTab === 'pending' ? orders : allOrders.filter(o => {
                            const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
                            return o.billDate === todayStr && o.status === 'completed';
                        })).map(order => (
                            <div key={order.id} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '2px solid #10b981' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>{order.billNumber}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: '#64748b', fontSize: '0.9rem' }}>
                                            <MapPin size={16} />
                                            <span style={{ fontWeight: 600, color: '#4f46e5' }}>{order.deliveryMethod?.toUpperCase()}</span>
                                            {order.deliveryDetails?.campLocation && <span>• {order.deliveryDetails.campLocation}</span>}
                                            {order.deliveryDetails?.blockName && <span>• Block {order.deliveryDetails.blockName}, Floor {order.deliveryDetails.floorNumber}, Room {order.deliveryDetails.roomNumber}</span>}
                                            {order.timeSlot && (
                                                <span style={{ color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px', marginLeft: 8 }}>
                                                    <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                                                    {order.timeSlot.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                            {order.status === 'completed' 
                                                ? `Completed at ${new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                : `Passed at ${new Date(order.passedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                            }
                                        </div>
                                        {order.status === 'passed_to_ttb' && (
                                            <button 
                                                onClick={() => handleCompleteOrder(order)}
                                                style={{ marginTop: '12px', background: '#10b981', color: 'white', padding: '8px 20px', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                                            >
                                                <CheckCircle size={18} />
                                                Mark as Completed
                                            </button>
                                        )}
                                        {order.status === 'completed' && (
                                            <div style={{ marginTop: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.9rem', justifyContent: 'flex-end' }}>
                                                <CheckCircle size={18} />
                                                Finalized
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Customer Details */}
                                <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <User size={16} color="#059669" />
                                        <span style={{ fontWeight: 600, color: '#064e3b' }}>{order.userName || 'Guest'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Mail size={16} color="#059669" />
                                        <span style={{ color: '#064e3b' }}>{order.userEmail || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Phone size={16} color="#059669" />
                                        <span style={{ color: '#064e3b' }}>{order.userMobile || 'N/A'}</span>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Order Items</h4>
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #e2e8f0' }}>
                                            <div>
                                                <span style={{ fontWeight: 700, color: '#4f46e5', marginRight: '12px' }}>x{item.qty}</span>
                                                <span style={{ color: '#334155', fontWeight: 500 }}>{item.name}</span>
                                            </div>
                                            <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{item.price * item.qty}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer Total */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f1f5f9', padding: '16px 24px', borderRadius: '12px' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        Paid via <span style={{ fontWeight: 700, color: '#334155' }}>{order.paymentMethod?.toUpperCase()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                                        <span style={{ color: '#64748b', fontWeight: 600 }}>Total Bill</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>₹{order.total}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
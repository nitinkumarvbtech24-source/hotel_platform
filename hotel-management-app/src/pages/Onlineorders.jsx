import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ShoppingCart, Globe, Phone, Package, MapPin, User, Mail, Clock } from 'lucide-react';

export default function OnlineOrders() {
    const [orders, setOrders] = useState([]);
    const [allOrders, setAllOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('live'); // 'live' or 'history'
    const [activeMethod, setActiveMethod] = useState('all'); // 'all', 'dinein', 'camp', 'doorstep'
    const [filterSlot, setFilterSlot] = useState('');
    const [hotelSlots, setHotelSlots] = useState([]);
    
    const [dailyOrdersCount, setDailyOrdersCount] = useState(0);
    const [dailyRevenue, setDailyRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const hotelId = localStorage.getItem('hotelId');

    useEffect(() => {
        if (!hotelId) return;

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

            // Calculate daily totals (using billDate format DDMMYY)
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

        // Fetch Slots for filtering
        getDocs(collection(db, 'hotels', hotelId, 'slots')).then(snap => {
            setHotelSlots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => unsubscribe();
    }, [hotelId]);

    // Robust Filter Logic
    const filteredOrders = useMemo(() => {
        const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
        
        return allOrders.filter(order => {
            // Tab 1: Live vs History
            if (activeTab === 'live') {
                if (order.status !== 'pending') return false;
            } else {
                if (order.billDate !== todayStr || order.status === 'pending') return false;
            }

            // Tab 2: Method Sub-tabs (only for Live)
            if (activeTab === 'live' && activeMethod !== 'all') {
                if (order.deliveryMethod !== activeMethod) return false;
            }

            // Global Filter: Time Slot
            if (filterSlot && order.timeSlot !== filterSlot) return false;

            return true;
        });
    }, [allOrders, activeTab, activeMethod, filterSlot]);


    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    return (
        <div className="online-orders-page" style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
            <header className="dashboard-topbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: '#1e293b' }}>Online Orders</h1>
                    <p style={{ color: '#64748b', marginTop: 4 }}>Manage delivery and takeaway orders from your online store.</p>
                </div>
                <div className="role-badge" style={{ background: '#e0e7ff', color: '#4f46e5', padding: '8px 16px', borderRadius: '20px', fontWeight: 600, height: 'fit-content' }}>Online Store</div>
            </header>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Pending</h3>
                    <div className="value" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginTop: '8px' }}>{orders.length}</div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <h3 style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending Revenue</h3>
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
                <div className="section-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h2 style={{ fontSize: '1.25rem', color: '#334155', margin: 0 }}>
                            {activeTab === 'live' ? 'Live Orders' : "Today's History"}
                        </h2>
                        <div style={{ display: 'flex', background: '#e2e8f0', padding: '4px', borderRadius: '12px', gap: '4px' }}>
                            <button onClick={() => setActiveTab('live')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'live' ? 'white' : 'transparent', fontWeight: 700, color: activeTab === 'live' ? '#1e293b' : '#64748b', cursor: 'pointer' }}>Live</button>
                            <button onClick={() => setActiveTab('history')} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'history' ? 'white' : 'transparent', fontWeight: 700, color: activeTab === 'history' ? '#1e293b' : '#64748b', cursor: 'pointer' }}>History</button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <select 
                            value={filterSlot} 
                            onChange={e => setFilterSlot(e.target.value)}
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', fontWeight: 600, color: '#475569' }}
                        >
                            <option value="">All Time Slots</option>
                            {hotelSlots.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                {activeTab === 'live' && (
                    <div className="sub-tab-filters" style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                        {[
                            { id: 'all', label: 'All Orders' },
                            { id: 'dinein', label: 'Dine In' },
                            { id: 'camp', label: 'Camp' },
                            { id: 'doorstep', label: 'Doorstep' }
                        ].map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => setActiveMethod(sub.id)}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    background: activeMethod === sub.id ? '#1e293b' : 'white',
                                    color: activeMethod === sub.id ? 'white' : '#64748b',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                                    transition: '0.2s'
                                }}
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div>Loading active orders...</div>
                ) : filteredOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '16px', color: '#94a3b8' }}>
                        <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <p>No orders found matching your filters.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {filteredOrders.map(order => (
                            <div key={order.id} style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
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
                                            {order.createdAt?.toDate ? (
                                                <>
                                                    {order.createdAt.toDate().toLocaleDateString()} at {order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </>
                                            ) : 'Processing...'}
                                        </div>
                                        <div style={{ display: 'inline-block', marginTop: '8px', background: order.status === 'completed' || order.status === 'delivered' ? '#dcfce7' : '#fef3c7', color: order.status === 'completed' || order.status === 'delivered' ? '#166534' : '#92400e', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                                            {order.status === 'completed' || order.status === 'delivered' ? 'SETTLED & DONE' : 
                                             order.status === 'ready' ? 'READY FOR PICKUP' : 
                                             order.status === 'out_for_delivery' ? 'IN TRANSIT' : 'WAITING ON CUSTOMER (TTB)'}
                                        </div>
                                    </div>
                                </div>

                                {/* Customer Details */}
                                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <User size={16} color="#64748b" />
                                        <span style={{ fontWeight: 600, color: '#334155' }}>{order.userName || 'Guest'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Mail size={16} color="#64748b" />
                                        <span style={{ color: '#475569' }}>{order.userEmail || 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Phone size={16} color="#64748b" />
                                        <span style={{ color: '#475569' }}>{order.userMobile || 'N/A'}</span>
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
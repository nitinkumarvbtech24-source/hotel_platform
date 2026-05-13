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
        <div className="online-orders-page">
            <header className="dashboard-topbar">
                <div className="header-info">
                    <h1>Online Orders</h1>
                    <p>Manage delivery and takeaway orders from your online store.</p>
                </div>
                <div className="role-badge">Online Store</div>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Active Pending</h3>
                    <div className="value">{orders.length}</div>
                </div>
                <div className="stat-card">
                    <h3>Pending Revenue</h3>
                    <div className="value revenue">₹{totalRevenue}</div>
                </div>
                <div className="stat-card">
                    <h3>Today's Orders</h3>
                    <div className="value orders">{dailyOrdersCount}</div>
                </div>
                <div className="stat-card">
                    <h3>Today's Revenue</h3>
                    <div className="value daily-revenue">₹{dailyRevenue}</div>
                </div>
            </div>

            <section className="monitor-section">
                <div className="section-header">
                    <div className="header-left">
                        <h2>{activeTab === 'live' ? 'Live Orders' : "Today's History"}</h2>
                        <div className="tab-pills">
                            <button className={activeTab === 'live' ? 'active' : ''} onClick={() => setActiveTab('live')}>Live</button>
                            <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>History</button>
                        </div>
                    </div>

                    <div className="header-right">
                        <select 
                            className="slot-select"
                            value={filterSlot} 
                            onChange={e => setFilterSlot(e.target.value)}
                        >
                            <option value="">All Time Slots</option>
                            {hotelSlots.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                {activeTab === 'live' && (
                    <div className="sub-tab-filters">
                        {[
                            { id: 'all', label: 'All Orders' },
                            { id: 'dinein', label: 'Dine In' },
                            { id: 'camp', label: 'Camp' },
                            { id: 'doorstep', label: 'Doorstep' }
                        ].map(sub => (
                            <button
                                key={sub.id}
                                className={activeMethod === sub.id ? 'active' : ''}
                                onClick={() => setActiveMethod(sub.id)}
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>
                )}

                {loading ? (
                    <div className="loading-state">Loading active orders...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className="empty-state-card">
                        <Package size={48} />
                        <p>No orders found matching your filters.</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {filteredOrders.map(order => (
                            <div key={order.id} className="online-order-card">
                                <div className="order-header">
                                    <div className="order-meta">
                                        <div className="bill-number">{order.billNumber}</div>
                                        <div className="delivery-info">
                                            <MapPin size={16} />
                                            <span className="method-label">{order.deliveryMethod?.toUpperCase()}</span>
                                            {order.deliveryDetails?.campLocation && <span>• {order.deliveryDetails.campLocation}</span>}
                                            {order.deliveryDetails?.blockName && <span>• Block {order.deliveryDetails.blockName}, Floor {order.deliveryDetails.floorNumber}, Room {order.deliveryDetails.roomNumber}</span>}
                                            {order.timeSlot && (
                                                <span className="time-slot-badge">
                                                    <Clock size={12} />
                                                    {order.timeSlot.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="order-status-wrap">
                                        <div className="timestamp">
                                            {order.createdAt?.toDate ? (
                                                <>
                                                    {order.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </>
                                            ) : 'Processing...'}
                                        </div>
                                        <div className={`status-pill ${order.status}`}>
                                            {order.status === 'completed' || order.status === 'delivered' ? 'SETTLED & DONE' : 
                                             order.status === 'ready' ? 'READY FOR PICKUP' : 
                                             order.status === 'out_for_delivery' ? 'IN TRANSIT' : 'WAITING ON CUSTOMER (TTB)'}
                                        </div>
                                    </div>
                                </div>

                                <div className="customer-bar">
                                    <div className="customer-item">
                                        <User size={16} />
                                        <span>{order.userName || 'Guest'}</span>
                                    </div>
                                    <div className="customer-item">
                                        <Mail size={16} />
                                        <span>{order.userEmail || 'N/A'}</span>
                                    </div>
                                    <div className="customer-item">
                                        <Phone size={16} />
                                        <span>{order.userMobile || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="items-section">
                                    <h4>Order Items</h4>
                                    {order.items?.map((item, idx) => (
                                        <div key={idx} className="order-item-row">
                                            <div className="item-name-qty">
                                                <span className="qty">x{item.qty}</span>
                                                <span className="name">{item.name}</span>
                                            </div>
                                            <span className="item-price">₹{item.price * item.qty}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-footer">
                                    <div className="payment-method">
                                        Paid via <strong>{order.paymentMethod?.toUpperCase()}</strong>
                                    </div>
                                    <div className="total-amount">
                                        <span>Total Bill</span>
                                        <strong>₹{order.total}</strong>
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
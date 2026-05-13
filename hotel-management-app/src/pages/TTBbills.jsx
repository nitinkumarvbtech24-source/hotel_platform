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
        <div className="ttb-bills-page">
            <header className="dashboard-topbar">
                <div className="header-info">
                    <h1>TTB Bills</h1>
                    <p>Manage and finalize digital payments synced from customers.</p>
                </div>
                <div className="role-badge finance">Finance</div>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Active TTB</h3>
                    <div className="value">{orders.length}</div>
                </div>
                <div className="stat-card">
                    <h3>Pending Settlement</h3>
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
                    <h2>{activeTab === 'pending' ? 'Orders Ready for Finalization' : "Today's Settled TTB Bills"}</h2>
                    <div className="tab-pills">
                        <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>Pending</button>
                        <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>History</button>
                    </div>
                </div>
                
                {loading ? (
                    <div className="loading-state">Loading TTB orders...</div>
                ) : (activeTab === 'pending' ? orders : allOrders.filter(o => {
                    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
                    return o.billDate === todayStr && o.status === 'completed';
                })).length === 0 ? (
                    <div className="empty-state-card">
                        <CheckCircle size={48} />
                        <p>{activeTab === 'pending' ? 'No orders in TTB right now.' : 'No finalized TTB bills in history for today.'}</p>
                    </div>
                ) : (
                    <div className="orders-list">
                        {(activeTab === 'pending' ? orders : allOrders.filter(o => {
                            const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '');
                            return o.billDate === todayStr && o.status === 'completed';
                        })).map(order => (
                            <div key={order.id} className="online-order-card ttb-card">
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
                                            {order.status === 'completed' 
                                                ? `Done: ${new Date(order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                : `Passed: ${new Date(order.passedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                            }
                                        </div>
                                        {order.status === 'passed_to_ttb' && (
                                            <button 
                                                className="complete-action-btn"
                                                onClick={() => handleCompleteOrder(order)}
                                            >
                                                <CheckCircle size={18} />
                                                <span>Mark as Completed</span>
                                            </button>
                                        )}
                                        {order.status === 'completed' && (
                                            <div className="finalized-status">
                                                <CheckCircle size={18} />
                                                Finalized
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="customer-bar ttb-bar">
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
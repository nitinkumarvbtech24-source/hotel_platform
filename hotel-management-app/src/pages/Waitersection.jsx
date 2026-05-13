import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, 
    Clock, 
    CheckCircle, 
    ShoppingBag, 
    MapPin, 
    Building, 
    Truck, 
    Package,
    Navigation,
    Phone,
    User
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import '../Styles/dashboard.css';

export default function WaiterSection() {
    const hotelId = localStorage.getItem('hotelId');
    const hotelName = localStorage.getItem('hotelName');
    const waiterName = localStorage.getItem('userName') || 'Waiter';
    const waiterRole = localStorage.getItem('userRole');

    const [readyOrders, setReadyOrders] = useState([]);
    const [outOrders, setOutOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!hotelId) return;

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();

        // Listen for all orders in the kitchen pipeline
        const qKitchen = query(
            collection(db, 'orders'),
            where('hotelId', '==', hotelId),
            where('status', 'in', ['pending', 'passed_to_ttb', 'ready'])
        );

        // Listen for orders currently OUT for delivery
        const qOut = query(
            collection(db, 'orders'),
            where('hotelId', '==', hotelId),
            where('status', '==', 'out_for_delivery')
        );

        const unsubKitchen = onSnapshot(qKitchen, (snap) => {
            setReadyOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });

        const unsubOut = onSnapshot(qOut, (snap) => {
            setOutOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => {
            unsubKitchen();
            unsubOut();
        };
    }, [hotelId]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                status: newStatus,
                [`${newStatus}At`]: new Date().toISOString(),
                assignedWaiter: waiterName
            });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update order status.");
        }
    };

    return (
        <div className="waiter-dashboard">
            <header className="waiter-topbar">
                <div className="waiter-profile">
                    <div className="waiter-avatar">
                        <User size={24} />
                    </div>
                    <div className="waiter-meta">
                        <h1>Welcome, {waiterName}</h1>
                        <p>{waiterRole} • {hotelName}</p>
                    </div>
                </div>
                <div className="live-status">
                    <div className="pulse-dot"></div>
                    Monitoring Live Kitchen Output
                </div>
            </header>

            <div className="waiter-stats-row">
                <div className="mini-stat">
                    <div className="stat-icon ready"><Package size={20} /></div>
                    <div className="stat-val">
                        <strong>{readyOrders.length}</strong>
                        <span>Ready to Collect</span>
                    </div>
                </div>
                <div className="mini-stat">
                    <div className="stat-icon transit"><Truck size={20} /></div>
                    <div className="stat-val">
                        <strong>{outOrders.length}</strong>
                        <span>In Transit</span>
                    </div>
                </div>
                <div className="mini-stat">
                    <div className="stat-icon check"><CheckCircle size={20} /></div>
                    <div className="stat-val">
                        <strong>0</strong>
                        <span>Delivered Today</span>
                    </div>
                </div>
            </div>

            <main className="waiter-content-grid">
                {/* READY FOR COLLECTION */}
                <section className="waiter-section-card">
                    <div className="section-header">
                        <h2>Ready for Pickup (From Kitchen)</h2>
                        <span className="badge-count">{readyOrders.length}</span>
                    </div>
                    
                    <div className="waiter-order-list">
                        {loading ? (
                            <p>Syncing kitchen ready-feed...</p>
                        ) : readyOrders.length === 0 ? (
                            <div className="empty-state-waiter">
                                <Clock size={48} color="#e2e8f0" />
                                <p>Waiting for Chef to mark orders as done...</p>
                            </div>
                        ) : (
                            readyOrders.map(order => (
                                <div key={order.id} className="waiter-order-card">
                                    <div className="order-info-header">
                                        <div className="customer-main">
                                            <h3>{order.customerName || order.userName}</h3>
                                            <span className="bill-ref">#{order.billNumber?.slice(-6)}</span>
                                        </div>
                                        <div className={`method-badge ${order.deliveryMethod}`}>
                                            {order.deliveryMethod === 'dinein' && <ShoppingBag size={14} />}
                                            {order.deliveryMethod === 'camp' && <MapPin size={14} />}
                                            {order.deliveryMethod === 'doorstep' && <Building size={14} />}
                                            {order.deliveryMethod?.toUpperCase()}
                                        </div>
                                    </div>

                                    <div className="order-details-box">
                                        <div className="detail-line">
                                            <Navigation size={14} />
                                            <span>
                                                {order.deliveryMethod === 'dinein' && `Table ${order.deliveryDetails?.tableNumber}`}
                                                {order.deliveryMethod === 'camp' && order.deliveryDetails?.campLocation}
                                                {order.deliveryMethod === 'doorstep' && `${order.deliveryDetails?.blockName}-${order.deliveryDetails?.floorNumber}-${order.deliveryDetails?.roomNumber}`}
                                            </span>
                                        </div>
                                        <div className={`order-global-status ${order.items?.every(i => i.status === 'done') ? 'ready' : 'prepping'}`}>
                                            {order.items?.every(i => i.status === 'done') ? 'ALL ITEMS READY' : 'PREPARING...'}
                                        </div>
                                    </div>

                                    <div className="items-preview customer-style-list">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="waiter-item-row split">
                                                <div className="item-name-qty">
                                                    <span className="qty">x{item.qty}</span>
                                                    <span className="name">{item.name}</span>
                                                </div>
                                                <div className="item-chef-status">
                                                    {item.status === 'done' ? (
                                                        <span className="done-check">✅ DONE</span>
                                                    ) : (
                                                        <span className="wait-check">⏳ CHEF COOKING</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button 
                                        className="collect-btn"
                                        disabled={!order.items?.every(i => i.status === 'done')}
                                        onClick={() => handleUpdateStatus(order.id, 'out_for_delivery')}
                                    >
                                        {order.items?.every(i => i.status === 'done') 
                                            ? 'Dispatch Order' 
                                            : 'Waiting for Kitchen...'}
                                        <Truck size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* CURRENTLY OUT */}
                <section className="waiter-section-card secondary">
                    <div className="section-header">
                        <h2>Currently Out for Delivery</h2>
                        <span className="badge-count out">{outOrders.length}</span>
                    </div>

                    <div className="waiter-order-list scrollable">
                        {outOrders.map(order => (
                            <div key={order.id} className="waiter-order-card mini">
                                <div className="mini-header">
                                    <strong>{order.customerName || order.userName || 'Guest'}</strong>
                                    <span className="time">{order.out_for_deliveryAt ? new Date(order.out_for_deliveryAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}</span>
                                </div>
                                <div className="mini-meta">
                                    {order.deliveryMethod?.toUpperCase()} • {order.deliveryMethod === 'dinein' ? `T-${order.deliveryDetails?.tableNumber || '?'}` : order.deliveryDetails?.campLocation || order.deliveryDetails?.blockName || 'N/A'}
                                </div>
                                <button 
                                    className="delivered-btn"
                                    onClick={() => handleUpdateStatus(order.id, 'delivered')}
                                >
                                    Delivered
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
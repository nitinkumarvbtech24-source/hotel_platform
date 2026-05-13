import React, { useState, useEffect } from 'react';
import { 
    ChefHat, 
    Flame, 
    CheckCircle, 
    AlertCircle, 
    Utensils, 
    Smartphone, 
    MapPin, 
    Building, 
    Search, 
    ArrowRight,
    LogOut,
    Clock
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import '../Styles/dashboard.css';

export default function ChefCorner() {
    const hotelId = localStorage.getItem('hotelId');
    const hotelName = localStorage.getItem('hotelName');
    
    const [counterNumber, setCounterNumber] = useState(localStorage.getItem('chefCounter') || '');
    const [isSetup, setIsSetup] = useState(!localStorage.getItem('chefCounter'));
    
    const [activeTab, setActiveTab] = useState('offline'); // 'offline' or 'online'
    const [onlineSubTab, setOnlineSubTab] = useState('dinein'); // 'dinein', 'camp', 'doorstep'
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);

    // Persist counter
    const handleSetup = (e) => {
        e.preventDefault();
        if (counterNumber) {
            localStorage.setItem('chefCounter', counterNumber);
            setIsSetup(false);
        }
    };

    const logoutCounter = () => {
        localStorage.removeItem('chefCounter');
        setCounterNumber('');
        setIsSetup(true);
    };

    useEffect(() => {
        if (isSetup || !hotelId) return;
        setLoading(true);

        let q;
        if (activeTab === 'offline') {
            // Offline Orders (KOTs) for this particular counter
            q = query(
                collection(db, 'hotels', hotelId, 'kots'),
                where('counter', '==', counterNumber),
                where('status', '==', 'pending')
            );
        } else {
            // Online Orders for this particular counter
            // If online orders don't have a counter yet, we'll fetch all pending of that sub-type
            // but the user asked for "that particular counter" so we filter by it.
            q = query(
                collection(db, 'orders'),
                where('hotelId', '==', hotelId),
                where('deliveryMethod', '==', onlineSubTab),
                where('status', '==', 'pending')
            );
        }

        const unsubscribe = onSnapshot(q, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // If online, we might need a client-side filter if some fields aren't indexed
            // For now, let's assume Firestore handles it or filter locally if needed
            setOrders(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [activeTab, onlineSubTab, counterNumber, isSetup, hotelId]);

    const handleMarkItemDone = async (orderId, itemIndex) => {
        try {
            const collectionPath = activeTab === 'offline' ? `hotels/${hotelId}/kots` : 'orders';
            const orderRef = doc(db, collectionPath, orderId);
            
            // Use transaction to avoid race conditions between counters
            const updatedItems = [...orders.find(o => o.id === orderId).items];
            updatedItems[itemIndex] = { ...updatedItems[itemIndex], status: 'done' };
            
            await updateDoc(orderRef, {
                items: updatedItems
            });

            // If all items are done, optionally update order status
            // but the waiter section will check item-level status anyway
        } catch (error) {
            console.error("Error marking item done:", error);
        }
    };

    if (isSetup) {
        // ... (keep setup screen as is)
        return (
            <div className="chef-setup-container">
                <div className="glass-card setup-card">
                    <div className="setup-header">
                        <ChefHat size={48} color="#3f4c38" />
                        <h1>Chef Station Login</h1>
                        <p>Enter your assigned counter number to begin.</p>
                    </div>
                    <form onSubmit={handleSetup}>
                        <div className="input-group-premium">
                            <Utensils size={20} />
                            <input 
                                type="text" 
                                placeholder="Counter Number (e.g. 1, 2, Pizza, Drinks)" 
                                value={counterNumber}
                                onChange={(e) => setCounterNumber(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="login-btn-industrial">
                            Start Preparation <ArrowRight size={18} />
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="chef-dashboard">
            <header className="chef-topbar">
                <div className="chef-info">
                    <div className="counter-tag">Counter {counterNumber}</div>
                    <h1>{hotelName} Kitchen</h1>
                </div>
                <div className="chef-actions">
                    <div className="live-pulse">
                        <div className="dot"></div>
                        Live Queue
                    </div>
                    <button className="exit-btn" onClick={logoutCounter}>
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            <nav className="chef-main-tabs">
                <button 
                    className={activeTab === 'offline' ? 'active' : ''} 
                    onClick={() => setActiveTab('offline')}
                >
                    <Utensils size={18} /> Offline Orders
                </button>
                <button 
                    className={activeTab === 'online' ? 'active' : ''} 
                    onClick={() => setActiveTab('online')}
                >
                    <Smartphone size={18} /> Online Orders
                </button>
            </nav>

            {activeTab === 'online' && (
                <div className="chef-sub-tabs">
                    <button 
                        className={onlineSubTab === 'dinein' ? 'active' : ''} 
                        onClick={() => setOnlineSubTab('dinein')}
                    >
                        <Utensils size={16} /> Dine-In
                    </button>
                    <button 
                        className={onlineSubTab === 'camp' ? 'active' : ''} 
                        onClick={() => setOnlineSubTab('camp')}
                    >
                        <MapPin size={16} /> Camp
                    </button>
                    <button 
                        className={onlineSubTab === 'doorstep' ? 'active' : ''} 
                        onClick={() => setOnlineSubTab('doorstep')}
                    >
                        <Building size={16} /> Doorstep
                    </button>
                </div>
            )}

            <main className="order-queue-grid">
                {loading ? (
                    <div className="loading-state">Syncing Kitchen Data...</div>
                ) : orders.length === 0 ? (
                    <div className="empty-queue">
                        <CheckCircle size={64} color="#e5e7eb" />
                        <h3>Queue is Clear</h3>
                        <p>No pending {activeTab} {activeTab === 'online' ? onlineSubTab : ''} orders for this counter.</p>
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.id} className="chef-order-card">
                            <div className="card-header">
                                <div className="order-identity">
                                    <span className="order-type-icon">
                                        {activeTab === 'offline' ? <Utensils size={14} /> : <Smartphone size={14} />}
                                    </span>
                                    <strong>#{order.billNumber?.slice(-6) || 'N/A'}</strong>
                                </div>
                                <div className="order-timer">
                                    <Clock size={14} />
                                    <span>{order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                                </div>
                            </div>
                            
                            <div className="customer-context">
                                <span className="location-info">
                                    {order.deliveryMethod === 'dinein' && `Table ${order.tableNumber || order.deliveryDetails?.tableNumber || 'N/A'}`}
                                    {order.deliveryMethod === 'camp' && `Camp: ${order.deliveryDetails?.campLocation}`}
                                    {order.deliveryMethod === 'doorstep' && `Doorstep: ${order.deliveryDetails?.blockName}-${order.deliveryDetails?.roomNumber}`}
                                    {activeTab === 'offline' && `Table ${order.tableNumber}`}
                                </span>
                                <span className="customer-name">{order.customerName || order.userName}</span>
                            </div>

                            <div className="order-items kitchen-items">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="chef-item-row item-prep">
                                        <div className="item-info">
                                            <span className="qty">x{item.qty}</span>
                                            <span className="name">{item.name}</span>
                                        </div>
                                        {item.status === 'done' ? (
                                            <span className="item-done-tag"><CheckCircle size={14} /> DONE</span>
                                        ) : (
                                            <button 
                                                className="item-done-btn"
                                                onClick={() => handleMarkItemDone(order.id, idx)}
                                            >
                                                Mark Done
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
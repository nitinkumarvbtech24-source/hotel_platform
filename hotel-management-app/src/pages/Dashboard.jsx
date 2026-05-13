import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    ShoppingBag,
    DollarSign,
    Clock,
    Users,
    Smartphone,
    MapPin,
    Building,
    CheckCircle2,
    AlertCircle,
    Activity,
    ArrowRight,
    Utensils
} from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import '../Styles/dashboard.css';

export default function Dashboard() {
    const role = localStorage.getItem('userRole');
    const hotelId = localStorage.getItem('hotelId');
    const hotelName = localStorage.getItem('hotelName');
    const [loading, setLoading] = useState(true);

    // Stats State
    const [todayBills, setTodayBills] = useState([]);
    const [liveOrders, setLiveOrders] = useState([]);
    const [staff, setStaff] = useState([]);

    useEffect(() => {
        if (!hotelId) return;

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();

        // 1. Fetch Today's Bills (Online and Offline)
        const billsQuery = query(
            collection(db, 'hotels', hotelId, 'bills'),
            where('createdAt', '>=', startOfDay)
        );

        const unsubBills = onSnapshot(billsQuery, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setTodayBills(data);
        });

        // 2. Fetch Live Online Orders (Pipeline)
        const ordersQuery = query(
            collection(db, 'orders'),
            where('hotelId', '==', hotelId)
        );

        const unsubOrders = onSnapshot(ordersQuery, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLiveOrders(data);
        });

        // 3. Fetch Staff
        const staffQuery = collection(db, 'hotels', hotelId, 'staff');
        const unsubStaff = onSnapshot(staffQuery, (snap) => {
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStaff(data);
            setLoading(false);
        });

        return () => {
            unsubBills();
            unsubOrders();
            unsubStaff();
        };
    }, [hotelId]);

    // Analytics Calculations
    const stats = useMemo(() => {
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }).replace(/\//g, '');

        // Filter Completed Bills
        const offlineBills = todayBills.filter(b => b.type !== 'online');
        const onlineBills = todayBills.filter(b => b.type === 'online');

        // Filter Today's Live Orders (to avoid counting old pending orders)
        const todayLiveOrders = liveOrders.filter(o => o.billDate === todayStr);

        // Revenue Calculations
        const offlineRevenue = offlineBills.reduce((sum, b) => sum + (b.total || 0), 0);
        const settledOnlineRevenue = onlineBills.reduce((sum, b) => sum + (b.total || 0), 0);
        const pendingOnlineRevenue = todayLiveOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        // Breakdown (Live Orders only as per requirement)
        const onlineDineIn = todayLiveOrders.filter(o => o.deliveryMethod === 'dinein').length;
        const onlineCamp = todayLiveOrders.filter(o => o.deliveryMethod === 'camp').length;
        const onlineDoorstep = todayLiveOrders.filter(o => o.deliveryMethod === 'doorstep').length;

        const ttbPassed = liveOrders.filter(o => o.status === 'passed_to_ttb');
        const ttbPending = liveOrders.filter(o => o.status === 'pending');

        return {
            offlineCount: offlineBills.length,
            offlineRevenue,
            // Total Online = Settled Bills + Today's Live Orders
            onlineCount: onlineBills.length + todayLiveOrders.length,
            onlineRevenue: settledOnlineRevenue + pendingOnlineRevenue,
            onlineDineIn,
            onlineCamp,
            onlineDoorstep,
            ttbPassed,
            ttbPending
        };
    }, [todayBills, liveOrders]);

    // Revenue Graph Data (Simple hourly aggregation)
    const graphData = useMemo(() => {
        const hours = Array.from({ length: 12 }, (_, i) => i * 2); // 0, 2, 4... 22
        return hours.map(h => {
            const hourRevenue = todayBills
                .filter(b => {
                    const date = new Date(b.createdAt);
                    return date.getHours() >= h && date.getHours() < h + 2;
                })
                .reduce((sum, b) => sum + (b.total || 0), 0);
            return hourRevenue;
        });
    }, [todayBills]);

    const maxRevenue = Math.max(...graphData, 1000);

    if (loading) return <div className="dashboard-loading">Initializing Command Center...</div>;

    return (
        <div className="dashboard-wrapper">
            <header className="dashboard-topbar">
                <div className="welcome-text">
                    <h1>Command Center</h1>
                    <p>{hotelName} • Live Performance Dashboard</p>
                </div>
                <div className="status-indicator">
                    <Activity size={16} className="pulse-icon" />
                    <span>System Live</span>
                    <div className="role-chip">{role}</div>
                </div>
            </header>

            {/* TOP STATS - OFFLINE vs ONLINE */}
            <div className="main-stats-grid">
                <div className="stat-card primary">
                    <div className="stat-header">
                        <ShoppingBag size={20} />
                        <span>Offline Sales</span>
                    </div>
                    <div className="stat-main">
                        <div className="value">{stats.offlineCount}</div>
                        <div className="label">Orders</div>
                    </div>
                    <div className="stat-footer">
                        <DollarSign size={16} />
                        <span>₹{stats.offlineRevenue.toLocaleString()}</span>
                    </div>
                </div>

                <div className="stat-card primary online">
                    <div className="stat-header">
                        <Smartphone size={20} />
                        <span>Online Sales</span>
                    </div>
                    <div className="stat-main">
                        <div className="value">{stats.onlineCount}</div>
                        <div className="label">Orders</div>
                    </div>
                    <div className="stat-footer">
                        <DollarSign size={16} />
                        <span>₹{stats.onlineRevenue.toLocaleString()}</span>
                    </div>
                </div>

                <div className="stat-card primary total">
                    <div className="stat-header">
                        <TrendingUp size={20} />
                        <span>Total Revenue</span>
                    </div>
                    <div className="stat-main">
                        <div className="value">₹{(stats.offlineRevenue + stats.onlineRevenue).toLocaleString()}</div>
                        <div className="label">Today</div>
                    </div>
                    <div className="stat-footer">
                        <CheckCircle2 size={16} />
                        <span>{stats.offlineCount + stats.onlineCount} Combined</span>
                    </div>
                </div>

                <div className="stat-card primary efficiency">
                    <div className="stat-header">
                        <Clock size={20} />
                        <span>Avg Prep Time</span>
                    </div>
                    <div className="stat-main">
                        <div className="value">12m</div>
                        <div className="label">Minutes</div>
                    </div>
                    <div className="stat-footer">
                        <TrendingUp size={16} />
                        <span>Optimized</span>
                    </div>
                </div>
            </div>

            {/* ONLINE BREAKDOWN */}
            <div className="breakdown-grid">
                <div className="mini-stat-card">
                    <Utensils size={18} />
                    <div className="mini-info">
                        <strong>{stats.onlineDineIn}</strong>
                        <span>Online Dine-In</span>
                    </div>
                </div>
                <div className="mini-stat-card">
                    <MapPin size={18} />
                    <div className="mini-info">
                        <strong>{stats.onlineCamp}</strong>
                        <span>Camp Deliveries</span>
                    </div>
                </div>
                <div className="mini-stat-card">
                    <Building size={18} />
                    <div className="mini-info">
                        <strong>{stats.onlineDoorstep}</strong>
                        <span>Doorstep Deliveries</span>
                    </div>
                </div>
            </div>

            {/* INSIGHTS SECTION */}
            <div className="insights-row">
                {/* REVENUE GRAPH */}
                <section className="insight-card graph-section">
                    <div className="card-header">
                        <h2>Revenue Distribution</h2>
                        <span>Time Based (Today)</span>
                    </div>
                    <div className="graph-container">
                        <div className="svg-graph">
                            {graphData.map((val, i) => {
                                const height = (val / maxRevenue) * 100;
                                return (
                                    <div key={i} className="bar-wrapper">
                                        <div 
                                            className="bar" 
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                            title={`₹${val}`}
                                        >
                                            <div className="bar-tooltip">₹{val}</div>
                                        </div>
                                        <span className="bar-label">{i * 2}h</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* TTB PIPELINE */}
                <section className="insight-card pipeline-section">
                    <div className="card-header">
                        <h2>Order Pipeline</h2>
                        <span className="live-tag">LIVE</span>
                    </div>
                    <div className="pipeline-stats">
                        <div className="pipe-item pending">
                            <AlertCircle size={18} />
                            <div className="pipe-info">
                                <strong>{stats.ttbPending.length}</strong>
                                <span>Waiting on TTB</span>
                            </div>
                        </div>
                        <div className="pipe-item passed">
                            <CheckCircle2 size={18} />
                            <div className="pipe-info">
                                <strong>{stats.ttbPassed.length}</strong>
                                <span>TTB Passed (Finance)</span>
                            </div>
                        </div>
                    </div>
                    <div className="pipeline-details">
                        {stats.ttbPending.slice(0, 3).map(o => (
                            <div key={o.id} className="mini-order-row">
                                <span>#{o.billNumber?.slice(-6)}</span>
                                <span>{o.customerName}</span>
                                <span className="price">₹{o.total}</span>
                                <ArrowRight size={14} />
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* STAFF MONITORING */}
            <section className="staff-monitor-section">
                <div className="card-header">
                    <h2>Live Staff Monitoring</h2>
                    <div className="staff-count">
                        <Users size={16} />
                        <span>{staff.length} Active</span>
                    </div>
                </div>
                <div className="staff-grid">
                    {staff.map(s => (
                        <div key={s.id} className="staff-monitor-card">
                            <div className="staff-avatar">
                                {s.name.charAt(0)}
                            </div>
                            <div className="staff-details">
                                <strong>{s.name}</strong>
                                <span>{s.role}</span>
                            </div>
                            <div className="staff-status active">
                                <div className="status-dot"></div>
                                Online
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

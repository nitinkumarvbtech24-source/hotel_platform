import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    History,
    Settings,
    LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function CustomerSidebar({
    activePage,
    user
}) {
    const navigate = useNavigate();
    const { cartCount } = useCart();
    
    const [profile, setProfile] = useState(user || null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (auth.currentUser) {
                const docRef = doc(db, 'users', auth.currentUser.uid);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    setProfile(snap.data());
                } else if (auth.currentUser.displayName) {
                    setProfile({ name: auth.currentUser.displayName, email: auth.currentUser.email });
                }
            }
        };
        fetchProfile();
    }, [auth.currentUser]);

    const navItems = [
        {
            label: 'Dashboard',
            icon: <LayoutDashboard size={20} />,
            path: '/dashboard'
        },
        {
            label: 'My Cart',
            icon: <ShoppingCart size={20} />,
            path: '/cart'
        },
        {
            label: 'Orders',
            icon: <Package size={20} />,
            path: '/orders'
        },
        {
            label: 'History',
            icon: <History size={20} />,
            path: '/history'
        },
        {
            label: 'Settings',
            icon: <Settings size={20} />,
            path: '/settings'
        }
    ];

    const logout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <aside className="customer-sidebar">
            <div className="sidebar-brand">
                <h2>Chillax</h2>
                <p>Customer Portal</p>
            </div>

            <div className="sidebar-user">
                <div className="user-avatar">
                    {profile?.name?.[0] || auth.currentUser?.email?.[0]?.toUpperCase() || 'U'}
                </div>

                <div>
                    <h4>{profile?.name || 'Customer'}</h4>
                    <p>{profile?.email || auth.currentUser?.email}</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <button
                        key={item.label}
                        className={`sidebar-nav-btn ${activePage === item.label
                            ? 'active'
                            : ''
                            }`}
                        onClick={() =>
                            navigate(item.path)
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                        {item.label === 'My Cart' && cartCount > 0 && (
                            <span className="cart-badge">{cartCount}</span>
                        )}
                    </button>
                ))}
            </nav>

            <button
                className="sidebar-logout-btn"
                onClick={logout}
            >
                <LogOut size={18} />
                Logout
            </button>
        </aside>
    );
}
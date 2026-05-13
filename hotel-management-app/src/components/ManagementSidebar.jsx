import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    UtensilsCrossed,
    Receipt,
    Users,
    ChefHat,
    ShoppingCart,
    CreditCard,
    Settings,
    LogOut
} from 'lucide-react';
import '../Styles/dashboard.css';

export default function ManagementSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const role = localStorage.getItem('userRole');
    const hotelName = localStorage.getItem('hotelName') || 'Management Platform';

    const menuItems = [
        {
            label: 'Dashboard',
            path: '/dashboard',
            icon: <LayoutDashboard size={20} />,
            roles: ['owner', 'manager']
        },
        {
            label: 'Menu Management',
            path: '/menu-management',
            icon: <UtensilsCrossed size={20} />,
            roles: ['owner', 'manager']
        },
        {
            label: 'Bills',
            path: '/bills',
            icon: <Receipt size={20} />,
            roles: ['owner', 'manager']
        },
        {
            label: 'Waiter Section',
            path: '/waiter-section',
            icon: <Users size={20} />,
            roles: ['owner', 'manager', 'waiter']
        },
        {
            label: 'Chef Corner',
            path: '/chef-corner',
            icon: <ChefHat size={20} />,
            roles: ['owner', 'manager', 'chef']
        },
        {
            label: 'Online Orders',
            path: '/online-orders',
            icon: <ShoppingCart size={20} />,
            roles: ['owner', 'manager', 'waiter', 'chef']
        },
        {
            label: 'TTB Bills',
            path: '/ttb-bills',
            icon: <CreditCard size={20} />,
            roles: ['owner', 'manager', 'waiter']
        },
        {
            label: 'Settings',
            path: '/settings',
            icon: <Settings size={20} />,
            roles: ['owner', 'manager']
        }
    ];

    const logout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.clear();
            navigate('/role-select');
        }
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <h2>Chillax</h2>
                    <p>{hotelName}</p>
                </div>

                <nav className="sidebar-menu">
                    {menuItems
                        .filter(item => item.roles.includes(role))
                        .map(item => (
                            <button
                                key={item.label}
                                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                </nav>

                <div className="logout-btn-wrap">
                    <button className="logout-btn" onClick={logout}>
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-bottom-nav">
                {menuItems
                    .filter(item => item.roles.includes(role))
                    .map(item => (
                        <button
                            key={item.label}
                            className={`mobile-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            {item.icon}
                            <span>{item.label.split(' ')[0]}</span> {/* Show only first word on mobile */}
                        </button>
                    ))}
                <button className="mobile-nav-item logout" onClick={logout}>
                    <LogOut size={20} />
                    <span>Exit</span>
                </button>
            </nav>
        </>
    );
}

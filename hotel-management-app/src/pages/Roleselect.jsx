import { useNavigate } from 'react-router-dom';
import {
    Crown,
    Briefcase,
    UtensilsCrossed,
    ChefHat,
    ArrowRight
} from 'lucide-react';
import '../Styles/auth.css';

export default function RoleSelect() {
    const navigate = useNavigate();

    const roles = [
        { 
            key: 'owner', 
            label: 'Owner', 
            desc: 'Manage your entire property, analytics, and staff settings.',
            icon: <Crown size={32} /> 
        },
        { 
            key: 'manager', 
            label: 'Manager', 
            desc: 'Oversee daily operations, inventory and guest sessions.',
            icon: <Briefcase size={32} /> 
        },
        { 
            key: 'waiter', 
            label: 'Waiter', 
            desc: 'Handle guest orders, table status, and digital billing.',
            icon: <UtensilsCrossed size={32} /> 
        },
        { 
            key: 'chef', 
            label: 'Chef', 
            desc: 'Manage kitchen queue, order prep, and menu availability.',
            icon: <ChefHat size={32} /> 
        }
    ];

    const selectRole = (role) => {
        localStorage.setItem('role', role);
        navigate('/hotel-select');
    };

    return (
        <div className="auth-shell">
            {/* Animated Background Blobs */}
            <div className="bg-blob blob-1"></div>
            <div className="bg-blob blob-2"></div>
            <div className="bg-blob blob-3"></div>

            <div className="auth-container-premium">
                <div className="auth-header">
                    <h1 style={{ color: 'white' }}>Select Your Role</h1>
                    <p style={{ color: 'rgba(255,255,255,0.7)' }}>Choose your workstation to access the Chillax Hotel Management OS</p>
                </div>

                <div className="role-grid-vibrant">
                    {roles.map((role) => (
                        <div
                            key={role.key}
                            className="role-card-vibrant"
                            onClick={() => selectRole(role.key)}
                        >
                            <div className="icon-box">{role.icon}</div>
                            <h3>{role.label}</h3>
                            <p>{role.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
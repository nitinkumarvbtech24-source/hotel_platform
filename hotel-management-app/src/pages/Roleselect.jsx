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
            <div className="role-select-wrapper">
                <div className="auth-header">
                    <h1>Select Your Role</h1>
                    <p>Identify your position to access the Chillax Hotel Management OS</p>
                </div>

                <div className="role-grid-modern">
                    {roles.map((role) => (
                        <div
                            key={role.key}
                            className="role-card-modern"
                            onClick={() => selectRole(role.key)}
                        >
                            <div className="icon-box">{role.icon}</div>
                            <h3>{role.label}</h3>
                            <p>{role.desc}</p>
                            <div className="card-footer-action" style={{ marginTop: '20px', color: '#3f4c38', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 700, fontSize: '0.8rem' }}>
                                Continue <ArrowRight size={14} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
import { useNavigate } from 'react-router-dom';
import {
    Crown,
    Briefcase,
    UtensilsCrossed,
    ChefHat
} from 'lucide-react';

export default function RoleSelect() {
    const navigate = useNavigate();

    const roles = [
        { key: 'owner', label: 'Owner', icon: <Crown size={28} /> },
        { key: 'manager', label: 'Manager', icon: <Briefcase size={28} /> },
        { key: 'waiter', label: 'Waiter', icon: <UtensilsCrossed size={28} /> },
        { key: 'chef', label: 'Chef', icon: <ChefHat size={28} /> }
    ];

    const selectRole = (role) => {
        localStorage.setItem('role', role);
        navigate('/hotel-select');
    };

    return (
        <div className="login-shell">
            <div className="role-container">
                <div className="role-header">
                    <h1>Select Your Role</h1>
                    <p>Choose how you want to access Chillax Hotel OS</p>
                </div>

                <div className="role-grid">
                    {roles.map((role) => (
                        <div
                            key={role.key}
                            className="role-card"
                            onClick={() => selectRole(role.key)}
                        >
                            <div className="role-icon">{role.icon}</div>
                            <h3>{role.label}</h3>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
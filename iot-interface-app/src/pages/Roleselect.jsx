import { ShieldCheck, UserCog, ArrowLeft } from 'lucide-react';

export default function Roleselect({ hotel, onSelect, onBack }) {
    return (
        <div className="iot-auth-shell">
            <div className="auth-container">
                <button className="back-btn-iot" onClick={onBack}>
                    <ArrowLeft size={18} /> Back to Properties
                </button>

                <div className="auth-header" style={{ marginTop: '20px' }}>
                    <div className="selected-property-pill">
                        {hotel.hotelName}
                    </div>
                    <h1>Select Authorization</h1>
                    <p>Identify your access level for this terminal.</p>
                </div>

                <div className="role-grid-iot">
                    <div className="role-card-iot" onClick={() => onSelect('owner')}>
                        <div className="role-icon owner">
                            <ShieldCheck size={40} />
                        </div>
                        <div className="role-info">
                            <h2>OWNER</h2>
                            <p>Full administrative access to TTB logs and hardware settings.</p>
                        </div>
                    </div>

                    <div className="role-card-iot" onClick={() => onSelect('manager')}>
                        <div className="role-icon manager">
                            <UserCog size={40} />
                        </div>
                        <div className="role-info">
                            <h2>MANAGER</h2>
                            <p>Standard operational access for card scanning and registration.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

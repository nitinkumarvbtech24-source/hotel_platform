import { useState, useEffect } from 'react';
import { 
    Settings as SettingsIcon, 
    User, 
    Users, 
    Clock, 
    Percent, 
    History, 
    Plus, 
    Trash2, 
    Edit2,
    MapPin,
    Building,
    Layers,
    BookOpen
} from 'lucide-react';
import { 
    collection, 
    addDoc, 
    getDocs, 
    deleteDoc, 
    doc,
    setDoc,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import '../Styles/dashboard.css';
import '../Styles/settings.css';
import BillLogs from '../components/BillLogs';

export default function Settings() {
    const hotelId = localStorage.getItem('hotelId');
    const [activeTab, setActiveTab] = useState('account');

    // Data States
    const [staff, setStaff] = useState([]);
    const [slots, setSlots] = useState([]);
    const [camps, setCamps] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [floors, setFloors] = useState([]);
    const [classrooms, setClassrooms] = useState([]);

    const [categories, setCategories] = useState([]);
    const [taxGroups, setTaxGroups] = useState([]);
    const [deliverySettings, setDeliverySettings] = useState({
        camp: { charge: 0, type: 'rupees' },
        doorstep: { charge: 0, type: 'rupees' }
    });

    useEffect(() => {
        fetchAllData();
    }, [activeTab]);

    const fetchAllData = async () => {
        if (!hotelId) return;
        
        if (activeTab === 'staff') {
            const snap = await getDocs(collection(db, 'hotels', hotelId, 'staff'));
            setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else if (activeTab === 'slots') {
            const slotSnap = await getDocs(collection(db, 'hotels', hotelId, 'slots'));
            setSlots(slotSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            
            const campSnap = await getDocs(collection(db, 'hotels', hotelId, 'camps'));
            setCamps(campSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            const bSnap = await getDocs(collection(db, 'hotels', hotelId, 'blocks'));
            setBlocks(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            const fSnap = await getDocs(collection(db, 'hotels', hotelId, 'floors'));
            setFloors(fSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            const cSnap = await getDocs(collection(db, 'hotels', hotelId, 'classrooms'));
            setClassrooms(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else if (activeTab === 'taxes') {
            const catSnap = await getDocs(collection(db, 'hotels', hotelId, 'categories'));
            setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            const taxSnap = await getDocs(collection(db, 'hotels', hotelId, 'taxGroups'));
            setTaxGroups(taxSnap.docs.map(d => ({ id: d.id, ...d.data() })));

            const deliveryDoc = await getDoc(doc(db, 'hotels', hotelId, 'settings', 'delivery'));
            if (deliveryDoc.exists()) {
                setDeliverySettings(deliveryDoc.data());
            }
        }
    };

    return (
        <div className="settings-container">
            <header className="menu-hero-header">
                <div className="hero-shimmer"></div>
                <div className="hero-content">
                    <div className="hero-left">
                        <h1>Control Center</h1>
                        <p>Configure staff, slots, and operational preferences</p>
                    </div>
                </div>

                <div className="settings-nav">
                    {[
                        { id: 'account', label: 'Account', icon: <User size={18}/> },
                        { id: 'staff', label: 'Staff', icon: <Users size={18}/> },
                        { id: 'slots', label: 'Time/Slots', icon: <Clock size={18}/> },
                        { id: 'taxes', label: 'Taxes', icon: <Percent size={18}/> },
                        { id: 'logs', label: 'Bill Logs', icon: <History size={18}/> },
                    ].map(tab => (
                        <button 
                            key={tab.id}
                            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="settings-content-area">
                {activeTab === 'account' && <AccountSettings />}
                {activeTab === 'staff' && <StaffManagement staff={staff} hotelId={hotelId} onRefresh={fetchAllData} />}
                {activeTab === 'slots' && <SlotManagement slots={slots} camps={camps} blocks={blocks} floors={floors} classrooms={classrooms} hotelId={hotelId} onRefresh={fetchAllData} />}
                {activeTab === 'taxes' && <TaxManagement categories={categories} taxGroups={taxGroups} deliverySettings={deliverySettings} hotelId={hotelId} onRefresh={fetchAllData} />}
                {activeTab === 'logs' && <BillLogs hotelId={hotelId} slots={slots} />}
            </div>
        </div>
    );
}

function AccountSettings() {
    return (
        <div className="glass-card">
            <h2>Basic Account Settings</h2>
            <div className="form-grid">
                <div className="input-group">
                    <label>Hotel Name</label>
                    <input defaultValue={localStorage.getItem('hotelName')} disabled />
                </div>
                <div className="input-group">
                    <label>Owner Mobile</label>
                    <input defaultValue={localStorage.getItem('ownerMobile')} disabled />
                </div>
                <div className="input-group">
                    <label>Admin Email</label>
                    <input defaultValue={localStorage.getItem('ownerEmail')} disabled />
                </div>
            </div>
        </div>
    );
}

function StaffManagement({ staff, hotelId, onRefresh }) {
    const [newStaff, setNewStaff] = useState({ name: '', role: 'Waiter', mobile: '', email: '', password: '' });

    const handleAdd = async () => {
        if (!newStaff.email || !newStaff.password) return;
        await addDoc(collection(db, 'hotels', hotelId, 'staff'), newStaff);
        setNewStaff({ name: '', role: 'Waiter', mobile: '', email: '', password: '' });
        onRefresh();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this staff member?')) {
            await deleteDoc(doc(db, 'hotels', hotelId, 'staff', id));
            onRefresh();
        }
    };

    return (
        <div className="staff-section">
            <div className="glass-card add-staff-form">
                <h2>Enroll New Staff</h2>
                <div className="form-row-multi">
                    <div className="input-block">
                        <label>Staff Role</label>
                        <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})}>
                            <option>Manager</option>
                            <option>Waiter</option>
                            <option>KitchenStaff</option>
                        </select>
                    </div>
                    <div className="input-block">
                        <label>Full Name</label>
                        <input placeholder="Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
                    </div>
                    <div className="input-block">
                        <label>Mobile Number</label>
                        <input placeholder="Mobile" value={newStaff.mobile} onChange={e => setNewStaff({...newStaff, mobile: e.target.value})} />
                    </div>
                    <div className="input-block">
                        <label>Email ID</label>
                        <input placeholder="Email ID" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} />
                    </div>
                    <div className="input-block">
                        <label>Login Password</label>
                        <input placeholder="Password" type="password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
                    </div>
                    <button className="add-btn-primary" onClick={handleAdd}><Plus size={18}/> Enroll Staff</button>
                </div>
            </div>

            <div className="staff-grid">
                {['Manager', 'Waiter', 'KitchenStaff'].map(role => (
                    <div key={role} className="role-group-card">
                        <div className="role-header">
                            <Users size={16}/>
                            <h3>{role}s</h3>
                        </div>
                        <div className="staff-list">
                            {staff.filter(s => s.role === role).map(s => (
                                <div key={s.id} className="staff-item">
                                    <div className="staff-info">
                                        <strong>{s.name}</strong>
                                        <span>{s.email}</span>
                                        <small>{s.mobile}</small>
                                    </div>
                                    <button className="delete-mini-btn" onClick={() => handleDelete(s.id)}><Trash2 size={16}/></button>
                                </div>
                            ))}
                            {staff.filter(s => s.role === role).length === 0 && <p className="empty-msg">No {role}s enrolled</p>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TaxManagement({ categories, taxGroups, deliverySettings: initialDeliverySettings, hotelId, onRefresh }) {
    const [subTab, setSubTab] = useState('categories'); // 'categories' or 'delivery'
    const [newGroupName, setNewGroupName] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [taxPercent, setTaxPercent] = useState('');
    const [deliverySettings, setDeliverySettings] = useState(initialDeliverySettings);

    useEffect(() => {
        setDeliverySettings(initialDeliverySettings);
    }, [initialDeliverySettings]);

    const handleAddTaxGroup = async () => {
        if (!newGroupName || selectedCategories.length === 0 || !taxPercent) {
            alert('Please fill all fields and select at least one category');
            return;
        }

        await addDoc(collection(db, 'hotels', hotelId, 'taxGroups'), {
            name: newGroupName,
            categories: selectedCategories,
            taxPercent: parseFloat(taxPercent)
        });

        setNewGroupName('');
        setSelectedCategories([]);
        setTaxPercent('');
        onRefresh();
    };

    const handleDeleteGroup = async (id) => {
        if (window.confirm('Delete this tax group?')) {
            await deleteDoc(doc(db, 'hotels', hotelId, 'taxGroups', id));
            onRefresh();
        }
    };

    const handleUpdateDelivery = async (updatedSettings) => {
        await setDoc(doc(db, 'hotels', hotelId, 'settings', 'delivery'), updatedSettings);
        onRefresh();
    };

    const toggleCategorySelection = (catName) => {
        setSelectedCategories(prev => 
            prev.includes(catName) 
                ? prev.filter(c => c !== catName) 
                : [...prev, catName]
        );
    };

    return (
        <div className="tax-management-wrapper">
            <div className="tax-sub-nav">
                <button 
                    className={`sub-nav-btn ${subTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setSubTab('categories')}
                >
                    Category Taxes
                </button>
                <button 
                    className={`sub-nav-btn ${subTab === 'delivery' ? 'active' : ''}`}
                    onClick={() => setSubTab('delivery')}
                >
                    Delivery Taxes
                </button>
            </div>

            {subTab === 'categories' && (
                <div className="tax-content-grid">
                    <div className="glass-card tax-group-form">
                        <h2>Create Tax Group</h2>
                        <div className="input-block">
                            <label>Group Name</label>
                            <input 
                                placeholder="e.g. Standard GST" 
                                value={newGroupName} 
                                onChange={e => setNewGroupName(e.target.value)} 
                            />
                        </div>

                        <div className="category-selection-box">
                            <label>Select Categories (sharing these taxes)</label>
                            <div className="category-chips-grid">
                                {categories.map(cat => (
                                    <div 
                                        key={cat.id} 
                                        className={`cat-chip ${selectedCategories.includes(cat.name) ? 'selected' : ''}`}
                                        onClick={() => toggleCategorySelection(cat.name)}
                                    >
                                        <span className="cat-name">{cat.name}</span>
                                        <span className="counter-num">#{cat.counterNumber || '0'}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="input-block">
                            <label>Tax Percentage (%)</label>
                            <input 
                                type="number" 
                                placeholder="e.g. 5" 
                                value={taxPercent} 
                                onChange={e => setTaxPercent(e.target.value)} 
                            />
                        </div>

                        <button className="add-btn-primary" onClick={handleAddTaxGroup}>
                            <Plus size={18}/> Add Tax Group
                        </button>
                    </div>

                    <div className="tax-groups-list">
                        {taxGroups.map(group => (
                            <div key={group.id} className="glass-card group-item-card">
                                <div className="group-header" style={{alignItems: 'flex-start'}}>
                                    <div className="group-title-info">
                                        <h3 style={{marginBottom: '4px'}}>{group.name}</h3>
                                        <p style={{fontSize: '0.85rem', color: '#64748b', margin: 0}}>
                                            Tax configured at <strong>{group.taxPercent}%</strong> for the following categories:
                                        </p>
                                    </div>
                                    <span className="tax-badge">{group.taxPercent}%</span>
                                </div>
                                <div className="group-categories">
                                    {group.categories.map(c => <span key={c} className="cat-tag">{c}</span>)}
                                </div>
                                <button className="delete-mini-btn" onClick={() => handleDeleteGroup(group.id)}>
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {subTab === 'delivery' && (
                <div className="delivery-tax-grid">
                    <div className="glass-card delivery-section-card">
                        <div className="section-header">
                            <MapPin size={20}/>
                            <h2>Camp Delivery</h2>
                        </div>
                        <div className="delivery-config-col">
                            <div className="input-block">
                                <label>Charges</label>
                                <input 
                                    type="number" 
                                    value={deliverySettings.camp.charge} 
                                    onChange={e => setDeliverySettings({
                                        ...deliverySettings,
                                        camp: { ...deliverySettings.camp, charge: parseFloat(e.target.value) || 0 }
                                    })} 
                                />
                            </div>
                            <div className="toggle-group">
                                <label>Type</label>
                                <div className="pill-toggle">
                                    <button 
                                        className={deliverySettings.camp.type === 'rupees' ? 'active' : ''}
                                        onClick={() => setDeliverySettings({
                                            ...deliverySettings,
                                            camp: { ...deliverySettings.camp, type: 'rupees' }
                                        })}
                                    >
                                        ₹
                                    </button>
                                    <button 
                                        className={deliverySettings.camp.type === 'percent' ? 'active' : ''}
                                        onClick={() => setDeliverySettings({
                                            ...deliverySettings,
                                            camp: { ...deliverySettings.camp, type: 'percent' }
                                        })}
                                    >
                                        %
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button className="add-btn-primary" style={{marginTop: '16px', width: 'fit-content'}} onClick={() => handleUpdateDelivery(deliverySettings)}>Save Camp Taxes</button>
                        <div className="info-box" style={{marginTop: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#64748b'}}>
                            The delivery charge for Camp is set to <strong>{deliverySettings.camp.charge} {deliverySettings.camp.type === 'percent' ? '%' : 'Rupees'}</strong>. It will be added automatically to bills for online Camp Delivery customers.
                        </div>
                    </div>

                    <div className="glass-card delivery-section-card">
                        <div className="section-header">
                            <Building size={20}/>
                            <h2>Doorstep Delivery</h2>
                        </div>
                        <div className="delivery-config-col">
                            <div className="input-block">
                                <label>Charges</label>
                                <input 
                                    type="number" 
                                    value={deliverySettings.doorstep.charge} 
                                    onChange={e => setDeliverySettings({
                                        ...deliverySettings,
                                        doorstep: { ...deliverySettings.doorstep, charge: parseFloat(e.target.value) || 0 }
                                    })} 
                                />
                            </div>
                            <div className="toggle-group">
                                <label>Type</label>
                                <div className="pill-toggle">
                                    <button 
                                        className={deliverySettings.doorstep.type === 'rupees' ? 'active' : ''}
                                        onClick={() => setDeliverySettings({
                                            ...deliverySettings,
                                            doorstep: { ...deliverySettings.doorstep, type: 'rupees' }
                                        })}
                                    >
                                        ₹
                                    </button>
                                    <button 
                                        className={deliverySettings.doorstep.type === 'percent' ? 'active' : ''}
                                        onClick={() => setDeliverySettings({
                                            ...deliverySettings,
                                            doorstep: { ...deliverySettings.doorstep, type: 'percent' }
                                        })}
                                    >
                                        %
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button className="add-btn-primary" style={{marginTop: '16px', width: 'fit-content'}} onClick={() => handleUpdateDelivery(deliverySettings)}>Save Doorstep Taxes</button>
                        <div className="info-box" style={{marginTop: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: '#64748b'}}>
                            The delivery charge for Doorstep is set to <strong>{deliverySettings.doorstep.charge} {deliverySettings.doorstep.type === 'percent' ? '%' : 'Rupees'}</strong>. It will be added automatically to bills for online Doorstep Delivery customers.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SlotManagement({ slots, camps, blocks, floors, classrooms, hotelId, onRefresh }) {
    const [newSlot, setNewSlot] = useState({ name: '', start: '', end: '', orderStart: '', orderEnd: '' });
    const [newCamp, setNewCamp] = useState({ name: '', location: '' });
    const [tempBlock, setTempBlock] = useState('');
    const [tempFloor, setTempFloor] = useState('');
    const [tempClass, setTempClass] = useState('');

    const handleAddSlot = async () => {
        if (!newSlot.name) return;
        await addDoc(collection(db, 'hotels', hotelId, 'slots'), newSlot);
        setNewSlot({ name: '', start: '', end: '', orderStart: '', orderEnd: '' });
        onRefresh();
    };

    const handleAddCamp = async () => {
        if (!newCamp.name) return;
        await addDoc(collection(db, 'hotels', hotelId, 'camps'), newCamp);
        setNewCamp({ name: '', location: '' });
        onRefresh();
    };

    const handleAddItem = async (col, val, setter) => {
        if (!val) return;
        await addDoc(collection(db, 'hotels', hotelId, col), { name: val });
        setter('');
        onRefresh();
    };

    const deleteItem = async (col, id) => {
        if (window.confirm('Delete this entry?')) {
            await deleteDoc(doc(db, 'hotels', hotelId, col, id));
            onRefresh();
        }
    };

    return (
        <div className="slots-wrapper">
            <div className="glass-card slot-manager-card">
                <h2>Time & Slot Management</h2>
                <div className="slot-creation-grid">
                    <div className="input-block">
                        <label>Slot Name</label>
                        <input placeholder="e.g. Breakfast" value={newSlot.name} onChange={e => setNewSlot({...newSlot, name: e.target.value})} />
                    </div>
                    <div className="time-range-block">
                        <label>Service Duration</label>
                        <div className="time-inputs">
                            <input type="time" value={newSlot.start} onChange={e => setNewSlot({...newSlot, start: e.target.value})} />
                            <span>to</span>
                            <input type="time" value={newSlot.end} onChange={e => setNewSlot({...newSlot, end: e.target.value})} />
                        </div>
                    </div>
                    <div className="time-range-block">
                        <label>Ordering Window</label>
                        <div className="time-inputs">
                            <input type="time" value={newSlot.orderStart} onChange={e => setNewSlot({...newSlot, orderStart: e.target.value})} />
                            <span>to</span>
                            <input type="time" value={newSlot.orderEnd} onChange={e => setNewSlot({...newSlot, orderEnd: e.target.value})} />
                        </div>
                    </div>
                    <button className="save-slot-btn" onClick={handleAddSlot}>Save Time Slot</button>
                </div>

                <div className="slot-table-container">
                    <table className="industrial-table">
                        <thead>
                            <tr>
                                <th>Slot</th>
                                <th>Timing</th>
                                <th>Order Access</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map(s => (
                                <tr key={s.id}>
                                    <td><strong>{s.name}</strong></td>
                                    <td>{s.start} - {s.end}</td>
                                    <td><span className="window-pill">{s.orderStart} - {s.orderEnd}</span></td>
                                    <td>
                                        <button className="del-btn" onClick={() => deleteItem('slots', s.id)}><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="location-control-center">
                <div className="glass-card location-card">
                    <div className="card-title">
                        <MapPin size={20}/>
                        <h3>Camp Management</h3>
                    </div>
                    <div className="compact-form">
                        <input placeholder="Camp Name" value={newCamp.name} onChange={e => setNewCamp({...newCamp, name: e.target.value})} />
                        <input placeholder="Location" value={newCamp.location} onChange={e => setNewCamp({...newCamp, location: e.target.value})} />
                        <button className="mini-add-btn" onClick={handleAddCamp}>Save</button>
                    </div>
                    <div className="compact-list">
                        {camps.map(c => (
                            <div key={c.id} className="list-row">
                                <div className="row-text">
                                    <strong>{c.name}</strong>
                                    <span>{c.location}</span>
                                </div>
                                <button onClick={() => deleteItem('camps', c.id)}><Trash2 size={14}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card location-card">
                    <div className="card-title">
                        <Building size={20}/>
                        <h3>Block Management</h3>
                    </div>
                    <div className="compact-form">
                        <input placeholder="Block Name" value={tempBlock} onChange={e => setTempBlock(e.target.value)} />
                        <button className="mini-add-btn" onClick={() => handleAddItem('blocks', tempBlock, setTempBlock)}>Add</button>
                    </div>
                    <div className="compact-list">
                        {blocks.map(b => (
                            <div key={b.id} className="list-row">
                                <span>{b.name}</span>
                                <button onClick={() => deleteItem('blocks', b.id)}><Trash2 size={14}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card location-card">
                    <div className="card-title">
                        <Layers size={20}/>
                        <h3>Floor Management</h3>
                    </div>
                    <div className="compact-form">
                        <input placeholder="Floor #" value={tempFloor} onChange={e => setTempFloor(e.target.value)} />
                        <button className="mini-add-btn" onClick={() => handleAddItem('floors', tempFloor, setTempFloor)}>Add</button>
                    </div>
                    <div className="compact-list">
                        {floors.map(f => (
                            <div key={f.id} className="list-row">
                                <span>Floor {f.name}</span>
                                <button onClick={() => deleteItem('floors', f.id)}><Trash2 size={14}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card location-card">
                    <div className="card-title">
                        <BookOpen size={20}/>
                        <h3>Classrooms</h3>
                    </div>
                    <div className="compact-form">
                        <input placeholder="Classroom Name" value={tempClass} onChange={e => setTempClass(e.target.value)} />
                        <button className="mini-add-btn" onClick={() => handleAddItem('classrooms', tempClass, setTempClass)}>Add</button>
                    </div>
                    <div className="compact-list">
                        {classrooms.map(c => (
                            <div key={c.id} className="list-row">
                                <span>{c.name}</span>
                                <button onClick={() => deleteItem('classrooms', c.id)}><Trash2 size={14}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
import { useEffect, useMemo, useState } from 'react';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc
} from 'firebase/firestore';
import {
    Plus,
    Trash2,
    Receipt,
    Utensils
} from 'lucide-react';

import { db } from '../firebase';
import { motion } from 'framer-motion';

import BillPreviewModal from '../components/BillPreviewModal';
import ManagementSidebar from '../components/ManagementSidebar';
import '../Styles/bills.css';
import '../Styles/dashboard.css';

export default function Bills() {
    const hotelId = localStorage.getItem('hotelId');

    const [menuItems, setMenuItems] = useState([]);
    const [billItems, setBillItems] = useState([]);

    const [showQuickMenu, setShowQuickMenu] =
        useState(false);

    const [showPreview, setShowPreview] =
        useState(false);

    const [customerName, setCustomerName] =
        useState('');

    const [serviceType, setServiceType] =
        useState('Dine In');

    const [paymentMethod, setPaymentMethod] =
        useState('Cash');

    const [dynamicQr, setDynamicQr] =
        useState(false);

    const [taxGroups, setTaxGroups] = useState([]);
    const [deliverySettings, setDeliverySettings] = useState({
        camp: { charge: 0, type: 'rupees' },
        doorstep: { charge: 0, type: 'rupees' }
    });

    useEffect(() => {
        fetchMenu();
        fetchSettings();
    }, []);

    const fetchMenu = async () => {
        const snap = await getDocs(
            collection(
                db,
                'hotels',
                hotelId,
                'menu'
            )
        );

        setMenuItems(
            snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
        );
    };

    const fetchSettings = async () => {
        const taxSnap = await getDocs(collection(db, 'hotels', hotelId, 'taxGroups'));
        setTaxGroups(taxSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const deliveryDoc = await getDoc(doc(db, 'hotels', hotelId, 'settings', 'delivery'));
        if (deliveryDoc.exists()) {
            setDeliverySettings(deliveryDoc.data());
        }
    };

    const addItemToBill = item => {
        const exists = billItems.find(
            billItem => billItem.id === item.id
        );

        if (exists) {
            setBillItems(prev =>
                prev.map(billItem =>
                    billItem.id === item.id
                        ? {
                            ...billItem,
                            qty:
                                billItem.qty +
                                1
                        }
                        : billItem
                )
            );
        } else {
            setBillItems(prev => [
                ...prev,
                {
                    ...item,
                    qty: 1
                }
            ]);
        }
    };

    const removeItem = id => {
        setBillItems(prev =>
            prev.filter(item => item.id !== id)
        );
    };

    const subtotal = useMemo(
        () =>
            billItems.reduce(
                (sum, item) =>
                    sum +
                    item.price * item.qty,
                0
            ),
        [billItems]
    );

    const financials = useMemo(() => {
        let totalTax = 0;
        let deliveryCharge = 0;

        // Calculate Category-wise Taxes
        billItems.forEach(item => {
            const group = taxGroups.find(g => g.categories.includes(item.category));
            if (group) {
                totalTax += (item.price * item.qty) * (group.taxPercent / 100);
            }
        });

        // Calculate Delivery Charges
        if (serviceType === 'Camp Delivery') {
            const config = deliverySettings.camp;
            deliveryCharge = config.type === 'rupees' ? config.charge : (subtotal * (config.charge / 100));
        } else if (serviceType === 'Doorstep Delivery') {
            const config = deliverySettings.doorstep;
            deliveryCharge = config.type === 'rupees' ? config.charge : (subtotal * (config.charge / 100));
        }

        const total = subtotal + totalTax + deliveryCharge;

        return {
            tax: totalTax,
            deliveryCharge,
            total
        };
    }, [billItems, subtotal, serviceType, taxGroups, deliverySettings]);

    const { tax, deliveryCharge, total } = financials;

    const generateBillNumber = async () => {
        const now = new Date();
        const ddmmyy = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getFullYear()).slice(-2)}`;
        const prefix = `OFD_${ddmmyy}_`;

        const billSnap = await getDocs(
            collection(db, 'hotels', hotelId, 'bills')
        );

        const todayBills = billSnap.docs.filter(
            doc => doc.data().billNumber?.startsWith(prefix)
        );

        const suffix = String(todayBills.length + 1).padStart(2, '0');
        return `${prefix}${suffix}`;
    };
    const [dishSearch, setDishSearch] =
        useState('');

    const [selectedCategory, setSelectedCategory] =
        useState('');

    const filteredItems = useMemo(
        () =>
            menuItems.filter(item => {
                const matchesSearch = item.name
                    .toLowerCase()
                    .includes(
                        dishSearch.toLowerCase()
                    );

                const matchesCategory =
                    !selectedCategory ||
                    item.category === selectedCategory;

                return (
                    matchesSearch &&
                    matchesCategory
                );
            }),
        [menuItems, dishSearch, selectedCategory]
    );

    const confirmBill = async () => {
        const billNumber =
            await generateBillNumber();

        const billPayload = {
            billNumber,
            hotelName:
                localStorage.getItem(
                    'hotelName'
                ),
            ownerMobile:
                localStorage.getItem(
                    'ownerMobile'
                ),
            customerName,
            serviceType,
            paymentMethod,
            items: billItems,
            subtotal,
            tax,
            deliveryCharge,
            total,
            createdAt:
                new Date().toISOString()
        };

        await addDoc(
            collection(
                db,
                'hotels',
                hotelId,
                'bills'
            ),
            billPayload
        );

        alert(
            `Bill ${billNumber} Generated Successfully`
        );

        setBillItems([]);
        setCustomerName('');
        setShowPreview(false);
    };

    return (
        <div className="bills-page" style={{ padding: 0 }}>
            <div className="menu-hero-header">
                <div className="hero-shimmer"></div>
                <div className="hero-content">
                    <div className="hero-left">
                        <h1>Billing Desk</h1>
                        <p>Create professional POS bills instantly</p>
                    </div>

                    <div className="hero-stats">
                        <button
                            className="primary-btn"
                            onClick={() => setShowQuickMenu(!showQuickMenu)}
                            style={{ height: 'fit-content' }}
                        >
                            <Utensils size={18} />
                            {showQuickMenu ? 'Hide Quick Menu' : 'Show Quick Menu'}
                        </button>
                    </div>
                </div>
            </div>

            {showQuickMenu && (
                <div className="inline-quick-menu">
                    {Object.entries(
                        menuItems.reduce((acc, item) => {
                            const cat =
                                item.category || 'Others';

                            if (!acc[cat]) acc[cat] = [];

                            acc[cat].push(item);

                            return acc;
                        }, {})
                    ).map(([category, items]) => (
                        <div
                            key={category}
                            className="quick-category-block"
                        >
                            <h3>{category}</h3>

                            <div className="quick-items-row">
                                {items.map(item => (
                                    <button
                                        key={item.id}
                                        className="quick-food-card"
                                        onClick={() =>
                                            addItemToBill(
                                                item
                                            )
                                        }
                                    >
                                        <span>
                                            {item.name}
                                        </span>
                                        <small>
                                            ₹
                                            {
                                                item.price
                                            }
                                        </small>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {dishSearch && (
                <div className="category-food-preview">
                    {menuItems
                        .filter(
                            item =>
                                item.name
                                    ?.toLowerCase()
                                    .includes(
                                        dishSearch.toLowerCase()
                                    ) ||
                                item.uniqueCode
                                    ?.toLowerCase()
                                    .includes(
                                        dishSearch.toLowerCase()
                                    )
                        )
                        .map(item => (
                            <button
                                key={item.id}
                                className="category-food-btn"
                                onClick={() =>
                                    addItemToBill(item)
                                }
                            >
                                {item.name}
                                <span>₹{item.price}</span>
                            </button>
                        ))}
                </div>
            )}

            <div className="billing-form-card full-width">
                {/* Customer Name */}
                <input
                    placeholder="Customer Name (Optional)"
                    value={customerName}
                    onChange={(e) =>
                        setCustomerName(e.target.value)
                    }
                />

                {/* Search Dish */}
                <input
                    placeholder="Search Dish by Name / Unique Number"
                    value={dishSearch}
                    onChange={(e) =>
                        setDishSearch(e.target.value)
                    }
                />

                {/* Category Select */}
                <select
                    value={selectedCategory}
                    onChange={(e) =>
                        setSelectedCategory(e.target.value)
                    }
                >
                    <option value="">
                        Select Category
                    </option>

                    {[
                        ...new Set(
                            menuItems.map(
                                item => item.category
                            )
                        )
                    ].map(category => (
                        <option
                            key={category}
                            value={category}
                        >
                            {category}
                        </option>
                    ))}
                </select>

                {/* Category Items */}
                {selectedCategory && (
                    <div className="category-food-preview">
                        {menuItems
                            .filter(
                                item =>
                                    item.category ===
                                    selectedCategory
                            )
                            .map(item => (
                                <button
                                    key={item.id}
                                    className="category-food-btn"
                                    onClick={() =>
                                        addItemToBill(item)
                                    }
                                >
                                    {item.name}
                                    <span>
                                        ₹{item.price}
                                    </span>
                                </button>
                            ))}
                    </div>
                )}

                <div className="selection-stack">
                    <div className="selection-group">
                        <label>Service Type</label>
                        <div className="pill-selector">
                            {[
                                'Dine In',
                                'Camp Delivery',
                                'Doorstep Delivery'
                            ].map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    className={`pill-btn ${serviceType === type
                                        ? 'active'
                                        : ''
                                        }`}
                                    onClick={() =>
                                        setServiceType(type)
                                    }
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="selection-group">
                        <label>Payment Method</label>
                        <div className="pill-selector">
                            {[
                                'Cash',
                                'UPI',
                                'Card'
                            ].map(method => (
                                <button
                                    key={method}
                                    type="button"
                                    className={`pill-btn ${paymentMethod ===
                                        method
                                        ? 'active'
                                        : ''
                                        }`}
                                    onClick={() =>
                                        setPaymentMethod(
                                            method
                                        )
                                    }
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>



                    {/* Generate Bill */}
                    <button
                        className="generate-bill-btn"
                        onClick={() => {
                            if (!serviceType) {
                                alert(
                                    'Please select service type'
                                );
                                return;
                            }

                            if (!paymentMethod) {
                                alert(
                                    'Please select payment method'
                                );
                                return;
                            }

                            if (billItems.length === 0) {
                                alert(
                                    'Please add items to bill'
                                );
                                return;
                            }

                            setShowPreview(true);
                        }}
                    >
                        Generate Bill
                    </button>
                </div>




                <BillPreviewModal
                    isOpen={showPreview}
                    onClose={() =>
                        setShowPreview(false)
                    }
                    onConfirmBill={confirmBill}
                    billData={{
                        hotel: {
                            name:
                                localStorage.getItem(
                                    'hotelName'
                                ),
                            address:
                                'Hotel Address Here',
                            phone:
                                localStorage.getItem(
                                    'ownerMobile'
                                )
                        },
                        billNumber: 'Preview',
                        customerName,
                        items: billItems,
                        subtotal,
                        tax,
                        deliveryCharge,
                        total,
                        paymentMethod,
                        serviceType,
                        createdAt:
                            new Date().toISOString(),
                        paymentMethod,
                        setPaymentMethod,
                        dynamicQr,
                        setDynamicQr
                    }}
                />

                <motion.div
                    drag
                    dragMomentum={false}
                    className="draggable-bill-widget"
                    style={{ zIndex: 2147483647 }}
                >
                    <div className="widget-header">
                        <h3>Billing Status</h3>
                        <span className="count-badge">
                            {billItems.length} Items
                        </span>
                    </div>

                    <div className="widget-items">
                        {billItems.length > 0 ? (
                            billItems.map(item => (
                                <div key={item.id} className="widget-chip">
                                    <span>{item.name}</span>
                                    <button onClick={() => removeItem(item.id)}>×</button>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: '#6b7280', fontSize: '0.8rem', padding: '10px 0' }}>
                                Add items to start billing...
                            </p>
                        )}
                    </div>

                    <div className="widget-total">
                        <span>Total Payable</span>
                        <strong>₹{total.toFixed(2)}</strong>
                    </div>

                    <button
                        className="primary-btn"
                        disabled={billItems.length === 0}
                        style={{ 
                            width: '100%', 
                            marginTop: '16px',
                            opacity: billItems.length === 0 ? 0.5 : 1,
                            cursor: billItems.length === 0 ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => setShowPreview(true)}
                    >
                        Generate Bill
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
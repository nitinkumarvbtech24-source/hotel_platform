import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Trash2,
    Plus,
    Minus,
    Clock,
    Truck,
    CreditCard,
    Smartphone
} from 'lucide-react';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    serverTimestamp,
    doc,
    runTransaction
} from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import '../styles/cart.css';

export default function Cart() {
    const {
        cart,
        removeFromCart,
        increaseQty,
        decreaseQty,
        cartTotal,
        clearCart
    } = useCart();

    const navigate = useNavigate();

    // Form States
    const [timeSlot, setTimeSlot] = useState('');
    const [deliveryType, setDeliveryType] = useState('');
    const [campLocation, setCampLocation] = useState('');
    const [blockName, setBlockName] = useState('');
    const [floorNumber, setFloorNumber] = useState('');
    const [roomNumber, setRoomNumber] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('upi');

    const [isProcessing, setIsProcessing] = useState(false);

    const [hotelSlots, setHotelSlots] = useState([]);
    const [hotelCamps, setHotelCamps] = useState([]);
    const [hotelBlocks, setHotelBlocks] = useState([]);
    const [hotelFloors, setHotelFloors] = useState([]);

    useEffect(() => {
        if (cart.length > 0) {
            const hotelId = cart[0].hotelId;
            
            // Fetch Slots
            getDocs(collection(db, 'hotels', hotelId, 'slots')).then(snap => {
                setHotelSlots(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            // Fetch Camps
            getDocs(collection(db, 'hotels', hotelId, 'camps')).then(snap => {
                setHotelCamps(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            // Fetch Blocks
            getDocs(collection(db, 'hotels', hotelId, 'blocks')).then(snap => {
                setHotelBlocks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            // Fetch Floors
            getDocs(collection(db, 'hotels', hotelId, 'floors')).then(snap => {
                setHotelFloors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        }
    }, [cart]);

    const deliveryFee = cartTotal > 0 ? 30 : 0;
    const finalTotal = cartTotal + deliveryFee;

    const generateBillNumber = async (hotelId, method) => {
        const prefixMap = {
            dinein: 'OND',
            camp: 'CMP',
            doorstep: 'DOR'
        };

        const prefix = prefixMap[method] || 'ORD';
        const now = new Date();
        const ddmmyy = now.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }).replace(/\//g, '');

        // Use a transaction to ensure unique sequential numbers
        const counterRef = doc(db, 'counters', `orders_${hotelId}_${ddmmyy}`);
        let suffix = 0;

        try {
            suffix = await runTransaction(db, async (transaction) => {
                const counterSnap = await transaction.get(counterRef);
                let newSuffix = 0;
                if (counterSnap.exists()) {
                    newSuffix = counterSnap.data().count + 1;
                }
                transaction.set(counterRef, { count: newSuffix });
                return newSuffix;
            });
        } catch (err) {
            console.error("Transaction failed: ", err);
            // Fallback: use a simple query if transaction fails
            const q = query(
                collection(db, 'orders'),
                where('hotelId', '==', hotelId),
                where('billDate', '==', ddmmyy),
                orderBy('suffix', 'desc'),
                limit(1)
            );
            const snap = await getDocs(q);
            if (!snap.empty) {
                suffix = snap.docs[0].data().suffix + 1;
            }
        }

        return {
            billNumber: `${prefix}_${ddmmyy}_${suffix}`,
            billDate: ddmmyy,
            suffix: suffix
        };
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return;

        setIsProcessing(true);

        try {
            const hotelId = cart[0].hotelId; // All items in cart belong to the same hotel in this app flow
            const { billNumber, billDate, suffix } = await generateBillNumber(hotelId, deliveryType);

            const orderData = {
                userId: localStorage.getItem('userId') || 'anonymous',
                userName: localStorage.getItem('customerName') || 'Guest',
                userEmail: localStorage.getItem('customerEmail') || 'N/A',
                userMobile: localStorage.getItem('customerMobile') || 'N/A',
                hotelId: hotelId,
                hotelName: cart[0].hotelName || 'Unknown Hotel',
                hotelLocation: cart[0].hotelLocation || '',
                items: cart,
                subtotal: cartTotal,
                deliveryFee: deliveryFee,
                total: finalTotal,
                deliveryMethod: deliveryType,
                timeSlot: timeSlot,
                deliveryDetails: {
                    campLocation,
                    blockName,
                    floorNumber,
                    roomNumber
                },
                paymentMethod: paymentMethod,
                billNumber: billNumber,
                billDate: billDate,
                suffix: suffix,
                status: 'pending',
                createdAt: serverTimestamp()
            };

            await addDoc(collection(db, 'orders'), orderData);

            // Immediate Log Entry for Bill Logs
            const prettyServiceType = {
                dinein: 'Dine In',
                camp: 'Camp Delivery',
                doorstep: 'Doorstep Delivery'
            }[deliveryType] || 'Online Order';

            const logData = {
                billNumber: billNumber,
                billDate: billDate,
                customerName: orderData.userName,
                customerMobile: orderData.userMobile,
                customerEmail: orderData.userEmail,
                serviceType: prettyServiceType,
                location: deliveryType === 'dinein' ? 'Table Order' : 
                         deliveryType === 'camp' ? campLocation : 
                         `${blockName}-${floorNumber}-${roomNumber}`,
                timeSlot: timeSlot,
                items: cart.map(item => ({ name: item.name, price: item.price, quantity: item.qty })),
                total: finalTotal,
                subtotal: cartTotal,
                paymentMethod: paymentMethod,
                type: 'online',
                createdAt: new Date().toISOString(), // Use ISO string for consistent sorting in JS
                timestamp: serverTimestamp()
            };

            await addDoc(collection(db, 'hotels', hotelId, 'bills'), logData);

            alert(`Order Placed Successfully! \nBill No: ${billNumber}`);
            clearCart();
            navigate('/dashboard');
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Failed to place order. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="cart-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍽️</h1>
                    <h2>Your cart is empty</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>Looks like you haven't added anything yet.</p>
                    <Link to="/dashboard" className="checkout-btn" style={{ textDecoration: 'none', padding: '12px 32px' }}>
                        Browse Menu
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <header className="cart-header">
                <Link to="/dashboard" className="back-btn">
                    <ArrowLeft size={24} />
                </Link>
                <h1>Your Cart</h1>
            </header>

            {/* LEFT COLUMN: ITEMS */}
            <div className="cart-items-section">
                {cart.map(item => (
                    <div key={item.id} className="cart-item-card">
                        <img
                            src={item.imageUrl || 'https://via.placeholder.com/100?text=Food'}
                            alt={item.name}
                            className="cart-item-image"
                        />

                        <div className="cart-item-info">
                            <h3>{item.name}</h3>
                            <p>₹{item.price}</p>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 4 }}>
                                <span>{item.hotelName}</span>
                                {item.hotelLocation && (
                                    <span style={{ marginLeft: 8 }}>• {item.hotelLocation}</span>
                                )}
                            </div>
                        </div>

                        <div className="cart-item-controls">
                            <button
                                className="qty-btn"
                                onClick={() => decreaseQty(item.id)}
                            >
                                <Minus size={16} />
                            </button>
                            <span className="qty-display">{item.qty}</span>
                            <button
                                className="qty-btn"
                                onClick={() => increaseQty(item.id)}
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        <button
                            className="delete-btn"
                            onClick={() => removeFromCart(item.id)}
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
            </div>

            {/* RIGHT COLUMN: SUMMARY & FORM */}
            <aside className="cart-summary-section">
                <div className="summary-card">
                    <h2>Order Summary</h2>

                    <div className="summary-row">
                        <span>Items ({cart.length})</span>
                        <span>₹{cartTotal}</span>
                    </div>

                    <div className="summary-row">
                        <span>Delivery Fee</span>
                        <span>₹{deliveryFee}</span>
                    </div>

                    <div className="summary-row total">
                        <span>Total Bill</span>
                        <span>₹{finalTotal}</span>
                    </div>

                    <form className="checkout-form" onSubmit={handleCheckout}>
                        {/* Time Slot */}
                        <div className="form-group">
                            <label><Clock size={16} style={{ marginRight: 8 }} /> Select Time Slot</label>
                            <select
                                required
                                value={timeSlot}
                                onChange={(e) => setTimeSlot(e.target.value)}
                            >
                                <option value="">Choose a slot...</option>
                                {hotelSlots.map(slot => (
                                    <option key={slot.id} value={slot.name}>
                                        {slot.name} ({slot.start} - {slot.end})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Delivery Type */}
                        <div className="form-group">
                            <label><Truck size={16} style={{ marginRight: 8 }} /> Delivery Method</label>
                            <select
                                required
                                value={deliveryType}
                                onChange={(e) => setDeliveryType(e.target.value)}
                            >
                                <option value="">Select method...</option>
                                <option value="dinein">Dine In</option>
                                <option value="camp">Camp Delivery</option>
                                <option value="doorstep">Doorstep Delivery</option>
                            </select>
                        </div>

                        {/* Conditional: Camp Delivery */}
                        {deliveryType === 'camp' && (
                            <div className="form-group">
                                <label>Camp Location</label>
                                <select
                                    required
                                    value={campLocation}
                                    onChange={(e) => setCampLocation(e.target.value)}
                                >
                                    <option value="">Select camp...</option>
                                    {hotelCamps.map(camp => (
                                        <option key={camp.id} value={camp.name}>
                                            {camp.name} ({camp.location})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Conditional: Doorstep Delivery */}
                        {deliveryType === 'doorstep' && (
                            <>
                                <div className="form-group">
                                    <label>Block Name</label>
                                    <select
                                        required
                                        value={blockName}
                                        onChange={(e) => setBlockName(e.target.value)}
                                    >
                                        <option value="">Select block...</option>
                                        {hotelBlocks.map(block => (
                                            <option key={block.id} value={block.name}>{block.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="form-group">
                                        <label>Floor</label>
                                        <select
                                            required
                                            value={floorNumber}
                                            onChange={(e) => setFloorNumber(e.target.value)}
                                        >
                                            <option value="">Floor...</option>
                                            {hotelFloors.map(floor => (
                                                <option key={floor.id} value={floor.name}>{floor.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Room No</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Room #"
                                            value={roomNumber}
                                            onChange={(e) => setRoomNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Payment Method */}
                        <div className="form-group">
                            <label>Payment Method</label>
                            <div className="payment-options">
                                <label className="payment-radio">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="upi"
                                        checked={paymentMethod === 'upi'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className="payment-box">
                                        <Smartphone size={20} />
                                        <span>UPI / PhonePe</span>
                                    </div>
                                </label>
                                <label className="payment-radio">
                                    <input
                                        type="radio"
                                        name="payment"
                                        value="card"
                                        checked={paymentMethod === 'card'}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <div className="payment-box">
                                        <CreditCard size={20} />
                                        <span>Card</span>
                                    </div>
                                </label>
                            </div>
                        </div>


                        <button
                            type="submit"
                            className="checkout-btn"
                            disabled={isProcessing}
                        >
                            {isProcessing ? 'Processing...' : 'Place Order'}
                        </button>
                    </form>
                </div>
            </aside>
        </div>
    );
}

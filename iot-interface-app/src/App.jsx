import { useState, useEffect } from 'react';
import {
  Cpu,
  Activity,
  UserPlus,
  History,
  Settings,
  SmartphoneNfc,
  LogOut,
  Printer,
  Search,
  CheckCircle,
  AlertCircle,
  User,
  CreditCard
} from 'lucide-react';
import BillPreviewModal from './components/BillPreviewModal';
import { auth, db } from './firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  addDoc,
  getDocs,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';

import Login from './pages/Login';
import Hotelselect from './pages/Hotelselect';
import Roleselect from './pages/Roleselect';
import './index.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [staffUser, setStaffUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auth Flow State
  const [authState, setAuthState] = useState('hotel'); // 'hotel', 'role', 'login', 'dashboard'
  const [selectedHotel, setSelectedHotel] = useState(() => {
    const saved = localStorage.getItem('iot_selected_hotel');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedRole, setSelectedRole] = useState(localStorage.getItem('iot_selected_role'));

  // App State
  const [activeTab, setActiveTab] = useState('scanner');
  const [scannerStatus, setScannerStatus] = useState('waiting');
  const [scannedUid, setScannedUid] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [customerBills, setCustomerBills] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Blynk Integration
  const [blynkToken, setBlynkToken] = useState(localStorage.getItem('blynk_token') || '');
  const [blynkStatus, setBlynkStatus] = useState('Checking...');
  const BLYNK_HOST = "https://blynk.cloud";
  const VIRTUAL_PIN = "V1";
  const FLAG_PIN = "V2";

  // Registration Form
  const [regMobile, setRegMobile] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Bill Preview State
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [activePreviewBill, setActivePreviewBill] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);

      // Only auto-redirect to dashboard if we have a user AND a saved hotel
      // AND we aren't already in the middle of a selection flow
      if (u && selectedHotel && authState === 'hotel') {
        setAuthState('dashboard');
      } else if (!u) {
        setAuthState('hotel');
        setSelectedHotel(null);
        setSelectedRole(null);
      }

      setLoading(false);
    });
    return unsub;
  }, []); // Remove selectedHotel dependency to avoid loops during flow

  // Persist Hotel & Role
  useEffect(() => {
    if (selectedHotel) localStorage.setItem('iot_selected_hotel', JSON.stringify(selectedHotel));
    else localStorage.removeItem('iot_selected_hotel');
  }, [selectedHotel]);

  useEffect(() => {
    if (selectedRole) localStorage.setItem('iot_selected_role', selectedRole);
    else localStorage.removeItem('iot_selected_role');
  }, [selectedRole]);

  // Hardware Scanner Listener (Blynk API Polling)
  useEffect(() => {
    if (authState !== 'dashboard' || !selectedHotel || !blynkToken) {
      if (!blynkToken) setBlynkStatus('Token Required');
      return;
    }

    const pollBlynk = async () => {
      try {
        const res = await fetch(`${BLYNK_HOST}/external/api/get?token=${blynkToken.trim()}&pin=${VIRTUAL_PIN}`);
        let text = (await res.text()).trim();
        // Blynk sometimes returns ["value"] or "value"
        text = text.replace(/^\["|"\]$|^"|"$|\[|\]/g, "");
        const uid = (text === "null" || text === "" || text === "0") ? null : text;

        if (uid && uid !== scannedUid) {
          handleCardScanned(uid);
          setBlynkStatus('Card Detected ✅');
        } else if (!uid) {
          setBlynkStatus('Hardware Online ✅');
          if (scannerStatus === 'found' || scannerStatus === 'not_found') {
            // Keep the result view and the scannedUid for registration
          }
        }
      } catch (err) {
        console.error("Blynk Poll Error:", err);
        setBlynkStatus('Blynk Offline ❌');
      }
    };

    const interval = setInterval(pollBlynk, 1000);
    return () => clearInterval(interval);
  }, [authState, selectedHotel, blynkToken, scannedUid, scannerStatus]);

  // Persist Blynk Token
  useEffect(() => {
    if (blynkToken) localStorage.setItem('blynk_token', blynkToken);
    else localStorage.removeItem('blynk_token');
  }, [blynkToken]);

  // History Listener
  useEffect(() => {
    if (authState !== 'dashboard' || !selectedHotel || activeTab !== 'history') return;

    const q = query(
      collection(db, 'hotels', selectedHotel.id, 'access_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubHistory = onSnapshot(q, (snap) => {
      setHistoryLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return unsubHistory;
  }, [authState, selectedHotel, activeTab]);

  const handleCardScanned = async (uid) => {
    setScannedUid(uid);
    setScannerStatus('fetching');
    setActiveTab('scanner');

    try {
      const cardSnap = await getDocs(query(collection(db, 'cards'), where('uid', '==', uid)));

      if (!cardSnap.empty) {
        const cardData = cardSnap.docs[0].data();
        const custDoc = await getDoc(doc(db, 'users', cardData.customerId));

        if (custDoc.exists()) {
          setCustomerData({ id: custDoc.id, ...custDoc.data() });

          // FETCH PENDING TTB ORDERS FROM THE 'orders' COLLECTION
          const billsSnap = await getDocs(query(
            collection(db, 'orders'),
            where('userId', '==', custDoc.id),
            where('hotelId', '==', selectedHotel.id),
            where('status', '==', 'passed_to_ttb')
          ));
          setCustomerBills(billsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

          setScannerStatus('found');
          await logAccess(uid, custDoc.id, 'success');

          // Send Success Flag to Blynk
          await fetch(`${BLYNK_HOST}/external/api/update?token=${blynkToken.trim()}&pin=${FLAG_PIN}&value=1`);
        } else {
          setScannerStatus('not_found');
          // Send Error Flag to Blynk
          await fetch(`${BLYNK_HOST}/external/api/update?token=${blynkToken.trim()}&pin=${FLAG_PIN}&value=0`);
        }
      } else {
        setScannerStatus('not_found');
        await logAccess(uid, null, 'new_card');
        // Send Error Flag to Blynk
        await fetch(`${BLYNK_HOST}/external/api/update?token=${blynkToken.trim()}&pin=${FLAG_PIN}&value=0`);
      }
    } catch (err) {
      console.error(err);
      setScannerStatus('waiting');
    }
  };

  const formatBillHTML = (bill) => {
    if (!bill) return "<div>No bill found.</div>";
    const hotelName = selectedHotel?.hotelName || "HOTEL";
    const billId = bill.id || bill.orderId || "";
    const dt = new Date(bill.createdAt || Date.now()).toLocaleString();
    const token = bill.token || bill.tokenNumber || "";
    const customer = customerData?.name || bill.customerName || "N/A";
    const total = Number(bill.totalAmount || bill.total || 0);

    let html = `<div style="font-family:monospace; padding: 20px; color: #000;">`;
    html += `<div style="text-align:center; font-weight:bold; font-size:18px; margin-bottom:10px;">${hotelName}</div>`;
    html += `<div><b>Bill ID:</b> ${billId}</div>`;
    html += `<div><b>Date:</b> ${dt}</div>`;
    html += `<div><b>Token:</b> #${token}</div>`;
    html += `<div><b>Customer:</b> ${customer}</div>`;
    html += `<hr style="border:none; border-top:1px dashed #000; margin:10px 0;">`;

    html += `<table style="width:100%; border-collapse:collapse;">`;
    html += `<tr><th style="text-align:left;">Item</th><th style="text-align:right;">Price</th></tr>`;

    (bill.items || []).forEach(it => {
      const nm = it.name || it.itemName || "";
      const qty = it.qty || it.quantity || 1;
      const price = Number(it.price || 0);
      html += `<tr><td>${nm}${qty > 1 ? ` x${qty}` : ""}</td><td style="text-align:right;">₹${(price * qty).toFixed(2)}</td></tr>`;
    });

    html += `</table>`;
    html += `<hr style="border:none; border-top:1px dashed #000; margin:10px 0;">`;

    html += `<div style="text-align:right; font-size: 16px;">`;
    html += `<b>Total: ₹${total.toFixed(2)}</b>`;
    html += `</div><hr style="border:none; border-top:1px dashed #000; margin:10px 0;">`;
    html += `<div style="text-align:center;">Thank you! Visit again!</div></div>`;
    return html;
  };

  const handlePrint = (bill) => {
    setActivePreviewBill({
      ...bill,
      hotel: {
        name: selectedHotel.name,
        address: selectedHotel.location || 'Hotel Address',
        phone: selectedHotel.ownerMobile || 'Contact Number'
      },
      customerName: customerData?.name || bill.userName || 'Guest',
      subtotal: bill.subtotal || bill.total || 0,
      tax: bill.tax || 0,
      deliveryCharge: bill.deliveryCharge || 0,
      total: bill.total || 0,
      paymentMethod: bill.paymentMethod || 'TTB Wallet',
      serviceType: bill.serviceType || bill.deliveryMethod || 'Online Order',
      createdAt: bill.createdAt
    });
    setShowBillPreview(true);
  };

  const logAccess = async (uid, customerId, status) => {
    await addDoc(collection(db, 'hotels', selectedHotel.id, 'access_logs'), {
      uid,
      customerId,
      status,
      timestamp: serverTimestamp()
    });
  };

  const finalizeRegistration = async () => {
    if (!scannedUid) {
      alert("Please scan a card first.");
      return;
    }
    if (!regName || !regMobile) {
      alert("Customer Name and Mobile are required.");
      return;
    }

    setRegLoading(true);
    try {
      // 1. Search for existing user by mobile in the 'users' collection
      let custId = null;
      const userQuery = query(collection(db, 'users'), where('mobile', '==', regMobile));
      const userSnap = await getDocs(userQuery);

      if (!userSnap.empty) {
        custId = userSnap.docs[0].id;
      } else {
        // Create a new user in the same 'users' collection if not found
        const newCust = await addDoc(collection(db, 'users'), {
          name: regName,
          mobile: regMobile,
          email: regEmail,
          createdAt: serverTimestamp()
        });
        custId = newCust.id;
      }

      // 2. Link card to this userId
      await addDoc(collection(db, 'cards'), {
        uid: scannedUid,
        customerId: custId, // This is now the UID from the 'users' collection
        hotelId: selectedHotel.id,
        registeredAt: serverTimestamp()
      });

      alert("Card Registered Successfully!");
      
      // Reset form
      setRegName('');
      setRegMobile('');
      setRegEmail('');
      setScannerStatus('waiting');
      setScannedUid(null);
      setActiveTab('scanner');
    } catch (err) {
      console.error("Registration Error:", err);
      alert("Failed to register: " + err.message);
    } finally {
      setRegLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    setStaffUser(null);
    setAuthState('hotel');
    setSelectedHotel(null);
    setSelectedRole(null);
  };

  const handleStaffLogin = (data) => {
    setStaffUser(data);
    setAuthState('dashboard');
  };

  if (loading) return <div className="iot-loading">Initializing Hardware Gateway...</div>;

  // AUTH FLOW RENDERING
  const authenticated = user || staffUser;
  if (!authenticated || authState !== 'dashboard') {
    if (authState === 'hotel') {
      return <Hotelselect onSelect={(h) => { setSelectedHotel(h); setAuthState('role'); }} />;
    }
    if (authState === 'role') {
      return (
        <Roleselect
          hotel={selectedHotel}
          onSelect={(r) => { setSelectedRole(r); setAuthState('login'); }}
          onBack={() => setAuthState('hotel')}
        />
      );
    }
    if (authState === 'login') {
      return (
        <Login
          hotel={selectedHotel}
          role={selectedRole}
          onLoginSuccess={(data) => {
            if (selectedRole === 'owner') setAuthState('dashboard');
            else handleStaffLogin(data);
          }}
          onBack={() => setAuthState('role')}
        />
      );
    }
  }

  return (
    <div className="iot-shell">
      <aside className="iot-sidebar">
        <div className="iot-brand">
          <div className="brand-wrap">
            <Cpu size={32} />
            <h2>IOT CORE</h2>
          </div>
          <span className="version">TTB GATEWAY • {selectedHotel?.hotelName}</span>
        </div>

        <nav className="iot-nav">
          <button className={activeTab === 'scanner' ? 'active' : ''} onClick={() => setActiveTab('scanner')}>
            <SmartphoneNfc size={20} /> TTB Scanner
          </button>
          <button className={activeTab === 'register' ? 'active' : ''} onClick={() => setActiveTab('register')}>
            <UserPlus size={20} /> Register Card
          </button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
            <History size={20} /> Access Logs
          </button>
          <button onClick={handleLogout} className="logout-btn-iot">
            <LogOut size={20} /> Change Property
          </button>
        </nav>

        <div className="sidebar-status-box">
          <div className="status-header">
            <Activity size={14} /> HARDWARE STATUS
          </div>
          <div className="blynk-config-mini">
            <input
              type="password"
              placeholder="Blynk Auth Token"
              value={blynkToken}
              onChange={(e) => setBlynkToken(e.target.value)}
            />
            <span className={`blynk-status-tag ${blynkStatus.includes('✅') ? 'online' : 'error'}`}>
              {blynkStatus}
            </span>
          </div>
          <div className="status-item">
            <span>PN532 Reader</span>
            <div className={`status-dot ${blynkStatus.includes('✅') ? 'online' : 'offline'}`}></div>
          </div>
          <div className="status-item">
            <span>{selectedHotel?.hotelName}</span>
            <div className="status-dot online"></div>
          </div>
        </div>
      </aside>

      <main className="iot-main">
        {activeTab === 'scanner' && (
          <div className="scanner-view">
            {scannerStatus === 'waiting' && (
              <div className="scanner-container fadeIn">
                <div className="nfc-pulse-zone">
                  <div className="pulse-ring"></div>
                  <SmartphoneNfc size={80} />
                </div>
                <div className="scanner-text">
                  <h2>READY TO SCAN</h2>
                  <p>Tap card on the reader to fetch TTB bills for <strong>{selectedHotel?.hotelName}</strong>.</p>
                </div>
              </div>
            )}

            {scannerStatus === 'fetching' && (
              <div className="scanner-container">
                <div className="nfc-pulse-zone">
                  <div className="pulse-ring active"></div>
                  <Activity size={80} />
                </div>
                <div className="scanner-text">
                  <h2>RETRIEVING DATA...</h2>
                </div>
              </div>
            )}

            {scannerStatus === 'found' && customerData && (
              <div className="card-result-view fadeInScale">
                <div className="customer-hero-card">
                  <div className="hero-top">
                    <div className="cust-avatar">
                      <User size={40} />
                    </div>
                    <div className="cust-meta">
                      <h3>{customerData.name}</h3>
                      <span>{customerData.mobile}</span>
                    </div>
                    <div className="balance-tag">
                      ₹{customerBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0)}
                    </div>
                  </div>
                </div>

                <div className="bill-section">
                  <div className="section-header">
                    <h2>PASSED TTB BILLS</h2>
                    <button className="iot-btn-outline" onClick={() => customerBills.forEach(b => handlePrint(b))}>
                      <Printer size={18} /> Print All
                    </button>
                  </div>

                  <div className="ttb-bill-list">
                    {customerBills.length === 0 ? (
                      <div className="empty-bills">No bills for this property.</div>
                    ) : (
                      customerBills.map(bill => (
                        <div key={bill.id} className="ttb-bill-item">
                          <div className="bill-main">
                            <strong>#{bill.billNumber?.slice(-6) || bill.id.slice(-6)}</strong>
                            <span>{new Date(bill.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="bill-amount">₹{bill.totalAmount}</div>
                          <button className="print-mini" onClick={() => handlePrint(bill)}>
                            <Printer size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button className="reset-scanner-btn" onClick={() => { setScannerStatus('waiting'); setScannedUid(null); }}>
                  Ready for next scan
                </button>
              </div>
            )}

            {scannerStatus === 'not_found' && (
              <div className="scanner-container">
                <div className="nfc-pulse-zone error">
                  <AlertCircle size={80} color="#da3633" />
                </div>
                <div className="scanner-text">
                  <h2>UNREGISTERED</h2>
                  <p>Card UID: {scannedUid}</p>
                  <div className="btn-row-iot">
                    <button className="iot-btn-primary" onClick={() => setActiveTab('register')}>
                      Register
                    </button>
                    <button className="iot-btn-outline" onClick={() => setScannerStatus('waiting')}>
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'register' && (
          <div className="register-view fadeIn">
            <div className="section-title">
              <h1>Registration</h1>
              <p>Link UID <strong>{scannedUid || 'READY TO SCAN'}</strong> to customer.</p>
            </div>

            <div className="register-form-iot">
              <div className="form-group-iot">
                <label>Customer Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
              <div className="form-group-iot">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={regMobile}
                  onChange={(e) => setRegMobile(e.target.value)}
                />
              </div>
              <div className="form-group-iot">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>

              <button
                className="iot-btn-primary"
                onClick={finalizeRegistration}
                disabled={regLoading || !scannedUid}
                style={{ marginTop: '10px' }}
              >
                {regLoading ? 'Registering...' : 'Register Card & Link'}
              </button>

              {!scannedUid && (
                <p style={{ color: '#da3633', fontSize: '0.8rem', marginTop: '10px', textAlign: 'center' }}>
                  * Please scan a card first to register.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-view fadeIn">
            <div className="section-title">
              <h1>Access Logs</h1>
              <p>Hardware audit for {selectedHotel?.hotelName}.</p>
            </div>

            <div className="history-table-iot">
              <div className="history-header-row">
                <span>Timestamp</span>
                <span>Card UID</span>
                <span>Customer</span>
                <span>Status</span>
              </div>
              <div className="history-body">
                {historyLogs.length === 0 ? (
                  <div className="empty-bills" style={{ padding: '40px' }}>No logs found yet.</div>
                ) : (
                  historyLogs.map(log => (
                    <div key={log.id} className="history-log-row">
                      <span style={{ color: 'var(--iot-text-dim)' }}>
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now'}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{log.uid}</span>
                      <span>{log.customerId || '---'}</span>
                      <span>
                        <span className={`status-pill ${log.status}`}>
                          {log.status.toUpperCase()}
                        </span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <BillPreviewModal 
          isOpen={showBillPreview} 
          onClose={() => setShowBillPreview(false)} 
          billData={activePreviewBill}
        />
      </main>
    </div>
  );
}

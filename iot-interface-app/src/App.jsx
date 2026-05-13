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
import './index.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hotelId, setHotelId] = useState(localStorage.getItem('hotelId'));
  
  const [activeTab, setActiveTab] = useState('scanner'); // 'scanner', 'register', 'history'
  const [scannerStatus, setScannerStatus] = useState('waiting'); // 'waiting', 'fetching', 'found', 'not_found'
  const [scannedUid, setScannedUid] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [customerBills, setCustomerBills] = useState([]);
  
  const [historyLogs, setHistoryLogs] = useState([]);

  // Registration Form State
  const [regMobile, setRegMobile] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Listen for physical scanner updates (Simulated via Firestore)
  useEffect(() => {
    if (!hotelId || !user) return;

    const scannerRef = doc(db, 'hotels', hotelId, 'hardware', 'scanner');
    const unsubScanner = onSnapshot(scannerRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.currentUid && data.currentUid !== scannedUid) {
          handleCardScanned(data.currentUid);
        }
      }
    });

    return unsubScanner;
  }, [hotelId, user, scannedUid]);

  // Fetch History
  useEffect(() => {
    if (!hotelId || activeTab !== 'history') return;

    const q = query(
      collection(db, 'hotels', hotelId, 'access_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubHistory = onSnapshot(q, (snap) => {
      setHistoryLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return unsubHistory;
  }, [hotelId, activeTab]);

  const handleCardScanned = async (uid) => {
    setScannedUid(uid);
    setScannerStatus('fetching');
    setActiveTab('scanner');

    try {
      // 1. Check if card is registered
      const cardSnap = await getDocs(query(collection(db, 'cards'), where('uid', '==', uid)));
      
      if (!cardSnap.empty) {
        const cardData = cardSnap.docs[0].data();
        // 2. Fetch Customer Info
        const custDoc = await getDoc(doc(db, 'customers', cardData.customerId));
        
        if (custDoc.exists()) {
          setCustomerData({ id: custDoc.id, ...custDoc.data() });
          
          // 3. Fetch TTB Bills
          const billsSnap = await getDocs(query(
            collection(db, 'ttb_bills'), 
            where('customerId', '==', custDoc.id),
            where('hotelId', '==', hotelId)
          ));
          setCustomerBills(billsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          
          setScannerStatus('found');
          logAccess(uid, custDoc.id, 'success');
        } else {
          setScannerStatus('not_found');
        }
      } else {
        setScannerStatus('not_found');
        logAccess(uid, null, 'new_card');
      }
    } catch (err) {
      console.error(err);
      setScannerStatus('waiting');
    }
  };

  const logAccess = async (uid, customerId, status) => {
    await addDoc(collection(db, 'hotels', hotelId, 'access_logs'), {
      uid,
      customerId,
      status,
      timestamp: serverTimestamp()
    });
  };

  const handleRegisterSearch = async () => {
    if (!regMobile) return;
    setRegLoading(true);
    try {
      const q = query(collection(db, 'customers'), where('mobile', '==', regMobile));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setRegName(data.name || data.userName);
        setRegEmail(data.email);
        setCustomerData({ id: snap.docs[0].id, ...data });
      } else {
        alert("No existing customer found with this mobile. Please enter details manually.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegLoading(false);
    }
  };

  const finalizeRegistration = async () => {
    if (!scannedUid || !regName || !regMobile) return;
    setRegLoading(true);
    try {
      let custId = customerData?.id;
      
      // If new customer, create one
      if (!custId) {
        const newCust = await addDoc(collection(db, 'customers'), {
          name: regName,
          mobile: regMobile,
          email: regEmail,
          createdAt: serverTimestamp()
        });
        custId = newCust.id;
      }

      // Map Card to Customer
      await addDoc(collection(db, 'cards'), {
        uid: scannedUid,
        customerId: custId,
        hotelId: hotelId,
        registeredAt: serverTimestamp()
      });

      alert("Card Registered Successfully!");
      setScannerStatus('waiting');
      setActiveTab('scanner');
    } catch (err) {
      alert(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  if (loading) return <div className="iot-loading">Initializing Hardware Gateway...</div>;
  if (!user) return <Login onLoginSuccess={(d) => { setHotelId(d.hotelId); setUser(auth.currentUser); }} />;

  return (
    <div className="iot-shell">
      <aside className="iot-sidebar">
        <div className="iot-brand">
          <div className="brand-wrap">
            <Cpu size={32} />
            <h2>IOT CORE</h2>
          </div>
          <span className="version">TTB GATEWAY v4.2</span>
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
          <button onClick={() => auth.signOut()}>
            <LogOut size={20} /> Logout
          </button>
        </nav>

        <div className="sidebar-status-box">
          <div className="status-header">
            <Activity size={14} /> HARDWARE STATUS
          </div>
          <div className="status-item">
            <span>PN532 Reader</span>
            <div className="status-dot online"></div>
          </div>
          <div className="status-item">
            <span>Cloud Sync</span>
            <div className="status-dot online"></div>
          </div>
        </div>
      </aside>

      <main className="iot-main">
        {activeTab === 'scanner' && (
          <div className="scanner-view">
            {scannerStatus === 'waiting' && (
              <div className="scanner-container">
                <div className="nfc-pulse-zone">
                  <div className="pulse-ring"></div>
                  <SmartphoneNfc size={80} />
                </div>
                <div className="scanner-text">
                  <h2>READY TO SCAN</h2>
                  <p>Please tap the customer's TTB Card on the reader to fetch bills.</p>
                </div>
              </div>
            )}

            {scannerStatus === 'fetching' && (
              <div className="scanner-container">
                <div className="nfc-pulse-zone">
                  <div className="pulse-ring" style={{ animationDuration: '0.5s' }}></div>
                  <Activity size={80} />
                </div>
                <div className="scanner-text">
                  <h2>AUTHENTICATING...</h2>
                  <p>Fetching card data from secure hotel cloud.</p>
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
                        <span>{customerData.mobile} • {customerData.email || 'No Email'}</span>
                      </div>
                      <div className="balance-tag">
                        TOTAL TTB: ₹{customerBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0)}
                      </div>
                   </div>
                </div>

                <div className="bill-section">
                  <div className="section-header">
                    <h2>UNPAID TTB BILLS</h2>
                    <button className="iot-btn-outline" onClick={() => window.print()}>
                      <Printer size={18} /> Print All
                    </button>
                  </div>

                  <div className="ttb-bill-list">
                    {customerBills.length === 0 ? (
                      <div className="empty-bills">No pending TTB bills found.</div>
                    ) : (
                      customerBills.map(bill => (
                        <div key={bill.id} className="ttb-bill-item">
                          <div className="bill-main">
                            <strong>#{bill.billNumber?.slice(-6)}</strong>
                            <span>{new Date(bill.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="bill-amount">₹{bill.totalAmount}</div>
                          <button className="print-mini" onClick={() => window.print()}>
                            <Printer size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <button className="reset-scanner-btn" onClick={() => setScannerStatus('waiting')}>
                   Done / Next Customer
                </button>
              </div>
            )}

            {scannerStatus === 'not_found' && (
              <div className="scanner-container">
                 <div className="nfc-pulse-zone error">
                    <AlertCircle size={80} color="#da3633" />
                 </div>
                 <div className="scanner-text">
                    <h2>UNREGISTERED CARD</h2>
                    <p>UID: <strong>{scannedUid}</strong> is not mapped to any customer.</p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'center' }}>
                      <button className="iot-btn-primary" onClick={() => setActiveTab('register')}>
                         Register This Card
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
          <div className="register-view">
             <div className="section-title">
                <h1>Card Registration</h1>
                <p>Link physical UID <strong>{scannedUid || 'WAITING...'}</strong> to a customer profile.</p>
             </div>

             <div className="register-form-iot">
                <div className="form-group-iot">
                   <label>Customer Mobile Number</label>
                   <div className="search-input-wrap">
                      <input 
                        type="text" 
                        placeholder="Search existing customer..." 
                        value={regMobile}
                        onChange={(e) => setRegMobile(e.target.value)}
                        autoComplete="tel"
                      />
                      <button onClick={handleRegisterSearch} disabled={regLoading}>
                        <Search size={18} />
                      </button>
                   </div>
                </div>

                <div className="form-group-iot">
                   <label>Customer Name</label>
                   <input 
                      type="text" 
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Full Name"
                      autoComplete="name"
                   />
                </div>

                <div className="form-group-iot">
                   <label>Email Address (Optional)</label>
                   <input 
                      type="email" 
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="customer@email.com"
                      autoComplete="email"
                   />
                </div>

                <button className="iot-btn-primary full" onClick={finalizeRegistration} disabled={regLoading}>
                   {regLoading ? 'Processing...' : 'Authorize & Link Card'}
                </button>
             </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-view">
             <div className="section-title">
                <h1>Access Logs</h1>
                <p>Live hardware audit for TTB Card usage.</p>
             </div>

             <div className="history-table-iot">
                <div className="history-header-row">
                   <span>Timestamp</span>
                   <span>UID</span>
                   <span>Event</span>
                   <span>Status</span>
                </div>
                {historyLogs.map(log => (
                  <div key={log.id} className="history-log-row">
                    <span>{log.timestamp?.toDate().toLocaleTimeString()}</span>
                    <span>{log.uid}</span>
                    <span>{log.status === 'success' ? 'Bill Access' : 'Registration Attempt'}</span>
                    <span className={`status-pill ${log.status}`}>
                       {log.status.toUpperCase()}
                    </span>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>
    </div>
  );
}

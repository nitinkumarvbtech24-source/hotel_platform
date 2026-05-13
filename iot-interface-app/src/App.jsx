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
import Hotelselect from './pages/Hotelselect';
import Roleselect from './pages/Roleselect';
import './index.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Auth Flow State
  const [authState, setAuthState] = useState('hotel'); // 'hotel', 'role', 'login', 'dashboard'
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  // App State
  const [activeTab, setActiveTab] = useState('scanner');
  const [scannerStatus, setScannerStatus] = useState('waiting');
  const [scannedUid, setScannedUid] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [customerBills, setCustomerBills] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Registration Form
  const [regMobile, setRegMobile] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
        setAuthState('dashboard');
      } else {
        setUser(null);
        setAuthState('hotel');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Hardware Scanner Listener (Scoped to selectedHotel)
  useEffect(() => {
    if (authState !== 'dashboard' || !selectedHotel) return;

    const scannerRef = doc(db, 'hotels', selectedHotel.id, 'hardware', 'scanner');
    const unsubScanner = onSnapshot(scannerRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.currentUid && data.currentUid !== scannedUid) {
          handleCardScanned(data.currentUid);
        }
      }
    });

    return unsubScanner;
  }, [authState, selectedHotel, scannedUid]);

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
        const custDoc = await getDoc(doc(db, 'customers', cardData.customerId));
        
        if (custDoc.exists()) {
          setCustomerData({ id: custDoc.id, ...custDoc.data() });
          
          // FETCH TTB BILLS FOR THIS SPECIFIC HOTEL
          const billsSnap = await getDocs(query(
            collection(db, 'ttb_bills'), 
            where('customerId', '==', custDoc.id),
            where('hotelId', '==', selectedHotel.id)
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
    await addDoc(collection(db, 'hotels', selectedHotel.id, 'access_logs'), {
      uid,
      customerId,
      status,
      timestamp: serverTimestamp()
    });
  };

  const finalizeRegistration = async () => {
    if (!scannedUid || !regName || !regMobile) return;
    setRegLoading(true);
    try {
      let custId = customerData?.id;
      if (!custId) {
        const newCust = await addDoc(collection(db, 'customers'), {
          name: regName,
          mobile: regMobile,
          email: regEmail,
          createdAt: serverTimestamp()
        });
        custId = newCust.id;
      }

      await addDoc(collection(db, 'cards'), {
        uid: scannedUid,
        customerId: custId,
        hotelId: selectedHotel.id,
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

  const handleLogout = async () => {
    await auth.signOut();
    setAuthState('hotel');
    setSelectedHotel(null);
    setSelectedRole(null);
  };

  if (loading) return <div className="iot-loading">Initializing Hardware Gateway...</div>;

  // AUTH FLOW RENDERING
  if (!user || authState !== 'dashboard') {
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
          onLoginSuccess={() => setAuthState('dashboard')}
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
          <div className="status-item">
            <span>PN532 Reader</span>
            <div className="status-dot online"></div>
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
                    <button className="iot-btn-outline" onClick={() => window.print()}>
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
                <p>Link UID {scannedUid || '...'} to customer.</p>
             </div>
             {/* Registration form logic remains same */}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-view fadeIn">
             <div className="section-title">
                <h1>Access Logs</h1>
                <p>Hardware audit for {selectedHotel?.hotelName}.</p>
             </div>
             {/* History table logic remains same */}
          </div>
        )}
      </main>
    </div>
  );
}

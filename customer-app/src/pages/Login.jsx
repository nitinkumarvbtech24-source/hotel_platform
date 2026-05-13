import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, setDoc, getDoc, getDocs, query, collection, where, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { Mail, Lock, LogIn, Globe, UserPlus, Phone, User, KeyRound } from 'lucide-react';
import '../index.css';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Forgot Password States
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStage, setForgotStage] = useState(1); // 1: Mobile, 2: OTP, 3: New Pass
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resetUserId, setResetUserId] = useState(null);

  const navigate = useNavigate();

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');

    try {
        let currentUserCred;
      if (isRegister) {
        if (!name.trim() || !mobile.trim()) {
            return setError("Name and Mobile Number are required for registration.");
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        currentUserCred = userCred;
        await setDoc(doc(db, 'users', userCred.user.uid), {
            name,
            mobile,
            email
        });
        localStorage.setItem('customerName', name);
        localStorage.setItem('customerEmail', email);
        localStorage.setItem('customerMobile', mobile);
      } else {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        currentUserCred = userCred;
        // Fetch user profile to get name
        const docSnap = await getDoc(doc(db, 'users', userCred.user.uid));
        if (docSnap.exists()) {
            localStorage.setItem('customerName', docSnap.data().name || 'Customer');
            localStorage.setItem('customerEmail', docSnap.data().email || userCred.user.email);
            localStorage.setItem('customerMobile', docSnap.data().mobile || '');
        } else {
            localStorage.setItem('customerName', 'Customer');
            localStorage.setItem('customerEmail', userCred.user.email);
            localStorage.setItem('customerMobile', '');
        }
      }

      localStorage.setItem('userId', currentUserCred.user.uid);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handleSendOTP = async (e) => {
      e.preventDefault();
      setError('');
      try {
          // Find user by mobile number in Firestore
          const q = query(collection(db, 'users'), where('mobile', '==', mobile));
          const snap = await getDocs(q);
          if (snap.empty) {
              return setError("No user found with this mobile number.");
          }
          setResetUserId(snap.docs[0].id);

          setupRecaptcha();
          const appVerifier = window.recaptchaVerifier;
          // Note: Firebase requires mobile in E.164 format (+91XXXXXXXXXX)
          const formatMobile = mobile.startsWith('+') ? mobile : `+91${mobile}`;
          const confirmation = await signInWithPhoneNumber(auth, formatMobile, appVerifier);
          setConfirmationResult(confirmation);
          setForgotStage(2);
      } catch (err) {
          setError("Failed to send OTP. Please try again. " + err.message);
      }
  };

  const handleVerifyOTP = async (e) => {
      e.preventDefault();
      setError('');
      try {
          await confirmationResult.confirm(otp);
          setForgotStage(3);
      } catch (err) {
          setError("Invalid OTP. Try again.");
      }
  };

  const handleResetPassword = async (e) => {
      e.preventDefault();
      setError('');
      if (newPassword !== confirmPassword) {
          return setError("Passwords do not match.");
      }
      try {
          // The user specifically asked to "update it to firestore database"
          await updateDoc(doc(db, 'users', resetUserId), {
              password: newPassword // Note: Storing plain text password as per explicit user instruction. (Warning: Insecure)
          });
          alert("Password updated successfully in Database!");
          setIsForgotMode(false);
          setForgotStage(1);
          setMobile('');
      } catch (err) {
          setError("Failed to update password.");
      }
  };

  const handleGoogleLogin = async () => {
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      
      // Save or update to Firestore if it's a new google login
      const userRef = doc(db, 'users', userCred.user.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
          await setDoc(userRef, {
              name: userCred.user.displayName,
              email: userCred.user.email,
              mobile: ''
          });
      }

      localStorage.setItem('userId', userCred.user.uid);
      localStorage.setItem('customerName', userCred.user.displayName || 'Customer');
      localStorage.setItem('customerEmail', userCred.user.email);
      localStorage.setItem('customerMobile', docSnap.exists() ? (docSnap.data().mobile || '') : '');
      navigate('/dashboard');
    } catch (err) {
      setError('Google login failed.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="glass"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '3rem 2rem',
          textAlign: 'center'
        }}
      >
        <h2
          style={{
            fontSize: '2rem',
            marginBottom: '0.5rem',
            background:
              'linear-gradient(to right, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}
        >
          {isRegister ? 'Create Account' : 'Welcome Back'}
        </h2>

        <p
          style={{
            color: 'var(--text-muted)',
            marginBottom: '2rem'
          }}
        >
          {isRegister
            ? 'Register to start ordering delicious food.'
            : 'Sign in to continue to Chillax.'}
        </p>

        {error && (
          <div
            style={{
              background: '#fee2e2',
              color: '#ef4444',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.9rem'
            }}
          >
            {error}
          </div>
        )}

        <div id="recaptcha-container"></div>

        {isForgotMode ? (
            // FORGOT PASSWORD FLOW
            <div>
                {forgotStage === 1 && (
                    <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Mobile Number (+91...)" value={mobile} onChange={e => setMobile(e.target.value)} required style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none', background: 'rgba(255,255,255,0.8)' }} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            Send Verification No
                        </button>
                    </form>
                )}
                {forgotStage === 2 && (
                    <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <KeyRound size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} />
                            <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none', background: 'rgba(255,255,255,0.8)' }} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            Verify OTP
                        </button>
                    </form>
                )}
                {forgotStage === 3 && (
                    <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} />
                            <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none', background: 'rgba(255,255,255,0.8)' }} />
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} />
                            <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none', background: 'rgba(255,255,255,0.8)' }} />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                            Save New Password
                        </button>
                    </form>
                )}
                <p onClick={() => { setIsForgotMode(false); setForgotStage(1); setError(''); }} style={{ marginTop: '1.5rem', cursor: 'pointer', color: 'var(--primary)', fontWeight: '600' }}>
                    Back to Login
                </p>
            </div>
        ) : (
            // STANDARD LOGIN/REGISTER FLOW
        <>
        <form
          onSubmit={handleEmailAuth}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {isRegister && (
            <>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none', background: 'rgba(255,255,255,0.8)' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', top: '14px', left: '16px', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} required style={{ width: '100%', padding: '12px 12px 12px 42px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none', background: 'rgba(255,255,255,0.8)' }} />
              </div>
            </>
          )}

          <div style={{ position: 'relative' }}>
            <Mail
              size={18}
              style={{
                position: 'absolute',
                top: '14px',
                left: '16px',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 12px 12px 42px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                outline: 'none',
                background: 'rgba(255,255,255,0.8)'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock
              size={18}
              style={{
                position: 'absolute',
                top: '14px',
                left: '16px',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 12px 12px 42px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                outline: 'none',
                background: 'rgba(255,255,255,0.8)'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem'
            }}
          >
            {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
            {isRegister ? 'Register' : 'Sign In'}
          </button>
        </form>
        
        {!isRegister && (
            <p onClick={() => { setIsForgotMode(true); setError(''); }} style={{ marginTop: '1rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Forgot Password?
            </p>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '1.5rem 0'
          }}
        >
          <hr
            style={{
              flex: 1,
              border: 'none',
              borderTop: '1px solid var(--border)'
            }}
          />
          <span
            style={{
              padding: '0 1rem',
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}
          >
            OR
          </span>
          <hr
            style={{
              flex: 1,
              border: 'none',
              borderTop: '1px solid var(--border)'
            }}
          />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="btn"
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'white',
            border: '1px solid var(--border)'
          }}
        >
          <Globe size={18} color="#4285F4" />
          Continue with Google
        </button>

        <p
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
          style={{
            marginTop: '1.5rem',
            cursor: 'pointer',
            color: 'var(--primary)',
            fontWeight: '600'
          }}
        >
          {isRegister
            ? 'Already have an account? Sign In'
            : "Don't have an account? Register"}
        </p>
        </>
        )}
      </div>
    </div>
  );
}
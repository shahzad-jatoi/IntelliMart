import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Auth.css';

const Register = () => {
  const [step, setStep] = useState(1); // 1: form, 2: OTP verification
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email: form.email });
      setStep(2);
      setSuccess('Verification code sent to ' + form.email);
      // Start countdown for resend
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send verification code');
    } finally { setLoading(false); }
  };

  // Step 2: Verify OTP and complete registration
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', {
        email: form.email,
        otp,
        name: form.name,
        password: form.password,
        role: form.role,
      });
      // Save auth data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      // Redirect based on role
      if (data.role === 'buyer') {
        window.location.href = '/buyer/dashboard';
      } else {
        window.location.href = '/seller/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally { setLoading(false); }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email: form.email });
      setSuccess('New verification code sent');
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon-box">IM</div>
          <h2>{step === 1 ? 'Create Account' : 'Verify Email'}</h2>
          <p>{step === 1
            ? 'Join IntelliMart to start shopping or selling'
            : 'Enter the verification code sent to your email'
          }</p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {success && !error && <div className="auth-success">{success}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <input id="reg-name" type="text" className="form-input" placeholder="John Doe"
                value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" className="form-input" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <input id="reg-password" type="password" className="form-input" placeholder="Min 6 characters"
                value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required minLength={6} />
            </div>
            <div className="form-group">
              <label htmlFor="reg-role">Account Type</label>
              <select id="reg-role" className="form-input" value={form.role}
                onChange={(e) => setForm({...form, role: e.target.value})}>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            </div>
            <button type="submit" className="btn-auth" disabled={loading}>
              {loading ? 'Sending code...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="otp-email-display">
              <span className="otp-email-label">Sending to:</span>
              <span className="otp-email-value">{form.email}</span>
              <button type="button" className="otp-change-email" onClick={() => { setStep(1); setError(''); setSuccess(''); }}>
                Change
              </button>
            </div>
            <div className="form-group">
              <label htmlFor="otp-code">Verification Code</label>
              <input
                id="otp-code"
                type="text"
                className="form-input otp-input"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-auth" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
            <div className="otp-resend">
              {countdown > 0 ? (
                <span className="otp-countdown">Resend code in {countdown}s</span>
              ) : (
                <button type="button" className="otp-resend-btn" onClick={handleResendOtp} disabled={loading}>
                  Resend verification code
                </button>
              )}
            </div>
          </form>
        )}

        <div className="auth-steps">
          <span className={`auth-step ${step >= 1 ? 'active' : ''}`}>1</span>
          <span className="auth-step-line"></span>
          <span className={`auth-step ${step >= 2 ? 'active' : ''}`}>2</span>
        </div>

        <p className="auth-footer">Already have an account? <Link to="/login">Sign In</Link></p>
      </div>
    </div>
  );
};

export default Register;

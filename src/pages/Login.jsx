import React, { useState, useEffect } from 'react';
import logo from '../assets/nexflow-logo.svg';
import { HiEye, HiEyeOff, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [formLoading, setFormLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [pendingToken, setPendingToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    if (!email || !password) {
      setError('Please enter both email and password.');
      setFormLoading(false);
      return;
    }
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const url = '/api/auth/login';
      const fullUrl = url.startsWith('http') ? url : baseUrl.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        navigate('/');
        console.log('Redirecting to /');
      } else {
        const data = await res.json();
        setError(data.message || 'Login failed: No token received.');
      }
    } catch (err) {
      setError('Login failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handle2FAVerify = async () => {
    setTwoFAError('');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const url = '/api/auth/2fa/verify';
      const fullUrl = url.startsWith('http') ? url : baseUrl.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${pendingToken}` },
        body: JSON.stringify({ code: twoFACode }),
      });
      if (!res.ok) throw new Error('Invalid code');
      localStorage.setItem('token', pendingToken);
      setSuccess('Login successful!');
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err) {
      setTwoFAError('Invalid code');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 theme-bg animate-fade-in">
      <div className="card w-full max-w-md bg-base-100 glass shadow-xl p-8 animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="w-16 h-16 mb-2" />
          <h1 className="text-2xl font-bold mb-1 text-gray-300">NexFlow</h1>
          <span className="text-sm text-gray-400 mb-2">Sign in to your account</span>
        </div>
        {toast.message && (
          <div className="toast toast-top toast-center z-50 animate-fade-in" role="status" aria-live="polite">
            <div className={`alert alert-${toast.type} font-semibold`}>{toast.message}</div>
          </div>
        )}
        <form className="card w-96 bg-base-100 glass shadow-xl p-8 space-y-4" onSubmit={handleSubmit} aria-label="Login Form">
          <h2 className="text-2xl font-bold text-center mb-2 text-gray-300">Login</h2>
          {error && <div className="alert alert-error animate-fade-in">{error}</div>}
          {success && <div className="alert alert-success animate-fade-in">{success}</div>}
          <div className="relative mb-4">
            <input
              type="email"
              className={`input input-bordered w-full pt-6 text-gray-100 placeholder-gray-400 bg-gray-800 ${touched.email && !email ? 'input-error' : ''}`}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              required
              aria-label="Email"
              autoComplete="email"
            />
            <label className={`absolute left-3 top-2 text-xs text-gray-400 pointer-events-none transition-all duration-200 ${email ? 'text-indigo-400' : ''}`}>Email</label>
            {touched.email && email && <HiCheckCircle className="absolute right-3 top-6 text-green-400" />}
            {touched.email && !email && <HiExclamationCircle className="absolute right-3 top-6 text-red-400" />}
          </div>
          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`input input-bordered w-full pt-6 text-gray-100 placeholder-gray-400 bg-gray-800 ${touched.password && !password ? 'input-error' : ''}`}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              required
              aria-label="Password"
              autoComplete="current-password"
            />
            <label className={`absolute left-3 top-2 text-xs text-gray-400 pointer-events-none transition-all duration-200 ${password ? 'text-indigo-400' : ''}`}>Password</label>
            <button type="button" className="absolute right-8 top-6 text-gray-400" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label="Toggle password visibility">
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </button>
            {touched.password && password && <HiCheckCircle className="absolute right-3 top-6 text-green-400" />}
            {touched.password && !password && <HiExclamationCircle className="absolute right-3 top-6 text-red-400" />}
          </div>
          <button className="btn btn-primary w-full transition-transform hover:-translate-y-1" type="submit" disabled={formLoading || !email || !password}>
            Login
            {formLoading && <span className="loading loading-spinner loading-md"></span>}
          </button>
          <div className="text-center mt-4">
            <span className="text-sm text-gray-300">New here? <a href="/register" className="text-indigo-400 hover:underline font-semibold">Register now</a></span>
          </div>
          <button type="button" className="text-primary underline mt-2" onClick={() => navigate('/forgot-password')}>Forgot password?</button>
        </form>
        {show2FA && (
          <div className="mt-6 p-4 bg-base-200 rounded-xl">
            <h3 className="font-bold mb-2">Two-Factor Authentication</h3>
            <div className="mb-2">Enter the 6-digit code from your authenticator app:</div>
            <input className="input input-bordered mb-2" value={twoFACode} onChange={e => setTwoFACode(e.target.value)} maxLength={6} />
            <button className="btn btn-primary ml-2" onClick={handle2FAVerify}>Verify & Login</button>
            {twoFAError && <div className="text-danger mt-2">{twoFAError}</div>}
          </div>
        )}
      </div>
    </div>
  );
} 
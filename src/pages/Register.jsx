import React, { useState, useEffect } from 'react';
import axios from 'axios';
import logo from '../assets/nexflow-logo.svg';
import { HiEye, HiEyeOff, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';
import InlineSpinner from '../components/InlineSpinner';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [formLoading, setFormLoading] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFASecret, setTwoFASecret] = useState('');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFAError, setTwoFAError] = useState('');
  const [twoFASuccess, setTwoFASuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('token');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    if (!name || !email || !password) {
      setError('Please fill in all fields.');
      setFormLoading(false);
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', { name, email, password });
      if (res.data && res.data.token) {
        localStorage.setItem('token', res.data.token);
        navigate('/');
      } else {
        setError('Registration failed: No token received.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handle2FAVerify = async () => {
    setTwoFAError('');
    setTwoFASuccess('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: twoFACode }),
      });
      if (!res.ok) throw new Error('Invalid code');
      await fetch('http://localhost:5000/api/auth/2fa/enable', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setTwoFASuccess('2FA enabled!');
      setTimeout(() => navigate('/dashboard'), 1000);
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
          <span className="text-sm text-gray-400 mb-2">Create your account</span>
        </div>
        {toast.message && (
          <div className="toast toast-top toast-center z-50 animate-fade-in" role="status" aria-live="polite">
            <div className={`alert alert-${toast.type} font-semibold`}>{toast.message}</div>
          </div>
        )}
        {error && <div className="alert alert-error animate-fade-in">{error}</div>}
        {success && <div className="alert alert-success animate-fade-in">{success}</div>}
        {show2FA && (
          <div className="mt-6 p-4 bg-base-200 rounded-xl">
            <h3 className="font-bold mb-2">Set up Two-Factor Authentication (2FA)</h3>
            <div className="mb-2">Secret: <span className="font-mono bg-base-100 px-2 py-1 rounded">{twoFASecret}</span></div>
            <div className="mb-2">Enter the 6-digit code from your authenticator app:</div>
            <input className="input input-bordered mb-2" value={twoFACode} onChange={e => setTwoFACode(e.target.value)} maxLength={6} />
            <button className="btn btn-primary ml-2" onClick={handle2FAVerify}>Verify & Enable 2FA</button>
            <button className="btn btn-ghost ml-2" onClick={() => navigate('/dashboard')}>Skip</button>
            {twoFAError && <div className="text-danger mt-2">{twoFAError}</div>}
            {twoFASuccess && <div className="text-success mt-2">{twoFASuccess}</div>}
          </div>
        )}
        <form className="card w-96 bg-base-100 glass shadow-xl p-8 space-y-4" onSubmit={handleSubmit} aria-label="Register Form">
          <div className="relative mb-4">
            <input
              type="text"
              className={`input input-bordered w-full pt-6 text-gray-100 placeholder-gray-400 bg-gray-800 ${touched.name && !name ? 'input-error' : ''}`}
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              required
              aria-label="Name"
              autoComplete="name"
            />
            <label className={`absolute left-3 top-2 text-xs text-gray-400 pointer-events-none transition-all duration-200 ${name ? 'text-indigo-400' : ''}`}>Name</label>
            {touched.name && name && <HiCheckCircle className="absolute right-3 top-6 text-green-400" />}
            {touched.name && !name && <HiExclamationCircle className="absolute right-3 top-6 text-red-400" />}
          </div>
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
              autoComplete="new-password"
            />
            <label className={`absolute left-3 top-2 text-xs text-gray-400 pointer-events-none transition-all duration-200 ${password ? 'text-indigo-400' : ''}`}>Password</label>
            <button type="button" className="absolute right-8 top-6 text-gray-400" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label="Toggle password visibility">
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </button>
            {touched.password && password && <HiCheckCircle className="absolute right-3 top-6 text-green-400" />}
            {touched.password && !password && <HiExclamationCircle className="absolute right-3 top-6 text-red-400" />}
          </div>
          <button className="btn btn-primary w-full transition-transform hover:-translate-y-1" type="submit" disabled={formLoading}>
            Register
            {formLoading && <InlineSpinner size={20} className="inline-block align-middle ml-2" />}
          </button>
          <div className="text-center mt-4">
            <span className="text-sm text-gray-200">Already have an account? <a href="/" className="text-indigo-400 hover:underline font-semibold">Login</a></span>
          </div>
        </form>
      </div>
    </div>
  );
} 
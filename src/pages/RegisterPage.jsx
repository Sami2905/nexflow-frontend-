import React, { useState } from 'react';
import axios from 'axios';
import logo from '../assets/nexflow-logo.svg';
import { HiEye, HiEyeOff, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const url = '/api/auth/register';
      const fullUrl = url;
      await axios.post(fullUrl, { name, email, password });
      setSuccess('Registration successful! You can now log in.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 theme-bg animate-fade-in">
      <div className="card w-full max-w-md bg-base-100 glass shadow-xl p-4 sm:p-8 animate-fade-in">
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="Logo" className="w-16 h-16 mb-2" />
          <h1 className="text-2xl font-bold mb-1">NexFlow</h1>
          <span className="text-sm text-gray-400 mb-2">Create your account</span>
        </div>
        {toast.message && (
          <div className="toast toast-top toast-center z-50 animate-fade-in" role="status" aria-live="polite">
            <div className={`alert alert-${toast.type} font-semibold`}>{toast.message}</div>
          </div>
        )}
        {error && <div className="alert alert-error animate-fade-in">{error}</div>}
        {success && <div className="alert alert-success animate-fade-in">{success}</div>}
        <form className="space-y-4 w-full" onSubmit={handleSubmit} aria-label="Register Form">
          <div className="relative mb-4">
            <input
              type="text"
              className={`input input-bordered w-full pt-6 ${touched.name && !name ? 'input-error' : ''}`}
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, name: true }))}
              required
              aria-label="Name"
              autoComplete="name"
            />
            <label className={`absolute left-3 top-2 text-xs text-gray-400 pointer-events-none transition-all duration-200 ${name ? 'text-indigo-500' : ''}`}>Name</label>
            {touched.name && name && <HiCheckCircle className="absolute right-3 top-6 text-green-400" />}
            {touched.name && !name && <HiExclamationCircle className="absolute right-3 top-6 text-red-400" />}
          </div>
          <div className="relative mb-4">
            <input
              type="email"
              className={`input input-bordered w-full pt-6 ${touched.email && !email ? 'input-error' : ''}`}
              value={email}
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, email: true }))}
              required
              aria-label="Email"
              autoComplete="email"
            />
            <label className={`absolute left-3 top-2 text-xs text-gray-400 pointer-events-none transition-all duration-200 ${email ? 'text-indigo-500' : ''}`}>Email</label>
            {touched.email && email && <HiCheckCircle className="absolute right-3 top-6 text-green-400" />}
            {touched.email && !email && <HiExclamationCircle className="absolute right-3 top-6 text-red-400" />}
          </div>
          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              className={`input input-bordered w-full pt-6 ${touched.password && !password ? 'input-error' : ''}`}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, password: true }))}
              required
              aria-label="Password"
              autoComplete="new-password"
            />
            <label className={`absolute left-3 top-2 text-xs text-gray-400 pointer-events-none transition-all duration-200 ${password ? 'text-indigo-500' : ''}`}>Password</label>
            <button type="button" className="absolute right-8 top-6 text-gray-400" onClick={() => setShowPassword(v => !v)} tabIndex={-1} aria-label="Toggle password visibility">
              {showPassword ? <HiEyeOff /> : <HiEye />}
            </button>
            {touched.password && password && <HiCheckCircle className="absolute right-3 top-6 text-green-400" />}
            {touched.password && !password && <HiExclamationCircle className="absolute right-3 top-6 text-red-400" />}
          </div>
          <button className="btn btn-primary w-full transition-transform hover:-translate-y-1" type="submit">
            Register
            <span className="loading loading-spinner loading-md"></span>
          </button>
          <div className="text-center mt-4">
            <span className="text-sm">Already have an account? <a href="#" className="text-indigo-400 hover:underline">Login</a></span>
          </div>
        </form>
      </div>
    </div>
  );
} 
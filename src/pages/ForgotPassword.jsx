import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InlineSpinner from '../components/InlineSpinner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const baseUrl = import.meta.env.VITE_API_URL || '';
      const url = '/api/auth/forgot-password';
      const fullUrl = url.startsWith('http') ? url : baseUrl.replace(/\/$/, '') + (url.startsWith('/') ? url : '/' + url);
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send reset email');
      setMessage('If that email exists, a reset link was sent.');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <form className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6 space-y-3 w-full max-w-md" onSubmit={handleSubmit} aria-label="Forgot Password Form">
        <h3 className="text-2xl font-bold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Forgot Password</h3>
        {error && <div className="rounded-lg p-4 mb-2 bg-danger text-white font-sans animate-fade-in">{error}</div>}
        {message && <div className="rounded-lg p-4 mb-2 bg-success text-white font-sans animate-fade-in">{message}</div>}
        <input
          type="email"
          name="email"
          placeholder="Your email"
          className="input input-bordered w-full mb-2"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          aria-label="Email"
        />
        <button className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark w-full" type="submit" disabled={loading}>
          {loading ? <><InlineSpinner size={20} className="inline-block align-middle mr-2" />Sending...</> : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
} 
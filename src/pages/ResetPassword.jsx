import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InlineSpinner from '../components/InlineSpinner';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    if (password !== confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reset password');
      setMessage('Password reset! Redirecting to login...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <form className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6 space-y-3 w-full max-w-md" onSubmit={handleSubmit} aria-label="Reset Password Form">
        <h3 className="text-2xl font-bold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Reset Password</h3>
        {error && <div className="rounded-lg p-4 mb-2 bg-danger text-white font-sans animate-fade-in">{error}</div>}
        {message && <div className="rounded-lg p-4 mb-2 bg-success text-white font-sans animate-fade-in">{message}</div>}
        <input
          type="password"
          name="password"
          placeholder="New password"
          className="input input-bordered w-full mb-2"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          aria-label="New password"
        />
        <input
          type="password"
          name="confirm"
          placeholder="Confirm new password"
          className="input input-bordered w-full mb-2"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          aria-label="Confirm new password"
        />
        <button className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark w-full" type="submit" disabled={loading}>
          {loading ? <><InlineSpinner size={20} className="inline-block align-middle mr-2" />Resetting...</> : 'Reset Password'}
        </button>
      </form>
    </div>
  );
} 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import InlineSpinner from '../components/InlineSpinner';

export default function InviteMember() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await authFetch('http://localhost:5000/api/projects/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed to invite member');
      setSuccess('Invitation sent!');
      setTimeout(() => navigate('/projects'), 1500);
    } catch (err) {
      setError('Could not send invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 bg-white dark:bg-card-dark rounded-xl shadow-lg p-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Invite Member</h1>
      <form onSubmit={handleInvite} className="flex flex-col gap-4">
        <input
          type="email"
          className="input input-bordered"
          placeholder="Enter member's email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <InlineSpinner /> : 'Send Invite'}
        </button>
        {error && <div className="text-danger text-sm text-center">{error}</div>}
        {success && <div className="text-success text-sm text-center">{success}</div>}
      </form>
    </div>
  );
} 
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import { io } from 'socket.io-client';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import SpinnerOverlay from '../components/SpinnerOverlay';

export default function ProjectSettings() {
  const { id: projectId } = useParams();
  const [project, setProject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isOwnerOrAdmin = project && project.members && project.members.find(m => m.user?._id === user._id && ['Owner', 'Admin'].includes(m.role));

  const fetchProject = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/projects/${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch project');
      const data = await res.json();
      setProject(data);
      setForm({ name: data.name, description: data.description });
    } catch (err) {
      setError('Could not load project');
      setProject(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (projectId) fetchProject(); }, [projectId]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ['websocket'] });
    socket.on('projectUpdated', updated => {
      if (updated._id === projectId) {
        setProject(updated);
        setForm({ name: updated.name, description: updated.description });
      }
    });
    return () => { socket.disconnect(); };
  }, [projectId]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await authFetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update project');
      const data = await res.json();
      setProject(data);
      setSuccess('Project updated!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Change member role
  const handleRoleChange = async (memberId, newRole) => {
    try {
      const res = await authFetch(`/api/projects/${projectId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      const data = await res.json();
      setProject(data);
    } catch (err) {
      alert(err.message);
    }
  };

  // Invite member by email
  const handleInvite = async e => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    try {
      const res = await authFetch(`/api/projects/${projectId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail }),
      });
      if (!res.ok) throw new Error('Failed to invite');
      const data = await res.json();
      setProject(data);
      setInviteEmail('');
    } catch (err) {
      setInviteError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  // Cancel pending invite
  const handleCancelInvite = async email => {
    // (Assume backend route exists: DELETE /api/projects/:id/invite/:email)
    try {
      const res = await authFetch(`/api/projects/${projectId}/invite/${encodeURIComponent(email)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel invite');
      const data = await res.json();
      setProject(data);
    } catch (err) {
      alert(err.message);
    }
  };

  // Remove member
  const handleRemoveMember = async userId => {
    // (Assume backend route exists: DELETE /api/projects/:id/members/:userId)
    try {
      const res = await authFetch(`/api/projects/${projectId}/members/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove member');
      const data = await res.json();
      setProject(data);
    } catch (err) {
      alert(err.message);
    }
  };

  // Transfer ownership
  const handleTransferOwnership = async () => {
    setTransferLoading(true);
    try {
      const res = await authFetch(`/api/projects/${projectId}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOwnerId: transferTo }),
      });
      if (!res.ok) throw new Error('Failed to transfer ownership');
      const data = await res.json();
      setProject(data);
      setTransferTo('');
    } catch (err) {
      alert(err.message);
    } finally {
      setTransferLoading(false);
    }
  };

  if (loading) return <SpinnerOverlay message="Loading project settings..." />;
  if (error) return <div className="p-8 text-center text-danger">{error}</div>;
  if (!project) return <div className="p-8 text-center text-danger">Project not found.</div>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Project Settings</h2>
      <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-border-light dark:border-border-dark p-6 mb-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1" htmlFor="projectName">Project Name</label>
            <input
              id="projectName"
              className="input input-bordered w-full"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              disabled={saving}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-1" htmlFor="projectDescription">Description</label>
            <textarea
              id="projectDescription"
              className="textarea textarea-bordered w-full"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              disabled={saving}
              rows={3}
            />
          </div>
          <button className="btn btn-primary w-full" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          {success && <div className="text-success mt-2">{success}</div>}
          {error && <div className="text-danger mt-2">{error}</div>}
        </form>
      </div>
      {/* Team Members Section */}
      {project.members && (
        <div className="rounded-2xl bg-white dark:bg-gray-900 shadow-xl border border-border-light dark:border-border-dark p-6 mb-8">
          <h3 className="text-lg font-bold mb-4">Team Members</h3>
          <ul className="space-y-3 mb-4">
            {project.members.map(m => (
              <li key={m.user?._id || m.user?.email} className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                <Avatar name={m.user?.name || m.user?.email} size={7} />
                <div className="flex-1">
                  <div className="font-semibold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-2">
                    {m.user?.name || m.user?.email}
                    <Badge label={m.role} type="role" />
                  </div>
                  <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark">{m.user?.email}</div>
                </div>
                {isOwnerOrAdmin && m.role !== 'Owner' && (
                  <>
                    <select className="select select-xs" value={m.role} onChange={e => handleRoleChange(m.user._id, e.target.value)}>
                      {['Admin', 'Manager', 'Member', 'Viewer'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <button className="btn btn-xs btn-error ml-2" onClick={() => handleRemoveMember(m.user._id)}>Remove</button>
                  </>
                )}
              </li>
            ))}
          </ul>
          {/* Pending Invites */}
          {project.pendingInvites && project.pendingInvites.length > 0 && (
            <div className="mb-4">
              <h4 className="font-semibold mb-2">Pending Invites</h4>
              <ul className="space-y-2">
                {project.pendingInvites.map(inv => (
                  <li key={inv.email} className="flex items-center gap-2">
                    <span className="text-textPrimary-light dark:text-textPrimary-dark">{inv.email}</span>
                    <button className="btn btn-xs btn-ghost" onClick={() => handleCancelInvite(inv.email)}>Cancel</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Invite Form */}
          {isOwnerOrAdmin && (
            <form className="flex gap-2 mb-4" onSubmit={handleInvite}>
              <input className="input input-bordered flex-1" type="email" placeholder="Invite by email..." value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required disabled={inviteLoading} />
              <button className="btn btn-primary" type="submit" disabled={inviteLoading}>{inviteLoading ? 'Inviting...' : 'Invite'}</button>
              {inviteError && <div className="text-danger text-xs ml-2">{inviteError}</div>}
            </form>
          )}
          {/* Transfer Ownership */}
          {isOwnerOrAdmin && project.members.some(m => m.role !== 'Owner') && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Transfer Ownership</h4>
              <div className="flex gap-2 items-center">
                <select className="select select-xs" value={transferTo} onChange={e => setTransferTo(e.target.value)}>
                  <option value="">Select new owner</option>
                  {project.members.filter(m => m.role !== 'Owner').map(m => (
                    <option key={m.user._id} value={m.user._id}>{m.user?.name || m.user?.email}</option>
                  ))}
                </select>
                <button className="btn btn-xs btn-warning" onClick={handleTransferOwnership} disabled={!transferTo || transferLoading}>{transferLoading ? 'Transferring...' : 'Transfer'}</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
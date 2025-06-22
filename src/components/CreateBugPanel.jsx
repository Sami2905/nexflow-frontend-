import React, { useState, useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { authFetch } from '../utils/authFetch';

export default function CreateBugPanel({ open, onClose, onSuccess, projects = [], users = [] }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Open',
    project: '',
    assignedTo: '',
    tags: ''
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm({ title: '', description: '', priority: 'Medium', status: 'Open', project: '', assignedTo: '', tags: '' });
      setFormError('');
      setFormLoading(false);
      setTimeout(() => {
        if (panelRef.current) panelRef.current.focus();
      }, 100);
    }
  }, [open]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const res = await authFetch('http://localhost:5000/api/bugs', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(',').map(tag => tag.trim()) : []
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create bug');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-all duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      aria-modal="true" role="dialog">
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-label="Close panel"
      />
      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`relative h-full w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl border-l border-border-light dark:border-border-dark p-8 flex flex-col transition-transform transition-opacity duration-300 ${open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
        style={{ minWidth: 360 }}
      >
        <button
          className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-danger focus:outline-none"
          onClick={onClose}
          aria-label="Close panel"
        >
          <FaTimes />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-textPrimary-light dark:text-textPrimary-dark">Create New Bug</h2>
        {formError && <div className="rounded-lg p-3 mb-3 bg-danger text-white animate-fade-in">{formError}</div>}
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex gap-4">
            <input
              type="text"
              name="title"
              placeholder="Title *"
              className="input input-bordered flex-1"
              value={form.title}
              onChange={handleChange}
              required
            />
            <select
              name="priority"
              className="input input-bordered w-36"
              value={form.priority}
              onChange={handleChange}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <textarea
            name="description"
            placeholder="Description *"
            className="textarea textarea-bordered min-h-[80px]"
            value={form.description}
            onChange={handleChange}
            required
          />
          <div className="flex gap-4">
            <select
              name="status"
              className="input input-bordered flex-1"
              value={form.status}
              onChange={handleChange}
            >
              <option>Open</option>
              <option>In Progress</option>
              <option>Closed</option>
            </select>
            <select
              name="project"
              className="input input-bordered flex-1"
              value={form.project}
              onChange={handleChange}
              required
            >
              <option value="">Select Project</option>
              {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
            <select
              name="assignedTo"
              className="input input-bordered flex-1"
              value={form.assignedTo}
              onChange={handleChange}
            >
              <option value="">Unassigned</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name || u.email}</option>)}
            </select>
          </div>
          <input
            type="text"
            name="tags"
            placeholder="Enter tags separated by commas"
            className="input input-bordered"
            value={form.tags}
            onChange={handleChange}
          />
          <div className="flex gap-4 mt-4">
            <button
              className="btn btn-primary flex-1"
              type="submit"
              disabled={formLoading}
            >
              {formLoading ? 'Creating...' : 'Create Bug'}
            </button>
            <button
              className="btn btn-ghost flex-1"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
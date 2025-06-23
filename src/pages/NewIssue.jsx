import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import InlineSpinner from '../components/InlineSpinner';

export default function NewIssue() {
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium', project: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await authFetch('/api/projects');
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        setProjects(data);
      } catch {}
    };
    fetchProjects();
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const res = await authFetch('/api/bugs', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create issue');
      }
      navigate('/dashboard');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6">
      <form className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6 space-y-3 w-full max-w-md" onSubmit={handleSubmit} aria-label="New Issue Form">
        <h3 className="text-2xl font-bold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Create New Issue</h3>
        {formError && <div className="rounded-lg p-4 mb-2 bg-danger text-white font-sans animate-fade-in">{formError}</div>}
        <input
          type="text"
          name="title"
          placeholder="Issue Title"
          className="input input-bordered w-full mb-2"
          value={form.title}
          onChange={handleChange}
          required
          aria-label="Issue Title"
        />
        <textarea
          name="description"
          placeholder="Description"
          className="textarea textarea-bordered w-full mb-2"
          value={form.description}
          onChange={handleChange}
          aria-label="Issue Description"
        />
        <select
          name="priority"
          className="input input-bordered w-full mb-2"
          value={form.priority}
          onChange={handleChange}
          aria-label="Priority"
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <select
          name="project"
          className="input input-bordered w-full mb-2"
          value={form.project}
          onChange={handleChange}
          aria-label="Project"
          required
        >
          <option value="">Select Project</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <button className="bg-accent text-white px-4 py-2 rounded font-semibold hover:bg-green-600 w-full" type="submit" disabled={formLoading}>
          {formLoading ? <><InlineSpinner size={20} className="inline-block align-middle mr-2" />Creating...</> : 'Create Issue'}
        </button>
      </form>
    </div>
  );
} 
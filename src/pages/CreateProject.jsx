import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import InlineSpinner from '../components/InlineSpinner';

export default function CreateProject() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        navigate('/projects');
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to create project.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 animate-fade-in-fast">
      <div className="max-w-2xl mx-auto bg-surface-light dark:bg-surface-dark p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6">Create New Project</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-500 text-white p-3 rounded-md mb-4">{error}</div>}
          
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Project Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-input-light dark:bg-input-dark rounded-md border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 bg-input-light dark:bg-input-dark rounded-md border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? <><InlineSpinner size={20} className="inline-block align-middle mr-2" />Creating...</> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
import React, { useEffect, useState } from 'react';
import { HiPencil, HiTrash, HiCheck, HiX, HiExclamation, HiFlag } from 'react-icons/hi';
import DashboardCard from '../components/DashboardCard.jsx';
import TicketCard from '../components/TicketCard.jsx';
import { authFetch } from '../utils/authFetch';
import { io } from 'socket.io-client';

const STATUS_OPTIONS = ['Open', 'In Progress', 'Closed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'priority', label: 'Priority' },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState('');

  const [bugs, setBugs] = useState([]);
  const [loadingBugs, setLoadingBugs] = useState(true);
  const [bugsError, setBugsError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Open',
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'Medium', status: 'Open' });
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const [successMsg, setSuccessMsg] = useState('');

  // Filtering and sorting
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Add state for toast
  const [toast, setToast] = useState({ type: '', message: '' });

  // Filtering and sorting logic
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectFilter, setProjectFilter] = useState('');

  // Add search bar above bug list
  const [searchTerm, setSearchTerm] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoadingUser(true);
      setUserError('');
      try {
        const res = await authFetch('/api/auth/me');
        if (!res.ok) throw new Error('Failed to fetch user info');
        const data = await res.json();
        setUser(data);
      } catch (err) {
        setUserError('Could not load user info');
      } finally {
        setLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const fetchBugs = async () => {
    setLoadingBugs(true);
    setBugsError('');
    try {
      const res = await authFetch('/api/bugs');
      if (!res.ok) throw new Error('Failed to fetch bugs');
      const data = await res.json();
      setBugs(data.bugs || []);
    } catch (err) {
      setBugsError('Could not load bugs');
    } finally {
      setLoadingBugs(false);
    }
  };
  useEffect(() => { fetchBugs(); }, []);

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create bug');
      }
      setForm({ title: '', description: '', priority: 'Medium', status: 'Open' });
      setToast({ type: 'success', message: 'Bug created successfully!' });
      fetchBugs();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteLoading(id);
    setDeleteError('');
    try {
      const res = await authFetch(`/api/bugs/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to delete bug');
      }
      setToast({ type: 'success', message: 'Bug deleted successfully!' });
      fetchBugs();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleteLoading('');
      setDeleteConfirmId(null);
    }
  };

  const handleEditStart = (bug) => {
    setEditId(bug._id);
    setEditForm({
      title: bug.title,
      description: bug.description,
      priority: bug.priority,
      status: bug.status,
    });
    setEditError('');
  };

  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (id) => {
    setEditLoading(true);
    setEditError('');
    try {
      const res = await authFetch(`/api/bugs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update bug');
      }
      setEditId(null);
      setToast({ type: 'success', message: 'Bug updated successfully!' });
      fetchBugs();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditError('');
  };

  useEffect(() => {
    if (toast.message) {
      const timer = setTimeout(() => setToast({ type: '', message: '' }), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await authFetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setProjects([]);
    } finally {
      setLoadingProjects(false);
    }
  };
  useEffect(() => { fetchProjects(); }, []);

  const filteredBugs = bugs
    .filter(bug => (filterStatus ? bug.status === filterStatus : true))
    .filter(bug => (filterPriority ? bug.priority === filterPriority : true))
    .filter(bug => (projectFilter ? String(bug.project?._id || bug.project) === projectFilter : true));

  const sortedBugs = [...filteredBugs].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'priority') {
      const order = { High: 1, Medium: 2, Low: 3 };
      return order[a.priority] - order[b.priority];
    }
    return 0;
  });

  // Dashboard stats
  const totalBugs = sortedBugs.length;
  const openBugs = sortedBugs.filter(b => b.status === 'Open').length;
  const closedBugs = sortedBugs.filter(b => b.status === 'Closed').length;
  const highPriorityBugs = sortedBugs.filter(b => b.priority === 'High').length;

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ['websocket'] });
    socket.on('connect', () => {
      console.log('Connected to Socket.io server');
    });
    socket.on('bugCreated', () => {
      fetchBugs();
    });
    socket.on('bugUpdated', () => {
      fetchBugs();
    });
    socket.on('bugDeleted', () => {
      fetchBugs();
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="container mx-auto p-4">

      {toast.message && (
        <div className={`fixed top-5 right-5 p-4 rounded-lg shadow-lg text-white ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.message}
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Total Bugs" value={totalBugs} />
        <DashboardCard title="Open" value={openBugs} />
        <DashboardCard title="Closed" value={closedBugs} />
        <DashboardCard title="High Priority" value={highPriorityBugs} />
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Bugs</h2>
        <button onClick={() => setCreateModalOpen(true)} className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600">
          Create Bug
        </button>
      </div>
      
      {/* Create Bug Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg">
            <h3 className="text-xl font-semibold mb-4">Create New Bug</h3>
            <form onSubmit={handleSubmit}>
              {formError && <div className="rounded-lg p-4 mb-4 bg-danger text-white font-sans animate-fade-in">{formError}</div>}
              <input
                type="text"
                name="title"
                placeholder="Title"
                className="input input-bordered w-full"
                value={form.title}
                onChange={handleChange}
                required
              />
              <textarea
                name="description"
                placeholder="Description"
                className="textarea textarea-bordered w-full"
                value={form.description}
                onChange={handleChange}
                required
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  name="priority"
                  className="select select-bordered flex-1"
                  value={form.priority}
                  onChange={handleChange}
                >
                  {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <select
                  name="status"
                  className="select select-bordered flex-1"
                  value={form.status}
                  onChange={handleChange}
                >
                  {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost" type="button" onClick={() => setCreateModalOpen(false)}>Cancel</button>
                <button className="bg-primary text-white px-4 py-2 rounded shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-primary/50 transition" type="submit" disabled={formLoading}>{formLoading ? <span className="loading loading-spinner loading-md"></span> : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <select className="select select-sm select-bordered text-gray-900 bg-white" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select className="select select-sm select-bordered text-gray-900 bg-white" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
          <option value="">All Priorities</option>
          {PRIORITY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search bugs"
          className="input input-bordered w-full md:w-auto"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Bug list */}
      {loadingBugs ? (
        <div className="text-center text-gray-500 dark:text-gray-300">Loading bugs...</div>
      ) : bugsError ? (
        <div className="rounded-lg p-4 mb-4 bg-danger text-white font-sans animate-fade-in">{bugsError}</div>
      ) : sortedBugs.length === 0 ? (
        <div className="text-center text-gray-400">No bugs found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedBugs.map(bug => (
            <TicketCard 
              key={bug._id} 
              ticket={bug} 
              onEdit={() => handleEditStart(bug)} 
              onDelete={() => setDeleteConfirmId(bug._id)} 
            />
          ))}
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
            <p className="my-4">Are you sure you want to delete this bug?</p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded">Cancel</button>
              <button 
                onClick={() => handleDelete(deleteConfirmId)} 
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                disabled={!!deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 
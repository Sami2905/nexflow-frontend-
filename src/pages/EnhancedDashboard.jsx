import React, { useEffect, useState, useCallback, useRef } from 'react';
import { HiPencil, HiTrash, HiPlus, HiEye, HiDownload, HiRefresh, HiUserAdd, HiBriefcase } from 'react-icons/hi';
import { FaBug } from 'react-icons/fa';
import AdvancedSearch from '../components/AdvancedSearch';
import DashboardCard from '../components/DashboardCard';
import Toast from '../components/Toast';
import { authFetch } from '../utils/authFetch';
import { useNavigate } from 'react-router-dom';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend, TimeScale, ArcElement, PointElement, LineElement, BarController } from 'chart.js';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import CreateBugPanel from '../components/CreateBugPanel';
import SpinnerOverlay from '../components/SpinnerOverlay';
import ProjectBugsChart from '../components/ProjectBugsChart';
import ActivityTrendChart from '../components/ActivityTrendChart';
import TopContributorsChart from '../components/TopContributorsChart';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, TimeScale, ArcElement, PointElement, LineElement, BarController);

const STATUS_OPTIONS = ['Open', 'In Progress', 'Closed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'title', label: 'Title' }
];

// Utility: Export array of objects as CSV
function exportToCSV(data, filename) {
  if (!data.length) return;
  const replacer = (key, value) => value === null || value === undefined ? '' : value;
  const header = Object.keys(data[0]);
  const csv = [
    header.join(','),
    ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
  ].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

// Utility: Export table as PDF
function exportToPDF(data, filename) {
  const doc = new jsPDF();
  if (!data.length) return;
  const header = Object.keys(data[0]);
  const rows = data.map(row => header.map(h => row[h]));
  doc.autoTable({ head: [header], body: rows });
  doc.save(filename);
}

export default function EnhancedDashboard() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [userError, setUserError] = useState('');

  const [bugs, setBugs] = useState([]);
  const [loadingBugs, setLoadingBugs] = useState(true);
  const [bugsError, setBugsError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 });

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingSearches, setLoadingSearches] = useState(true);

  const [currentSearch, setCurrentSearch] = useState({});
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Form states
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

  // Edit states
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState('');

  // Add activity state
  const [activity, setActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const [initialLoad, setInitialLoad] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const navigate = useNavigate();

  // Dropdown state for +Create
  const [createOpen, setCreateOpen] = useState(false);
  const createBtnRef = useRef();
  const handleCreateSelect = (path) => {
    setCreateOpen(false);
    navigate(path);
  };

  // Dropdown state for Export Data
  const [exportOpen, setExportOpen] = useState(false);
  const exportBtnRef = useRef();

  // Close dropdown on outside click
  useEffect(() => {
    if (!exportOpen) return;
    function handleClick(e) {
      if (exportBtnRef.current && !exportBtnRef.current.contains(e.target)) {
        setExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [exportOpen]);

  // Fetch user info (top-level function for reuse)
  const fetchUser = async (showLoading = true) => {
    if (showLoading) setLoadingUser(true);
    setUserError('');
    try {
      const res = await authFetch('/api/auth/me');
      if (!res.ok) throw new Error('Failed to fetch user info');
      const data = await res.json();
      setUser(data);
    } catch (err) {
      setUserError('Could not load user info');
    } finally {
      if (showLoading) setLoadingUser(false);
    }
  };

  // Fetch projects (top-level function for reuse)
  const fetchProjects = async (showLoading = true) => {
    if (showLoading) setLoadingProjects(true);
    try {
      const res = await authFetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setProjects([]);
    } finally {
      if (showLoading) setLoadingProjects(false);
    }
  };

  // Fetch users (top-level function for reuse)
  const fetchUsers = async (showLoading = true) => {
    if (showLoading) setLoadingUsers(true);
    try {
      const res = await authFetch('/api/auth/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setUsers([]);
    } finally {
      if (showLoading) setLoadingUsers(false);
    }
  };

  // Fetch saved searches (top-level function for reuse)
  const fetchSavedSearches = async (showLoading = true) => {
    if (showLoading) setLoadingSearches(true);
    try {
      const res = await authFetch('/api/saved-searches');
      if (!res.ok) throw new Error('Failed to fetch saved searches');
      const data = await res.json();
      setSavedSearches(data);
    } catch (err) {
      setSavedSearches([]);
    } finally {
      if (showLoading) setLoadingSearches(false);
    }
  };

  // Fetch bugs with search parameters
  const fetchBugs = useCallback(async (searchParams = {}, showLoading = true) => {
    console.log('fetchBugs called with showLoading:', showLoading, 'searchParams:', searchParams);
    if (showLoading) setLoadingBugs(true);
    setBugsError('');
    try {
      const queryParams = new URLSearchParams({
        page: searchParams.page || 1,
        limit: searchParams.limit || 20,
        sortBy: searchParams.sortBy || 'createdAt',
        sortOrder: searchParams.sortOrder || 'desc',
        ...searchParams
      });
      const res = await authFetch(`/api/bugs?${queryParams}`);
      if (!res.ok) throw new Error('Failed to fetch bugs');
      const data = await res.json();
      setBugs(data.bugs || data);
      setPagination(data.pagination || { total: data.length, page: 1, limit: 20, pages: 1 });
    } catch (err) {
      setBugsError('Could not load bugs');
      console.error('fetchBugs error:', err);
    } finally {
      if (showLoading) {
        setLoadingBugs(false);
        console.log('fetchBugs: setLoadingBugs(false) called');
      }
    }
  }, []);

  // Initial fetch (show spinner)
  useEffect(() => {
    const fetchAll = async () => {
      setInitialLoad(true);
      await Promise.all([
        fetchUser(),
        fetchProjects(),
        fetchUsers(),
        fetchSavedSearches(),
        fetchBugs(currentSearch, true),
      ]);
      setInitialLoad(false);
    };
    fetchAll();
    // eslint-disable-next-line
  }, []);

  // Polling effect for real-time sync (background, no spinner)
  useEffect(() => {
    const poll = () => {
      fetchUser(false);
      fetchProjects(false);
      fetchUsers(false);
      fetchSavedSearches(false);
      fetchBugs(currentSearch, false);
      setLastUpdated(Date.now());
    };
    const interval = setInterval(poll, 20000); // 20 seconds
    return () => clearInterval(interval);
  }, [currentSearch]);

  // Search handler
  const handleSearch = useCallback((searchParams) => {
    // Only update if searchParams are different
    if (JSON.stringify(searchParams) !== JSON.stringify(currentSearch)) {
      setCurrentSearch(searchParams);
      fetchBugs(searchParams);
    }
  }, [fetchBugs, currentSearch]);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setCurrentSearch({});
    fetchBugs();
  }, [fetchBugs]);

  // Save search
  const handleSaveSearch = async (searchConfig) => {
    try {
      const res = await authFetch('/api/saved-searches', {
        method: 'POST',
        body: JSON.stringify(searchConfig),
      });
      if (!res.ok) throw new Error('Failed to save search');
      // Refresh saved searches
      const searchesRes = await authFetch('/api/saved-searches');
      if (searchesRes.ok) {
        const data = await searchesRes.json();
        setSavedSearches(data);
      }
      addToast('Search saved successfully!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Load search
  const handleLoadSearch = (savedSearch) => {
    const searchParams = {
      q: savedSearch.searchTerm,
      ...savedSearch.filters
    };
    handleSearch(searchParams);
    addToast(`Loaded search: ${savedSearch.name}`, 'info');
  };

  // Toast management
  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  // Form handlers
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const res = await authFetch('/api/bugs', {
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
      setForm({
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Open',
        project: '',
        assignedTo: '',
        tags: ''
      });
      setShowCreatePanel(false);
      fetchBugs(currentSearch);
      addToast('Bug created successfully!', 'success');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Edit handlers
  const handleEditStart = (bug) => {
    setEditId(bug._id);
    setEditForm({
      title: bug.title,
      description: bug.description,
      priority: bug.priority,
      status: bug.status,
      project: bug.project?._id || '',
      assignedTo: bug.assignedTo?._id || '',
      tags: bug.tags?.join(', ') || ''
    });
    setEditError('');
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError('');
    try {
      const res = await authFetch(`/api/bugs/${editId}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editForm,
          tags: editForm.tags ? editForm.tags.split(',').map(tag => tag.trim()) : []
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update bug');
      }
      setEditId(null);
      fetchBugs(currentSearch);
      addToast('Bug updated successfully!', 'success');
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

  // Delete handler
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this bug?')) return;
    
    setDeleteLoading(id);
    try {
      const res = await authFetch(`/api/bugs/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete bug');
      
      fetchBugs(currentSearch);
      addToast('Bug deleted successfully!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeleteLoading('');
    }
  };

  // Dashboard stats
  const totalBugs = pagination.total;
  const openBugs = bugs.filter(b => b.status === 'Open').length;
  const closedBugs = bugs.filter(b => b.status === 'Closed').length;
  const highPriorityBugs = bugs.filter(b => b.priority === 'High').length;

  // Add activity
  useEffect(() => {
    const fetchActivity = async () => {
      setLoadingActivity(true);
      try {
        const res = await authFetch('/api/activity');
        if (!res.ok) throw new Error('Failed to fetch activity');
        const data = await res.json();
        setActivity(data.slice(0, 8)); // Show latest 8
      } catch {
        setActivity([]);
      } finally {
        setLoadingActivity(false);
      }
    };
    fetchActivity();
  }, []);

  // Prepare data for bugs by status chart
  const bugsByStatus = STATUS_OPTIONS.map(status => bugs.filter(b => b.status === status).length);
  const chartData = {
    labels: STATUS_OPTIONS,
    datasets: [
      {
        label: 'Bugs by Status',
        data: bugsByStatus,
        backgroundColor: [
          'rgba(59,130,246,0.7)', // blue
          'rgba(251,191,36,0.7)', // yellow
          'rgba(34,197,94,0.7)',  // green
        ],
        borderRadius: 8,
      },
    ],
  };
  const handleChartClick = (event, elements, chart) => {
    if (elements.length > 0) {
      const idx = elements[0].index;
      const status = STATUS_OPTIONS[idx];
      handleSearch({ ...currentSearch, status });
      addToast(`Filtered by status: ${status}`, 'info');
    }
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    animation: {
      duration: 1200,
      easing: 'easeOutBounce',
    },
    onClick: (event, elements, chart) => handleChartClick(event, elements, chart),
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
    },
  };

  // Pie chart data (status distribution)
  const pieData = {
    labels: STATUS_OPTIONS,
    datasets: [
      {
        data: bugsByStatus,
        backgroundColor: [
          'rgba(59,130,246,0.7)',
          'rgba(251,191,36,0.7)',
          'rgba(34,197,94,0.7)',
        ],
        borderWidth: 2,
      },
    ],
  };
  const pieOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true } },
    animation: { animateScale: true, duration: 1200 },
  };

  // Line chart data (bugs created per day, last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const bugsPerDay = last7Days.map(date => bugs.filter(b => b.createdAt && b.createdAt.startsWith(date)).length);
  const lineData = {
    labels: last7Days,
    datasets: [
      {
        label: 'Bugs Created',
        data: bugsPerDay,
        fill: false,
        borderColor: 'rgba(59,130,246,1)',
        backgroundColor: 'rgba(59,130,246,0.3)',
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 8,
      },
    ],
  };
  const lineOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
    animation: { duration: 1200, easing: 'easeInOutQuart' },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
  };

  // Stacked bar chart (bugs by priority per status)
  const priorities = PRIORITY_OPTIONS;
  const bugsByPriorityStatus = priorities.map(priority => STATUS_OPTIONS.map(status => bugs.filter(b => b.priority === priority && b.status === status).length));
  const stackedBarData = {
    labels: STATUS_OPTIONS,
    datasets: priorities.map((priority, i) => ({
      label: priority,
      data: bugsByPriorityStatus[i],
      backgroundColor: [
        'rgba(251,191,36,0.7)', // Low
        'rgba(59,130,246,0.7)', // Medium
        'rgba(239,68,68,0.7)',  // High
      ][i],
      stack: 'Stack 0',
    })),
  };
  const stackedBarOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' }, tooltip: { enabled: true } },
    animation: { duration: 1200, easing: 'easeInOutCubic' },
    scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
  };

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUser(),
      fetchProjects(),
      fetchUsers(),
      fetchSavedSearches(),
      fetchBugs(currentSearch, true),
    ]);
    setLastUpdated(Date.now());
    setRefreshing(false);
  };

  // Debug: log loading states after each fetch
  useEffect(() => {
    console.log('DEBUG loading states:', {
      initialLoad,
      loadingUser,
      loadingProjects,
      loadingBugs,
      loadingUsers,
      loadingSearches,
    });
  }, [initialLoad, loadingUser, loadingProjects, loadingBugs, loadingUsers, loadingSearches]);

  // Add export handlers
  const handleExportBugsCSV = () => {
    if (!bugs.length) return;
    exportToCSV(bugs, 'bugs.csv');
  };
  const handleExportBugsPDF = () => {
    if (!bugs.length) return;
    exportToPDF(bugs, 'bugs.pdf');
  };
  const handleExportProjectsCSV = () => {
    if (!projects.length) return;
    exportToCSV(projects, 'projects.csv');
  };
  const handleExportProjectsPDF = () => {
    if (!projects.length) return;
    exportToPDF(projects, 'projects.pdf');
  };

  // Drilldown: handle Pie chart click
  const handlePieClick = (event, elements) => {
    if (elements.length > 0) {
      const idx = elements[0].index;
      const status = STATUS_OPTIONS[idx];
      handleSearch({ ...currentSearch, status });
      addToast(`Filtered by status: ${status}`, 'info');
    }
  };

  if (initialLoad || loadingUser || loadingProjects || loadingBugs) {
    console.log('DEBUG stuck loading:', { initialLoad, loadingUser, loadingProjects, loadingBugs });
    return <SpinnerOverlay message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center">
      <div className="w-full max-w-6xl px-4 py-8 mx-auto">
        {/* Toasts */}
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}

        {/* Header & Quick Actions */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative">
          <div>
            <h1 className="text-4xl font-extrabold text-textPrimary-light dark:text-textPrimary-dark mb-2">Enhanced Dashboard</h1>
            <p className="text-lg text-textSecondary-light dark:text-textSecondary-dark">Advanced bug tracking with powerful search and filtering capabilities</p>
          </div>
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <div className="relative" ref={exportBtnRef}>
              <button
                className="btn btn-sm btn-outline flex items-center gap-1"
                onClick={() => setExportOpen(v => !v)}
                aria-haspopup="menu"
                aria-expanded={exportOpen}
                aria-label="Export Data"
                tabIndex={0}
              >
                Export Data
                <svg className="ml-1 w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {exportOpen && (
                <ul className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-lg z-50 animate-fade-in-fast" role="menu" aria-label="Export Options">
                  <li><button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => { handleExportBugsCSV(); setExportOpen(false); }} role="menuitem">Export Bugs CSV</button></li>
                  <li><button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => { handleExportBugsPDF(); setExportOpen(false); }} role="menuitem">Export Bugs PDF</button></li>
                  <li><button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => { handleExportProjectsCSV(); setExportOpen(false); }} role="menuitem">Export Projects CSV</button></li>
                  <li><button className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => { handleExportProjectsPDF(); setExportOpen(false); }} role="menuitem">Export Projects PDF</button></li>
                </ul>
              )}
            </div>
          </div>
          <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1 md:absolute md:right-0 md:top-full md:mt-0 md:mr-2">
            Last updated: {Math.floor((Date.now() - lastUpdated) / 1000)}s ago
          </div>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="transition transform hover:scale-110 hover:shadow-2xl cursor-pointer rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 flex flex-col items-center animate-fade-in" onClick={() => handleSearch({})} tabIndex={0} aria-label="Show all bugs" role="button" data-tooltip-id="total-bugs-tooltip">
            <span className="text-4xl mb-2">🐛</span>
            <div className="text-lg font-bold">{totalBugs}</div>
            <div className="text-sm">Total Bugs</div>
            <ReactTooltip id="total-bugs-tooltip" place="top" content="All bugs across your projects" />
          </div>
          <div className="transition transform hover:scale-110 hover:shadow-2xl cursor-pointer rounded-xl bg-gradient-to-br from-yellow-300 to-yellow-500 text-white p-6 flex flex-col items-center animate-fade-in" onClick={() => handleSearch({ status: 'Open' })} tabIndex={0} aria-label="Show open bugs" role="button" data-tooltip-id="open-bugs-tooltip">
            <span className="text-4xl mb-2">📋</span>
            <div className="text-lg font-bold">{openBugs}</div>
            <div className="text-sm">Open</div>
            <ReactTooltip id="open-bugs-tooltip" place="top" content="Bugs that are currently open" />
          </div>
          <div className="transition transform hover:scale-110 hover:shadow-2xl cursor-pointer rounded-xl bg-gradient-to-br from-green-400 to-green-600 text-white p-6 flex flex-col items-center animate-fade-in" onClick={() => handleSearch({ status: 'Closed' })} tabIndex={0} aria-label="Show closed bugs" role="button" data-tooltip-id="closed-bugs-tooltip">
            <span className="text-4xl mb-2">✅</span>
            <div className="text-lg font-bold">{closedBugs}</div>
            <div className="text-sm">Closed</div>
            <ReactTooltip id="closed-bugs-tooltip" place="top" content="Bugs that have been closed" />
          </div>
          <div className="transition transform hover:scale-110 hover:shadow-2xl cursor-pointer rounded-xl bg-gradient-to-br from-red-400 to-red-600 text-white p-6 flex flex-col items-center animate-fade-in" onClick={() => handleSearch({ priority: 'High' })} tabIndex={0} aria-label="Show high priority bugs" role="button" data-tooltip-id="high-priority-tooltip">
            <span className="text-4xl mb-2">🚨</span>
            <div className="text-lg font-bold">{highPriorityBugs}</div>
            <div className="text-sm">High Priority</div>
            <ReactTooltip id="high-priority-tooltip" place="top" content="Bugs marked as high priority" />
          </div>
        </div>
        {/* Project Summaries & Bugs by Status Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Project Summaries */}
          <div className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Project Summaries</h2>
            {loadingProjects ? (
              <div className="flex items-center gap-2"><span className="loading loading-spinner loading-md"></span> Loading projects...</div>
            ) : projects.length === 0 ? (
              <div className="text-textSecondary-light dark:text-textSecondary-dark italic">No projects found.</div>
            ) : (
              <ul className="divide-y divide-border-light dark:divide-border-dark">
                {projects.map((p, i) => {
                  const projectBugs = bugs.filter(b => b.project === p._id || b.project?._id === p._id);
                  const open = projectBugs.filter(b => b.status === 'Open').length;
                  const closed = projectBugs.filter(b => b.status === 'Closed').length;
                  return (
                    <li key={p._id || i} className="py-3 flex flex-col md:flex-row md:items-center md:gap-4">
                      <div className="font-semibold text-textPrimary-light dark:text-textPrimary-dark flex-1">{p.name}</div>
                      <div className="flex gap-2 text-sm mb-2 md:mb-0">
                        <span className="badge badge-info">Open: {open}</span>
                        <span className="badge badge-success">Closed: {closed}</span>
                      </div>
                      <div className="flex -space-x-2">
                        {(p.members || []).slice(0, 4).map((m, idx) => (
                          <span key={m._id || idx} className="rounded-full bg-primary text-white w-7 h-7 flex items-center justify-center font-bold text-xs border-2 border-white dark:border-card-dark" title={m.name || m.email}>{m.name ? m.name[0] : m.email ? m.email[0] : 'U'}</span>
                        ))}
                        {p.members && p.members.length > 4 && (
                          <span className="rounded-full bg-gray-400 text-white w-7 h-7 flex items-center justify-center font-bold text-xs border-2 border-white dark:border-card-dark">+{p.members.length - 4}</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {/* Bugs by Status Chart */}
          <div className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6 flex flex-col items-center justify-center">
            <h2 className="text-lg font-semibold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Bugs by Status</h2>
            <div className="w-full h-64 flex items-center justify-center">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
        {/* Additional Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Pie Chart */}
          <div className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6 flex flex-col items-center animate-fade-in">
            <h2 className="text-lg font-semibold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Bug Status Distribution</h2>
            <div className="w-full h-64 flex items-center justify-center">
              <Pie data={pieData} options={{ ...pieOptions, onClick: handlePieClick }} />
            </div>
          </div>
          {/* Line Chart */}
          <div className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6 flex flex-col items-center animate-fade-in">
            <h2 className="text-lg font-semibold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Bugs Created (Last 7 Days)</h2>
            <div className="w-full h-64 flex items-center justify-center">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
          {/* Stacked Bar Chart */}
          <div className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6 flex flex-col items-center animate-fade-in">
            <h2 className="text-lg font-semibold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Bugs by Priority & Status</h2>
            <div className="w-full h-64 flex items-center justify-center">
              <Bar data={stackedBarData} options={stackedBarOptions} />
            </div>
          </div>
        </div>
        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Recent Activity</h2>
          <div className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6">
            {loadingActivity ? (
              <div className="flex items-center gap-2"><span className="loading loading-spinner loading-md"></span> Loading activity...</div>
            ) : activity.length === 0 ? (
              <div className="text-textSecondary-light dark:text-textSecondary-dark italic">No recent activity.</div>
            ) : (
              <ul className="divide-y divide-border-light dark:divide-border-dark">
                {activity.map((a, i) => (
                  <li key={a._id || i} className="flex items-center gap-3 py-3">
                    <span className="rounded-full bg-primary text-white w-10 h-10 flex items-center justify-center font-bold text-lg" title={a.user?.name || a.user?.email}>{a.user?.name ? a.user.name[0] : a.user?.email ? a.user.email[0] : 'U'}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">{a.user?.name || a.user?.email || 'User'}</div>
                      <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">{a.message}</div>
                    </div>
                    <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mb-8">
          <ProjectBugsChart />
        </div>
        <div className="mb-8">
          <ActivityTrendChart />
        </div>
        <div className="mb-8">
          <TopContributorsChart />
        </div>
      </div>

      {/* Create Bug Panel */}
      <CreateBugPanel
        open={showCreatePanel}
        onClose={() => setShowCreatePanel(false)}
        onSuccess={() => { fetchBugs(currentSearch); addToast('Bug created successfully!', 'success'); }}
        projects={projects}
        users={users}
      />

      {/* Edit Bug Modal */}
      {editId && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Edit Bug</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleEditSave(); }} className="space-y-4">
              {editError && (
                <div className="alert alert-error">
                  <span>{editError}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Title *</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    className="input input-bordered w-full"
                    value={editForm.title || ''}
                    onChange={handleEditChange}
                    required
                  />
                </div>
                
                <div>
                  <label className="label">
                    <span className="label-text">Priority</span>
                  </label>
                  <select
                    name="priority"
                    className="select select-bordered w-full"
                    value={editForm.priority || ''}
                    onChange={handleEditChange}
                  >
                    {PRIORITY_OPTIONS.map(priority => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Description *</span>
                </label>
                <textarea
                  name="description"
                  className="textarea textarea-bordered w-full h-24"
                  value={editForm.description || ''}
                  onChange={handleEditChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">
                    <span className="label-text">Status</span>
                  </label>
                  <select
                    name="status"
                    className="select select-bordered w-full"
                    value={editForm.status || ''}
                    onChange={handleEditChange}
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Project</span>
                  </label>
                  <select
                    name="project"
                    className="select select-bordered w-full"
                    value={editForm.project || ''}
                    onChange={handleEditChange}
                  >
                    <option value="">Select Project</option>
                    {projects.map(project => (
                      <option key={project._id} value={project._id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    <span className="label-text">Assignee</span>
                  </label>
                  <select
                    name="assignedTo"
                    className="select select-bordered w-full"
                    value={editForm.assignedTo || ''}
                    onChange={handleEditChange}
                  >
                    <option value="">Unassigned</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name || user.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  <span className="label-text">Tags</span>
                </label>
                <input
                  type="text"
                  name="tags"
                  className="input input-bordered w-full"
                  value={editForm.tags || ''}
                  onChange={handleEditChange}
                  placeholder="Enter tags separated by commas"
                />
              </div>

              <div className="modal-action">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={editLoading}
                >
                  {editLoading ? (
                    <>
                      <div className="loading loading-spinner loading-sm"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleEditCancel}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clear Filter Button */}
      {Object.keys(currentSearch).length > 0 && (
        <button className="btn btn-xs btn-outline mb-4" onClick={handleClearSearch}>Clear Filter</button>
      )}
    </div>
  );
} 
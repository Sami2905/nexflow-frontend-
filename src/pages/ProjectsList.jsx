import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import SpinnerOverlay from '../components/SpinnerOverlay';
import InlineSpinner from '../components/InlineSpinner';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale } from 'chart.js';
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale);

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const formRef = useRef(null);
  const navigate = useNavigate();
  const [bugCounts, setBugCounts] = useState({});

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data);
      // Fetch bug counts for each project
      const bugCountsObj = {};
      await Promise.all(data.map(async (project) => {
        try {
          const statsRes = await authFetch(`/api/bugs/stats?project=${project._id}`);
          if (statsRes.ok) {
            const stats = await statsRes.json();
            bugCountsObj[project._id] = stats.total;
          } else {
            bugCountsObj[project._id] = 0;
          }
        } catch {
          bugCountsObj[project._id] = 0;
        }
      }));
      setBugCounts(bugCountsObj);
    } catch (err) {
      setError('Could not load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async e => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      const res = await authFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create project');
      }
      setForm({ name: '', description: '' });
      setSuccessMsg('Project created successfully!');
      fetchProjects();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleCreateProjectClick = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      formRef.current.querySelector('input')?.focus();
    }
  };

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  // --- Project Analytics ---
  const statusCounts = projects.reduce((acc, p) => { acc[p.status || 'Active'] = (acc[p.status || 'Active'] || 0) + 1; return acc; }, {});
  const memberCounts = {};
  projects.forEach(p => {
    const count = (p.members && p.members.length) || 0;
    memberCounts[count] = (memberCounts[count] || 0) + 1;
  });
  const createdCounts = {};
  projects.forEach(p => {
    const date = new Date(p.createdAt).toLocaleDateString();
    createdCounts[date] = (createdCounts[date] || 0) + 1;
  });
  const createdLabels = Object.keys(createdCounts).sort((a, b) => new Date(a) - new Date(b));
  const createdData = createdLabels.map(date => createdCounts[date]);

  // --- Chart Data ---
  const statusData = {
    labels: Object.keys(statusCounts),
    datasets: [{
      data: Object.values(statusCounts),
      backgroundColor: ['#3b82f6', '#22c55e', '#facc15', '#ef4444'],
      borderWidth: 1,
    }],
  };
  const memberData = {
    labels: Object.keys(memberCounts).map(c => `${c} Members`),
    datasets: [{
      label: 'Projects by Member Count',
      data: Object.values(memberCounts),
      backgroundColor: ['#a78bfa', '#facc15', '#3b82f6', '#22c55e'],
      borderWidth: 1,
    }],
  };
  const createdChartData = {
    labels: createdLabels,
    datasets: [{
      label: 'Projects Created',
      data: createdData,
      fill: true,
      backgroundColor: 'rgba(59,130,246,0.2)',
      borderColor: '#3b82f6',
      tension: 0.3,
    }],
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans transition-colors duration-300 p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark">Projects</h1>
      </div>
      {loading ? (
        <SpinnerOverlay message="Loading projects..." />
      ) : error ? (
        <div className="rounded-lg p-4 mb-4 bg-danger text-white font-sans animate-fade-in">{error}</div>
      ) : projects.length === 0 ? (
        <div className="text-center text-textSecondary-light dark:text-textSecondary-dark">No projects found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map(project => (
            <div
              key={project._id}
              className="rounded-xl p-6 bg-card-light dark:bg-card-dark shadow text-textPrimary-light dark:text-textPrimary-dark cursor-pointer hover:shadow-lg transition"
              onClick={() => navigate(`/projects/${project._id}`)}
              tabIndex={0}
              aria-label={`Project: ${project.name}`}
            >
              <div className="text-lg font-semibold mb-2">{project.name}</div>
              <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">{project.description}</div>
              <div className="flex gap-2 mt-2">
                <span className="bg-accent text-white text-xs px-2 py-1 rounded-full">{bugCounts[project._id] === undefined ? '...' : bugCounts[project._id]} Bugs</span>
                <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">{(project.members?.length || 0)} Members</span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-card-dark rounded-xl shadow p-4 flex flex-col items-center">
          <h2 className="font-semibold mb-2">Status Distribution</h2>
          <Doughnut data={statusData} className="w-full max-w-xs" />
        </div>
        <div className="bg-white dark:bg-card-dark rounded-xl shadow p-4 flex flex-col items-center">
          <h2 className="font-semibold mb-2">Projects by Member Count</h2>
          <Bar data={memberData} className="w-full max-w-xs" options={{ plugins: { legend: { display: false } } }} />
        </div>
        <div className="bg-white dark:bg-card-dark rounded-xl shadow p-4 flex flex-col items-center">
          <h2 className="font-semibold mb-2">Projects Created Over Time</h2>
          <Line data={createdChartData} className="w-full max-w-xs" options={{ plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Date' } }, y: { title: { display: true, text: 'Projects' }, beginAtZero: true } } }} />
        </div>
      </div>
    </div>
  );
} 
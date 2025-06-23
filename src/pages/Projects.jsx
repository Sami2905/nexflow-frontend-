import React, { useEffect, useState } from 'react';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale } from 'chart.js';
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale);
import SpinnerOverlay from '../components/SpinnerOverlay';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ assignee: '', priority: '', status: '', from: '', to: '', tags: '' });
  const [customFilters, setCustomFilters] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        setProjects(data.projects || data);
      } catch (err) {
        setError('Could not load projects');
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

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
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
      <h1 className="text-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-8">Projects</h1>
      {loading ? (
        <SpinnerOverlay message="Loading projects..." />
      ) : error ? (
        <div className="rounded-lg p-4 mb-4 bg-danger text-white font-sans animate-fade-in">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          {/* Project Table or List can go here */}
        </>
      )}
    </div>
  );
} 
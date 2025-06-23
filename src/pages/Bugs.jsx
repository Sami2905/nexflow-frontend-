import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import { BadgeCheck, Bug, User, ChevronDown, ChevronUp } from 'lucide-react';
import InlineSpinner from '../components/InlineSpinner';
import SpinnerOverlay from '../components/SpinnerOverlay';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale } from 'chart.js';
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, TimeScale);

function relativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Bugs() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupBy, setGroupBy] = useState('none');

  useEffect(() => {
    const fetchBugs = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authFetch('/api/bugs');
        if (!res.ok) throw new Error('Failed to fetch bugs');
        const data = await res.json();
        setBugs(data.bugs || data);
      } catch (err) {
        setError('Could not load bugs');
      } finally {
        setLoading(false);
      }
    };
    fetchBugs();
  }, []);

  // Grouping stub (future: implement grouping logic)
  const groupedBugs = groupBy === 'none' ? [{ group: '', bugs }] : [];

  // --- Bug Analytics ---
  const statusCounts = bugs.reduce((acc, bug) => { acc[bug.status] = (acc[bug.status] || 0) + 1; return acc; }, {});
  const priorityCounts = bugs.reduce((acc, bug) => { acc[bug.priority] = (acc[bug.priority] || 0) + 1; return acc; }, {});
  const createdCounts = {};
  bugs.forEach(bug => {
    const date = new Date(bug.createdAt).toLocaleDateString();
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
  const priorityData = {
    labels: Object.keys(priorityCounts),
    datasets: [{
      label: 'Bugs by Priority',
      data: Object.values(priorityCounts),
      backgroundColor: ['#ef4444', '#facc15', '#a78bfa'],
      borderWidth: 1,
    }],
  };
  const createdChartData = {
    labels: createdLabels,
    datasets: [{
      label: 'Bugs Created',
      data: createdData,
      fill: true,
      backgroundColor: 'rgba(59,130,246,0.2)',
      borderColor: '#3b82f6',
      tension: 0.3,
    }],
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-2">
          <Bug className="inline-block text-accent" size={28} /> Bugs
        </h1>
        <div className="flex gap-2 items-center">
          <span className="text-sm text-textSecondary-light dark:text-textSecondary-dark">Group by:</span>
          <button className={`btn btn-xs ${groupBy==='none' ? 'btn-primary' : 'btn-outline'}`} onClick={()=>setGroupBy('none')}>None</button>
          <button className={`btn btn-xs ${groupBy==='project' ? 'btn-primary' : 'btn-outline'}`} onClick={()=>setGroupBy('project')}>Project</button>
          <button className={`btn btn-xs ${groupBy==='priority' ? 'btn-primary' : 'btn-outline'}`} onClick={()=>setGroupBy('priority')}>Priority</button>
        </div>
      </div>
      {loading ? (
        <SpinnerOverlay message="Loading bugs..." />
      ) : error ? (
        <div className="rounded-lg p-4 mb-4 bg-danger text-white font-sans animate-fade-in">{error}</div>
      ) : (
        <div className="bg-white dark:bg-card-dark rounded-2xl shadow-lg p-6 overflow-x-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-card-dark rounded-xl shadow p-4 flex flex-col items-center">
              <h2 className="font-semibold mb-2">Status Distribution</h2>
              <Doughnut data={statusData} className="w-full max-w-xs" />
            </div>
            <div className="bg-white dark:bg-card-dark rounded-xl shadow p-4 flex flex-col items-center">
              <h2 className="font-semibold mb-2">Bugs by Priority</h2>
              <Bar data={priorityData} className="w-full max-w-xs" options={{ plugins: { legend: { display: false } } }} />
            </div>
            <div className="bg-white dark:bg-card-dark rounded-xl shadow p-4 flex flex-col items-center">
              <h2 className="font-semibold mb-2">Bugs Created Over Time</h2>
              <Line data={createdChartData} className="w-full max-w-xs" options={{ plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Date' } }, y: { title: { display: true, text: 'Bugs' }, beginAtZero: true } } }} />
            </div>
          </div>
          <table className="table w-full text-center border-separate border-spacing-y-2">
            <thead className="sticky top-0 bg-background-light dark:bg-background-dark z-10">
              <tr className="text-lg font-semibold text-textPrimary-light dark:text-textPrimary-dark">
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bugs.map((bug, idx) => (
                <tr key={bug._id} className={`transition duration-200 ${idx % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-900'} hover:shadow-md hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer`}>
                  <td className="py-3 px-2 text-base leading-tight max-w-xs truncate text-left">
                    <div className="font-semibold truncate">{bug.title}</div>
                    <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark truncate max-w-xs">{bug.description}</div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${bug.status === 'Open' ? 'bg-blue-100 text-blue-700' : bug.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{bug.status}</span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${bug.priority === 'High' ? 'bg-red-100 text-red-700' : bug.priority === 'Low' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'}`}>{bug.priority}</span>
                  </td>
                  <td className="py-3 px-2 max-w-xs truncate">
                    {bug.project ? (
                      <div className="text-sm truncate">
                        <div className="font-medium truncate">{bug.project.name}</div>
                        <div className="text-textSecondary-light dark:text-textSecondary-dark truncate max-w-xs">{bug.project.description}</div>
                      </div>
                    ) : (
                      <span className="text-textSecondary-light dark:text-textSecondary-dark">No Project</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <button className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-800 rounded-full text-blue-700 dark:text-blue-200 font-medium hover:underline flex items-center gap-1">
                      <User size={14} /> {bug.assignedTo ? (bug.assignedTo.name || bug.assignedTo.email) : 'Unassigned'}
                    </button>
                  </td>
                  <td className="py-3 px-2">
                    <div className="text-sm">{relativeTime(bug.createdAt)}</div>
                  </td>
                  <td className="py-3 px-2">
                    <button className="btn btn-xs btn-outline" title="Edit"><BadgeCheck size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 
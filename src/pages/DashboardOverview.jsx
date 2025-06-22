import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

export default function DashboardOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, highPriority: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authFetch('http://localhost:5000/api/bugs/stats');
        if (!res.ok) throw new Error('Failed to fetch bug stats');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError('Could not load bug stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      setActivityLoading(true);
      setActivityError('');
      try {
        const res = await authFetch('http://localhost:5000/api/activity');
        if (!res.ok) throw new Error('Failed to fetch activity');
        const data = await res.json();
        setActivity(data.slice(0, 10));
      } catch (err) {
        setActivityError('Failed to load recent activity.');
      } finally {
        setActivityLoading(false);
      }
    };
    fetchActivity();
  }, []);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans transition-colors duration-300 p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-1">Dashboard Overview</h1>
          <p className="text-textSecondary-light dark:text-textSecondary-dark">Quick summary of all projects and bugs.</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark" onClick={() => navigate('/projects')}>View All Projects</button>
          <button className="bg-accent text-white px-4 py-2 rounded font-semibold hover:bg-green-600" onClick={() => navigate('/bugs/report')}>+ Report Bug</button>
        </div>
      </div>
      <div className="mb-8">
        <label className="text-sm font-medium text-textSecondary-light dark:text-textSecondary-dark mr-2">Project:</label>
        <select className="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded px-3 py-2 text-textPrimary-light dark:text-textPrimary-dark">
          <option>All Projects</option>
          <option>Project A</option>
          <option>Project B</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="rounded-xl p-6 bg-card-light dark:bg-card-dark shadow text-textPrimary-light dark:text-textPrimary-dark">
          <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">Total Bugs</div>
          <div className="text-3xl font-bold">{loading ? '...' : error ? '-' : stats.total}</div>
        </div>
        <div className="rounded-xl p-6 bg-card-light dark:bg-card-dark shadow text-textPrimary-light dark:text-textPrimary-dark">
          <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">Open</div>
          <div className="text-3xl font-bold">{loading ? '...' : error ? '-' : stats.open}</div>
        </div>
        <div className="rounded-xl p-6 bg-card-light dark:bg-card-dark shadow text-textPrimary-light dark:text-textPrimary-dark">
          <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">Closed</div>
          <div className="text-3xl font-bold">{loading ? '...' : error ? '-' : stats.closed}</div>
        </div>
        <div className="rounded-xl p-6 bg-card-light dark:bg-card-dark shadow text-textPrimary-light dark:text-textPrimary-dark">
          <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark mb-2">High Priority</div>
          <div className="text-3xl font-bold">{loading ? '...' : error ? '-' : stats.highPriority}</div>
        </div>
      </div>
      {error && <div className="rounded-lg p-4 mb-4 bg-danger text-white font-sans animate-fade-in">{error}</div>}
      <div className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6 text-textPrimary-light dark:text-textPrimary-dark">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {activityLoading ? (
          <div className="text-textSecondary-light dark:text-textSecondary-dark italic">Loading recent activity...</div>
        ) : activityError ? (
          <div className="text-red-600 p-2">{activityError}</div>
        ) : activity.length === 0 ? (
          <div className="text-textSecondary-light dark:text-textSecondary-dark italic">No recent activity yet.</div>
        ) : (
          <ul className="space-y-2">
            {activity.map((a, idx) => (
              <li key={a._id || idx} className="border-b border-border-light dark:border-border-dark pb-2">
                <div className="font-semibold">{a.type.replace(/_/g, ' ')}</div>
                <div className="text-sm">{a.message}</div>
                <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark">{new Date(a.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 
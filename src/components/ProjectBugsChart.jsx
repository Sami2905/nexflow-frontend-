import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import SpinnerOverlay from './SpinnerOverlay';
import { authFetch } from '../utils/authFetch';

export default function ProjectBugsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authFetch('/api/bugs/project-stats');
        if (!res.ok) throw new Error('Failed to fetch bug stats');
        const stats = await res.json();
        setData(stats);
      } catch (err) {
        setError('Failed to load bug stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <SpinnerOverlay message="Loading bug stats..." />;
  if (error) return <div className="text-red-600 p-4">{error}</div>;
  if (!data.length) return <div className="p-4 text-center text-text-secondary-light dark:text-text-secondary-dark">No bug data available.</div>;

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-text-primary-light dark:text-text-primary-dark">Bugs per Project</h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 24 }}>
          <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" interval={0} height={60} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="open" stackId="a" fill="#f59e42" name="Open Bugs" />
          <Bar dataKey="closed" stackId="a" fill="#22c55e" name="Closed Bugs" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 
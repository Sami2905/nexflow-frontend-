import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import SpinnerOverlay from './SpinnerOverlay';
import { authFetch } from '../utils/authFetch';

export default function ActivityTrendChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrends = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authFetch('/api/activity/trends');
        if (!res.ok) throw new Error('Failed to fetch activity trends');
        const trends = await res.json();
        setData(trends);
      } catch (err) {
        setError('Failed to load activity trends.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrends();
  }, []);

  if (loading) return <SpinnerOverlay message="Loading activity trends..." />;
  if (error) return <div className="text-red-600 p-4">{error}</div>;
  if (!data.length) return <div className="p-4 text-center text-text-secondary-light dark:text-text-secondary-dark">No activity data available.</div>;

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-text-primary-light dark:text-text-primary-dark">Project Activity Trend (Last 30 Days)</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-15} textAnchor="end" interval={4} height={60} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} name="Activity Count" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 
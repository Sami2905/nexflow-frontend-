import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts';
import SpinnerOverlay from './SpinnerOverlay';
import { authFetch } from '../utils/authFetch';

export default function TopContributorsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContributors = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await authFetch('http://localhost:5000/api/activity/top-contributors');
        if (!res.ok) throw new Error('Failed to fetch top contributors');
        const contributors = await res.json();
        setData(contributors);
      } catch (err) {
        setError('Failed to load top contributors.');
      } finally {
        setLoading(false);
      }
    };
    fetchContributors();
  }, []);

  if (loading) return <SpinnerOverlay message="Loading top contributors..." />;
  if (error) return <div className="text-red-600 p-4">{error}</div>;
  if (!data.length) return <div className="p-4 text-center text-text-secondary-light dark:text-text-secondary-dark">No contributor data available.</div>;

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4 text-text-primary-light dark:text-text-primary-dark">Top Contributors</h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 16, right: 24, left: 0, bottom: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 14 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#6366f1" name="Activity Count">
            <LabelList dataKey="count" position="right" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 
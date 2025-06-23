import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HiOutlineChartPie, HiOutlineFire, HiOutlineCheckCircle, HiOutlineCollection } from 'react-icons/hi';
import { authFetch } from '../utils/authFetch';
// Assuming a separate component for the bug creation/edit modal
// import BugModal from './BugModal'; 

const StatCard = ({ title, value, icon, colorClass }) => (
  <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark flex items-center gap-4">
    <div className={`p-3 rounded-full ${colorClass}`}>
      {React.createElement(icon, { className: "h-6 w-6 text-white" })}
    </div>
    <div>
      <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">{title}</p>
      <p className="text-3xl font-semibold text-text-primary-light dark:text-text-primary-dark">{value}</p>
    </div>
  </div>
);

export default function DashboardPage() {
  const { user } = useOutletContext();
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, highPriority: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await authFetch('http://localhost:5000/api/bugs/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats", error);
      } finally {
        setLoading(false);
      }
    };
    // We'll need to create this /api/bugs/stats endpoint
    // fetchStats();
    setLoading(false); // For now, let's use dummy data
  }, []);
  
  return (
    <div className="animate-fade-in-fast">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">Dashboard</h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          Welcome back, {user?.name || 'User'}. Here's a high-level overview of your projects.
        </p>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark h-28 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Bugs" value={stats.total} icon={HiOutlineCollection} colorClass="bg-blue-500" />
          <StatCard title="Open" value={stats.open} icon={HiOutlineFire} colorClass="bg-yellow-500" />
          <StatCard title="Closed" value={stats.closed} icon={HiOutlineCheckCircle} colorClass="bg-green-500" />
          <StatCard title="High Priority" value={stats.highPriority} icon={HiOutlineChartPie} colorClass="bg-red-500" />
        </div>
      )}
      
      {/* A placeholder for future charts or activity feeds */}
      <div className="mt-8 bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
        <h2 className="text-xl font-semibold mb-4">Activity Feed</h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">Future home for charts and activity logs.</p>
      </div>
    </div>
  );
} 
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import { io } from 'socket.io-client';
import Avatar from '../components/Avatar';
import { FaBug, FaUsers, FaCog, FaCommentDots } from 'react-icons/fa';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import SpinnerOverlay from '../components/SpinnerOverlay';

export default function ActivityView() {
  const { id: projectId } = useParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`http://localhost:5000/api/projects/${projectId}/activity`);
      if (!res.ok) throw new Error('Failed to fetch activity logs');
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      setError('Could not load activity logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (projectId) fetchLogs(); }, [projectId]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ['websocket'] });
    socket.on('projectActivity', activity => {
      if (activity.project === projectId) setLogs(logs => [activity, ...logs]);
    });
    return () => { socket.disconnect(); };
  }, [projectId]);

  // Activity type to icon/color
  const activityTypeMap = {
    bug_created: { icon: <FaBug className="text-info text-lg" />, color: 'bg-blue-500' },
    bug_updated: { icon: <FaBug className="text-warning text-lg" />, color: 'bg-yellow-400' },
    bug_deleted: { icon: <FaBug className="text-danger text-lg" />, color: 'bg-red-500' },
    comment_added: { icon: <FaCommentDots className="text-primary text-lg" />, color: 'bg-primary' },
    member_added: { icon: <FaUsers className="text-success text-lg" />, color: 'bg-green-500' },
    member_removed: { icon: <FaUsers className="text-danger text-lg" />, color: 'bg-red-500' },
    project_created: { icon: <FaCog className="text-info text-lg" />, color: 'bg-blue-500' },
    project_updated: { icon: <FaCog className="text-warning text-lg" />, color: 'bg-yellow-400' },
    project_deleted: { icon: <FaCog className="text-danger text-lg" />, color: 'bg-red-500' },
    default: { icon: <HiOutlineExclamationCircle className="text-gray-400 text-lg" />, color: 'bg-gray-400' },
  };

  if (loading) return <SpinnerOverlay message="Loading activity..." />;
  if (error) return <div className="p-8 text-center text-danger">{error}</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Project Activity Log</h2>
      {logs.length === 0 ? (
        <div className="text-textSecondary-light dark:text-textSecondary-dark">No activity yet for this project.</div>
      ) : (
        <ul className="space-y-4 relative">
          {/* Timeline vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/30 to-transparent rounded-full pointer-events-none" style={{ zIndex: 0 }} />
          {logs.map((log, i) => {
            const typeInfo = activityTypeMap[log.type] || activityTypeMap.default;
            return (
              <li key={log._id} className="relative flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-gray-900 shadow border border-border-light dark:border-border-dark group transition hover:shadow-lg">
                {/* Timeline dot */}
                <span className={`absolute left-0 top-6 -ml-2 w-4 h-4 rounded-full border-4 border-white dark:border-gray-900 ${typeInfo.color} shadow`} style={{ zIndex: 2 }}></span>
                {/* Icon */}
                <span className="mt-1">{typeInfo.icon}</span>
                {/* Avatar */}
                <Avatar name={log.user?.name || log.user?.email || 'User'} size={7} />
                <div className="flex-1">
                  <div className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">{log.user?.name || log.user?.email || 'User'}</div>
                  <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">{log.message}</div>
                  <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1">{log.type.replace('_', ' ')} • {new Date(log.createdAt).toLocaleString()}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { useParams, NavLink, Outlet } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

const TABS = [
  { name: 'Board', to: '.' },
  { name: 'List', to: 'list' },
  { name: 'Activity', to: 'activity' },
  { name: 'Settings', to: 'settings' },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`/api/projects/${id}`);
        if (res.ok) {
          setProject(await res.json());
        } else {
          // Handle not found or not authorized
          setProject(null);
        }
      } catch (error) {
        console.error("Failed to fetch project", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
        <div className="flex space-x-8 border-b border-border-light dark:border-border-dark mb-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!project) {
    return <div>Project not found or you don't have access.</div>;
  }

  return (
    <div className="animate-fade-in-fast">
      {/* Project Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">{project.name}</h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">{project.description}</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-border-light dark:border-border-dark">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {TABS.map((tab) => (
            <NavLink
              key={tab.name}
              to={tab.to}
              end // Important for the root tab to not stay active
              className={({ isActive }) =>
                classNames(
                  isActive
                    ? 'border-primary text-primary font-semibold'
                    : 'border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:border-gray-300 dark:hover:border-gray-500',
                  'whitespace-nowrap py-4 px-1 border-b-4 font-medium text-sm transition-colors duration-200'
                )
              }
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Outlet for nested routes (Board, List, etc.) */}
      <Outlet context={{ project }} />
    </div>
  );
} 
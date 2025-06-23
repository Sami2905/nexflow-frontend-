import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiOutlineUsers, HiOutlineCollection, HiPlus } from 'react-icons/hi';
import { authFetch } from '../utils/authFetch';
import SpinnerOverlay from '../components/SpinnerOverlay';
import InlineSpinner from '../components/InlineSpinner';
import ProjectTable from '../components/ProjectTable';

const ProjectCard = ({ project, onDelete }) => {
  const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

  return (
    <div className="block bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between h-full">
      <div onClick={() => window.location.href = `/projects/${project._id}` } style={{ cursor: 'pointer' }}>
        <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">{project.name}</h3>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4 h-10 overflow-hidden">{project.description}</p>
        <div className="flex items-center justify-between text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
            <div className="flex items-center gap-2">
                <HiOutlineCollection className="h-5 w-5" />
                <span>{project.totalBugs} Bugs</span>
            </div>
            <div className="flex items-center gap-2">
                <HiOutlineUsers className="h-5 w-5" />
                <span>{project.members.length} Members</span>
            </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border-light dark:border-border-dark">
        <div className="flex items-center -space-x-2">
          {project.members.slice(0, 4).map(member => (
            <div key={member.user?._id || member._id} title={member.user?.name} className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold border-2 border-surface-light dark:border-surface-dark">
              {getInitials(member.user?.name)}
            </div>
          ))}
          {project.members.length > 4 && (
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold border-2 border-surface-light dark:border-surface-dark">
              +{project.members.length - 4}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={e => { e.stopPropagation(); onDelete(project._id); }} className="text-red-500 hover:text-red-700 font-semibold text-sm px-2 py-1 rounded transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [view, setView] = useState('grid'); // 'grid' or 'table'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const res = await authFetch('/api/projects');
        
        if (res.ok) {
          const data = await res.json();
          setProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch projects", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  const handleDelete = async (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      const res = await authFetch(`/api/projects/${deleteId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setProjects(projects.filter(p => p._id !== deleteId));
        setDeleteId(null);
      } else {
        const errData = await res.json();
        setDeleteError(errData.message || 'Failed to delete project.');
      }
    } catch (err) {
      setDeleteError('An unexpected error occurred.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="animate-fade-in-fast">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">Projects</h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">Select a project to view its bugs, board, and settings.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView(view === 'grid' ? 'table' : 'grid')}
            className="px-3 py-2 border rounded-md text-sm font-medium bg-surface-light dark:bg-surface-dark hover:bg-surface-light/80 dark:hover:bg-surface-dark/80"
          >
            {view === 'grid' ? 'Table View' : 'Grid View'}
          </button>
          <button
            onClick={() => navigate('/projects/create')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
          >
            <HiPlus /> New Project
          </button>
        </div>
      </div>
      {loading ? (
        <SpinnerOverlay message="Loading projects..." />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <ProjectCard key={project._id} project={project} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <ProjectTable projects={projects} onDelete={handleDelete} />
      )}
      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Delete Project</h3>
            <p>Are you sure you want to delete this project? This action cannot be undone.</p>
            {deleteError && <div className="bg-red-500 text-white p-2 rounded mt-2">{deleteError}</div>}
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 rounded border">Cancel</button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                disabled={deleteLoading}
              >
                {deleteLoading ? <><InlineSpinner size={18} className="inline-block align-middle mr-2" />Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
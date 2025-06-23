import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HiChevronUp, HiChevronDown, HiStar, HiOutlineStar, HiUserAdd, HiArchive, HiTrash, HiX } from 'react-icons/hi';
import { authFetch } from '../utils/authFetch';

const columns = [
  { key: 'name', label: 'Project Name' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'members', label: 'Members' },
  { key: 'bugs', label: 'Bugs' },
  { key: 'createdAt', label: 'Created Date' },
];

export default function ProjectTable({ projects, onDelete }) {
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filter, setFilter] = useState('');
  const [favoriteIds, setFavoriteIds] = useState([]); // Local favorite state
  const [selectedIds, setSelectedIds] = useState([]); // Bulk selection state
  const [addMemberProjectId, setAddMemberProjectId] = useState(null);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [addMemberError, setAddMemberError] = useState('');
  const [addMemberSuccess, setAddMemberSuccess] = useState('');
  const [archiveLoadingIds, setArchiveLoadingIds] = useState([]);
  const [archiveError, setArchiveError] = useState('');
  const [bulkArchiveLoading, setBulkArchiveLoading] = useState(false);
  const [bulkArchiveError, setBulkArchiveError] = useState('');
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState('');

  const filteredProjects = useMemo(() => {
    return projects.filter(p =>
      p.name.toLowerCase().includes(filter.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(filter.toLowerCase())
    );
  }, [projects, filter]);

  const sortedProjects = useMemo(() => {
    const sorted = [...filteredProjects];
    sorted.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'status':
          aValue = (a.status || 'Active').toLowerCase();
          bValue = (b.status || 'Active').toLowerCase();
          break;
        case 'members':
          aValue = a.members?.length || 0;
          bValue = b.members?.length || 0;
          break;
        case 'bugs':
          aValue = a.totalBugs ?? 0;
          bValue = b.totalBugs ?? 0;
          break;
        case 'createdAt':
          aValue = a.createdAt ? new Date(a.createdAt) : new Date(0);
          bValue = b.createdAt ? new Date(b.createdAt) : new Date(0);
          break;
        default:
          aValue = '';
          bValue = '';
      }
      if (aValue < bValue) return sortDir === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredProjects, sortBy, sortDir]);

  const handleSort = (col) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  // Quick Action Handlers
  const handleFavorite = (projectId) => {
    setFavoriteIds(ids => ids.includes(projectId) ? ids.filter(id => id !== projectId) : [...ids, projectId]);
  };
  const handleAddMember = (projectId) => {
    setAddMemberProjectId(projectId);
    setAddMemberEmail('');
    setAddMemberError('');
    setAddMemberSuccess('');
  };
  const handleArchive = async (projectId, archived) => {
    setArchiveLoadingIds(ids => [...ids, projectId]);
    setArchiveError('');
    try {
      const res = await authFetch(`/api/projects/${projectId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !archived })
      });
      if (!res.ok) {
        const err = await res.json();
        setArchiveError(err.message || 'Failed to update archive status.');
      } else {
        // Optionally, refresh project list from parent or update local state
        // For now, reload the page to reflect changes
        window.location.reload();
      }
    } catch (err) {
      setArchiveError('An unexpected error occurred.');
    } finally {
      setArchiveLoadingIds(ids => ids.filter(id => id !== projectId));
    }
  };

  // Bulk selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(sortedProjects.map(p => p._id));
    } else {
      setSelectedIds([]);
    }
  };
  const handleSelectRow = (projectId) => {
    setSelectedIds(ids => ids.includes(projectId) ? ids.filter(id => id !== projectId) : [...ids, projectId]);
  };
  const handleBulkDelete = async () => {
    setBulkDeleteLoading(true);
    setBulkDeleteError('');
    try {
      for (const projectId of selectedIds) {
        await authFetch(`/api/projects/${projectId}`, {
          method: 'DELETE'
        });
      }
      window.location.reload();
    } catch (err) {
      setBulkDeleteError('Failed to delete selected projects.');
    } finally {
      setBulkDeleteLoading(false);
    }
  };
  const handleBulkArchive = async () => {
    setBulkArchiveLoading(true);
    setBulkArchiveError('');
    try {
      for (const projectId of selectedIds) {
        await authFetch(`/api/projects/${projectId}/archive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ archived: true })
        });
      }
      window.location.reload();
    } catch (err) {
      setBulkArchiveError('Failed to archive selected projects.');
    } finally {
      setBulkArchiveLoading(false);
    }
  };

  // Add Member Modal logic
  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!addMemberEmail) {
      setAddMemberError('Please enter an email.');
      return;
    }
    setAddMemberLoading(true);
    setAddMemberError('');
    setAddMemberSuccess('');
    try {
      const res = await authFetch(`/api/projects/${addMemberProjectId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addMemberEmail })
      });
      if (res.ok) {
        setAddMemberSuccess('Invitation sent!');
        setAddMemberEmail('');
      } else {
        const err = await res.json();
        setAddMemberError(err.message || 'Failed to invite member.');
      }
    } catch (err) {
      setAddMemberError('An unexpected error occurred.');
    } finally {
      setAddMemberLoading(false);
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Add Member Modal */}
      {addMemberProjectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in-fast">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setAddMemberProjectId(null)}>
              <HiX className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-semibold mb-4">Add Member</h3>
            <form onSubmit={handleAddMemberSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter member's email"
                value={addMemberEmail}
                onChange={e => setAddMemberEmail(e.target.value)}
                className="px-3 py-2 border rounded-md bg-surface-light dark:bg-surface-dark"
                disabled={addMemberLoading}
                required
              />
              {addMemberError && <div className="text-red-600 text-sm">{addMemberError}</div>}
              {addMemberSuccess && <div className="text-green-600 text-sm">{addMemberSuccess}</div>}
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                disabled={addMemberLoading}
              >
                {addMemberLoading ? 'Inviting...' : 'Invite'}
              </button>
            </form>
          </div>
        </div>
      )}
      {selectedIds.length > 0 && (
        <div className="mb-2 flex items-center gap-4 bg-primary/10 border border-primary rounded p-2 animate-fade-in-fast">
          <span>{selectedIds.length} selected</span>
          <button onClick={handleBulkArchive} className="flex items-center gap-1 px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm" disabled={bulkArchiveLoading}>
            <HiArchive className="w-4 h-4" /> {bulkArchiveLoading ? 'Archiving...' : 'Archive'}
          </button>
          <button onClick={handleBulkDelete} className="flex items-center gap-1 px-3 py-1 rounded bg-red-100 dark:bg-red-700 hover:bg-red-200 dark:hover:bg-red-600 text-sm text-red-700 dark:text-white" disabled={bulkDeleteLoading}>
            <HiTrash className="w-4 h-4" /> {bulkDeleteLoading ? 'Deleting...' : 'Delete'}
          </button>
          <button onClick={() => setSelectedIds([])} className="ml-auto text-xs underline">Clear</button>
        </div>
      )}
      <div className="flex items-center mb-2 gap-2">
        <input
          type="text"
          placeholder="Filter by name or description..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 border rounded-md w-full max-w-xs bg-surface-light dark:bg-surface-dark"
        />
      </div>
      <table className="min-w-full bg-surface-light dark:bg-surface-dark rounded-lg shadow border border-border-light dark:border-border-dark">
        <thead>
          <tr>
            <th className="px-2 py-2 text-left">
              <input
                type="checkbox"
                checked={selectedIds.length === sortedProjects.length && sortedProjects.length > 0}
                onChange={handleSelectAll}
                aria-label="Select all projects"
              />
            </th>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-4 py-2 text-left cursor-pointer select-none"
                onClick={() => handleSort(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {sortBy === col.key && (
                    sortDir === 'asc' ? <HiChevronUp className="inline w-4 h-4" /> : <HiChevronDown className="inline w-4 h-4" />
                  )}
                </span>
              </th>
            ))}
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedProjects.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-text-secondary-light dark:text-text-secondary-dark italic">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">📂</span>
                  No projects found.
                </div>
              </td>
            </tr>
          ) : (
            sortedProjects.map(project => (
              <tr key={project._id} className="border-t border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(project._id)}
                    onChange={() => handleSelectRow(project._id)}
                    aria-label={`Select project ${project.name}`}
                  />
                </td>
                <td className="px-4 py-2 font-semibold">
                  <Link to={`/projects/${project._id}`} className="text-primary hover:underline">{project.name}</Link>
                </td>
                <td className="px-4 py-2 max-w-xs truncate">{project.description}</td>
                <td className="px-4 py-2">{project.status || 'Active'}</td>
                <td className="px-4 py-2">{project.members?.length || 0}</td>
                <td className="px-4 py-2">{project.totalBugs ?? 0}</td>
                <td className="px-4 py-2">{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-2 flex gap-2 items-center">
                  {/* Favorite/Pin */}
                  <button onClick={() => handleFavorite(project._id)} title={favoriteIds.includes(project._id) ? 'Unpin' : 'Pin'}>
                    {favoriteIds.includes(project._id) ? <HiStar className="text-yellow-400 w-5 h-5" /> : <HiOutlineStar className="w-5 h-5" />}
                  </button>
                  {/* Add Member */}
                  <button onClick={() => handleAddMember(project._id)} title="Add Member">
                    <HiUserAdd className="w-5 h-5 text-primary" />
                  </button>
                  {/* Archive */}
                  <button
                    onClick={() => handleArchive(project._id, project.archived)}
                    title={project.archived ? 'Unarchive Project' : 'Archive Project'}
                    disabled={archiveLoadingIds.includes(project._id)}
                  >
                    <HiArchive className={`w-5 h-5 ${project.archived ? 'text-green-600' : 'text-gray-500'}`} />
                    {archiveLoadingIds.includes(project._id) && <span className="ml-1 text-xs">...</span>}
                  </button>
                  {/* View/Edit/Delete */}
                  <Link to={`/projects/${project._id}`} className="text-blue-600 hover:underline">View</Link>
                  <Link to={`/projects/${project._id}/settings`} className="text-yellow-600 hover:underline">Edit</Link>
                  <button onClick={() => onDelete(project._id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {archiveError && <div className="text-red-600 text-sm mb-2">{archiveError}</div>}
      {bulkArchiveError && <div className="text-red-600 text-sm mb-2">{bulkArchiveError}</div>}
      {bulkDeleteError && <div className="text-red-600 text-sm mb-2">{bulkDeleteError}</div>}
    </div>
  );
} 
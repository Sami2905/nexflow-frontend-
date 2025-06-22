import React, { useState, useEffect, useCallback } from 'react';
import { HiSearch, HiFilter, HiX, HiBookmark, HiOutlineBookmark, HiCalendar, HiUser, HiTag } from 'react-icons/hi';
import { debounce } from 'lodash';
import Toast from './Toast';

const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];
const STATUS_OPTIONS = ['Open', 'In Progress', 'Closed'];

export default function AdvancedSearch({ 
  onSearch, 
  projects = [], 
  users = [], 
  savedSearches = [], 
  onSaveSearch, 
  onLoadSearch,
  onClearSearch,
  onDeleteSearch,
  children
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    project: '',
    assignee: '',
    priority: '',
    status: '',
    from: '',
    to: '',
    tags: '',
    createdBy: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [searchName, setSearchName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((term, filterOptions) => {
      onSearch({ q: term, ...filterOptions });
    }, 300),
    [onSearch]
  );

  // Update search when term or filters change
  useEffect(() => {
    const hasFilters = Object.values(filters).some(v => v !== '');
    setActiveFilters(hasFilters ? 1 : 0);
    
    debouncedSearch(searchTerm, filters);
  }, [searchTerm, filters, debouncedSearch]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      project: '',
      assignee: '',
      priority: '',
      status: '',
      from: '',
      to: '',
      tags: '',
      createdBy: ''
    });
    setSearchTerm('');
    onClearSearch();
  };

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  const handleSaveSearch = () => {
    if (!searchName.trim()) return;
    
    const searchConfig = {
      name: searchName,
      searchTerm,
      filters: { ...filters }
    };
    
    onSaveSearch(searchConfig);
    addToast('Search saved!', 'success');
    setSearchName('');
    setShowSaveDialog(false);
  };

  const handleLoadSearch = (savedSearch) => {
    setSearchTerm(savedSearch.searchTerm || '');
    setFilters(savedSearch.filters || {});
    onLoadSearch(savedSearch);
    addToast(`Loaded search: ${savedSearch.name}`, 'info');
  };

  const handleDeleteSavedSearch = (search) => {
    if (window.confirm('Delete this saved search?')) {
      if (typeof onDeleteSearch === 'function') onDeleteSearch(search);
      addToast('Saved search deleted', 'success');
    }
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v !== '').length + (searchTerm ? 1 : 0);
  };

  // Filter chips for active filters/search
  const filterChips = [];
  if (searchTerm) filterChips.push({ label: `Search: "${searchTerm}"`, key: 'q' });
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      let label = '';
      if (key === 'project') label = `Project: ${projects.find(p => p._id === value)?.name || value}`;
      else if (key === 'assignee') label = value === 'unassigned' ? 'Unassigned' : `Assignee: ${users.find(u => u._id === value)?.name || value}`;
      else if (key === 'priority') label = `Priority: ${value}`;
      else if (key === 'status') label = `Status: ${value}`;
      else if (key === 'from') label = `From: ${value}`;
      else if (key === 'to') label = `To: ${value}`;
      else if (key === 'tags') label = `Tags: ${value}`;
      else if (key === 'createdBy') label = `Created By: ${users.find(u => u._id === value)?.name || value}`;
      else label = `${key}: ${value}`;
      filterChips.push({ label, key });
    }
  });

  return (
    <div className="space-y-4">
      <Toast toasts={toasts} removeToast={id => setToasts(ts => ts.filter(t => t.id !== id))} />
      {/* Filter Chips */}
      {filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2" aria-label="Active filters">
          {filterChips.map(chip => (
            <span key={chip.key} className="badge badge-outline badge-lg flex items-center gap-1">
              {chip.label}
              <button
                className="ml-1 text-error hover:text-danger"
                aria-label={`Remove filter: ${chip.label}`}
                onClick={() => {
                  if (chip.key === 'q') setSearchTerm('');
                  else setFilters(f => ({ ...f, [chip.key]: '' }));
                }}
              >
                <HiX />
              </button>
            </span>
          ))}
        </div>
      )}
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow max-w-lg">
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bugs by title, description, or tags..."
              className="input input-bordered w-full pl-10 pr-4"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search tickets"
            />
          </div>
          <button
            className={`btn btn-outline ${showFilters ? 'btn-primary' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters panel"
          >
            <HiFilter className="mr-1" />
            Filters {activeFilters > 0 && <span className="badge badge-sm">{activeFilters}</span>}
          </button>
          {children}
          {getActiveFilterCount() > 0 && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={clearFilters}
              title="Clear all filters"
              aria-label="Clear all filters"
            >
              <HiX />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-base-200 rounded-lg p-4 space-y-4" aria-label="Advanced filters panel">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Project Filter */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Project</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={filters.project}
                onChange={(e) => handleFilterChange('project', e.target.value)}
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Filter */}
            <div>
              <label className="label">
                <span className="label-text font-medium flex items-center gap-1">
                  <HiUser className="text-sm" />
                  Assignee
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={filters.assignee}
                onChange={(e) => handleFilterChange('assignee', e.target.value)}
              >
                <option value="">All Assignees</option>
                <option value="unassigned">Unassigned</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Priority</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
              >
                <option value="">All Priorities</option>
                {PRIORITY_OPTIONS.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Status</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="label">
                <span className="label-text font-medium flex items-center gap-1">
                  <HiCalendar className="text-sm" />
                  From Date
                </span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.from}
                onChange={(e) => handleFilterChange('from', e.target.value)}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text font-medium flex items-center gap-1">
                  <HiCalendar className="text-sm" />
                  To Date
                </span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={filters.to}
                onChange={(e) => handleFilterChange('to', e.target.value)}
              />
            </div>

            {/* Tags Filter */}
            <div>
              <label className="label">
                <span className="label-text font-medium flex items-center gap-1">
                  <HiTag className="text-sm" />
                  Tags
                </span>
              </label>
              <input
                type="text"
                placeholder="Enter tags (comma separated)"
                className="input input-bordered w-full"
                value={filters.tags}
                onChange={(e) => handleFilterChange('tags', e.target.value)}
              />
            </div>

            {/* Created By Filter */}
            <div>
              <label className="label">
                <span className="label-text font-medium">Created By</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={filters.createdBy}
                onChange={(e) => handleFilterChange('createdBy', e.target.value)}
              >
                <option value="">All Users</option>
                {users.map(user => (
                  <option key={user._id} value={user._id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <button
                className="btn btn-sm btn-outline"
                onClick={() => setShowSaveDialog(true)}
                disabled={getActiveFilterCount() === 0}
                aria-label="Save current search"
              >
                <HiOutlineBookmark className="mr-1" />
                Save Search
              </button>
              {savedSearches.length > 0 && (
                <div className="dropdown dropdown-hover">
                  <label tabIndex={0} className="btn btn-sm btn-outline" aria-label="Load saved search">
                    <HiBookmark className="mr-1" />
                    Load Saved
                  </label>
                  <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                    {savedSearches.map((search, index) => (
                      <li key={index} className="flex items-center justify-between">
                        <button
                          onClick={() => handleLoadSearch(search)}
                          className="text-left flex-1"
                          aria-label={`Load saved search: ${search.name}`}
                        >
                          {search.name}
                        </button>
                        <button
                          className="ml-2 text-error hover:text-danger"
                          aria-label={`Delete saved search: ${search.name}`}
                          onClick={() => handleDeleteSavedSearch(search)}
                        >
                          <HiX />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {getActiveFilterCount()} active filter{getActiveFilterCount() !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Save Search Dialog */}
      {showSaveDialog && (
        <div className="modal modal-open" aria-modal="true" role="dialog" aria-label="Save search dialog">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Save Search</h3>
            <input
              type="text"
              placeholder="Enter search name..."
              className="input input-bordered w-full mb-4"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              aria-label="Search name input"
            />
            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={handleSaveSearch}
                disabled={!searchName.trim()}
                aria-label="Save search"
              >
                Save
              </button>
              <button
                className="btn"
                onClick={() => setShowSaveDialog(false)}
                aria-label="Cancel save search"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import { io } from 'socket.io-client';
import Badge from '../components/Badge';
import Avatar from '../components/Avatar';
import IconButton from '../components/IconButton';
import { HiPencil, HiTrash, HiChat, HiCheck, HiSelector, HiBookmark, HiX, HiOutlineTicket, HiPlus } from 'react-icons/hi';
import Papa from 'papaparse';
import SpinnerOverlay from '../components/SpinnerOverlay';
import clsx from 'clsx';
import InlineSpinner from '../components/InlineSpinner';

const STATUS_OPTIONS = ['Open', 'In Progress', 'Closed'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

export default function ListView() {
  const { id: projectId } = useParams();
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState('');
  const [commentTicket, setCommentTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState('');
  const commentInputRef = useRef();
  const [selected, setSelected] = useState([]);
  const allSelected = tickets.length > 0 && selected.length === tickets.length;
  const someSelected = selected.length > 0 && selected.length < tickets.length;
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [savedFilters, setSavedFilters] = useState(() => JSON.parse(localStorage.getItem('savedFilters') || '[]'));
  const [selectedFilter, setSelectedFilter] = useState('');
  const [assigneeEditId, setAssigneeEditId] = useState(null);
  const [assigneeLoadingId, setAssigneeLoadingId] = useState(null);

  const fetchTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/bugs?project=${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : data.bugs || []);
    } catch (err) {
      setError('Could not load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await authFetch('/api/auth/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => { if (projectId) fetchTickets(); fetchUsers(); }, [projectId]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ['websocket'] });
    socket.on('bugCreated', fetchTickets);
    socket.on('bugUpdated', fetchTickets);
    socket.on('bugDeleted', fetchTickets);
    return () => { socket.disconnect(); };
  }, [projectId]);

  // Advanced filtering
  const filtered = tickets
    .filter(t => (filterStatus ? t.status === filterStatus : true))
    .filter(t => (filterPriority ? t.priority === filterPriority : true))
    .filter(t => (filterAssignee ? String(t.assignedTo?._id || t.assignedTo) === filterAssignee : true))
    .filter(t => (search ? (t.title?.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase())) : true))
    .filter(t => (dateFrom ? new Date(t.createdAt) >= new Date(dateFrom) : true))
    .filter(t => (dateTo ? new Date(t.createdAt) <= new Date(dateTo + 'T23:59:59.999Z') : true));
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'createdAt') return sortOrder === 'desc' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'priority') {
      const order = { High: 1, Medium: 2, Low: 3 };
      return sortOrder === 'desc' ? order[a.priority] - order[b.priority] : order[b.priority] - order[a.priority];
    }
    return 0;
  });

  // Inline edit handlers
  const handleEditClick = ticket => {
    setEditId(ticket._id);
    setEditForm({
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority,
      assignedTo: ticket.assignedTo?._id || ticket.assignedTo || '',
    });
    setEditError('');
  };
  const handleEditChange = e => setEditForm({ ...editForm, [e.target.name]: e.target.value });
  const handleEditSave = async id => {
    setEditLoading(true);
    setEditError('');
    try {
      const res = await authFetch(`/api/bugs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Failed to update ticket');
      setEditId(null);
      fetchTickets();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };
  const handleEditCancel = () => setEditId(null);
  const handleDelete = async id => {
    setDeleteLoading(id);
    try {
      const res = await authFetch(`/api/bugs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete ticket');
      fetchTickets();
    } catch {}
    setDeleteLoading('');
  };

  // Fetch comments for a ticket
  const fetchComments = async bugId => {
    setCommentsLoading(true);
    try {
      const res = await authFetch(`/api/bugs/${bugId}/comments`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Open comments modal and load comments
  const handleOpenComments = ticket => {
    setCommentTicket(ticket);
    fetchComments(ticket._id);
  };

  // Add comment
  const handleAddComment = async e => {
    e.preventDefault();
    setCommentError('');
    if (!commentText.trim()) return;
    try {
      const res = await authFetch(`/api/bugs/${commentTicket._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: commentText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add comment');
      setComments(c => [...c, data]);
      setCommentText('');
      commentInputRef.current?.focus();
    } catch (err) {
      setCommentError(err.message);
    }
  };

  // Edit comment
  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.text);
  };
  const handleEditCommentSave = async (comment) => {
    try {
      const res = await authFetch(`/api/bugs/${commentTicket._id}/comments/${comment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editingCommentText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update comment');
      setComments(cs => cs.map(c => c._id === comment._id ? { ...c, text: editingCommentText } : c));
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      setCommentError(err.message);
    }
  };
  const handleEditCommentCancel = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };
  // Delete comment
  const handleDeleteComment = async (comment) => {
    setDeletingCommentId(comment._id);
    try {
      const res = await authFetch(`/api/bugs/${commentTicket._id}/comments/${comment._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete comment');
      setComments(cs => cs.filter(c => c._id !== comment._id));
      setDeletingCommentId('');
    } catch (err) {
      setDeletingCommentId('');
      setCommentError(err.message);
    }
  };

  // Real-time updates for comments
  useEffect(() => {
    if (!commentTicket) return;
    const socket = io(import.meta.env.VITE_API_URL, { transports: ['websocket'] });
    socket.on('commentAdded', ({ bugId, comment }) => {
      if (commentTicket && bugId === commentTicket._id) {
        setComments(cs => [...cs, comment]);
      }
    });
    socket.on('commentUpdated', ({ bugId, comment }) => {
      if (commentTicket && bugId === commentTicket._id) {
        setComments(cs => cs.map(c => c._id === comment._id ? comment : c));
      }
    });
    socket.on('commentDeleted', ({ bugId, commentId }) => {
      if (commentTicket && bugId === commentTicket._id) {
        setComments(cs => cs.filter(c => c._id !== commentId));
      }
    });
    return () => { socket.disconnect(); };
  }, [commentTicket]);

  const handleSelect = id => setSelected(sel => sel.includes(id) ? sel.filter(s => s !== id) : [...sel, id]);
  const handleSelectAll = () => setSelected(allSelected ? [] : tickets.map(t => t._id));
  const clearSelection = () => setSelected([]);

  // Bulk actions
  const handleBulkDelete = async () => {
    for (const id of selected) await handleDelete(id);
    clearSelection();
  };
  const handleBulkStatus = async status => {
    for (const id of selected) await handleEditSave(id, { ...editForm, status });
    clearSelection();
  };
  const handleBulkAssign = async userId => {
    for (const id of selected) await handleEditSave(id, { ...editForm, assignedTo: userId });
    clearSelection();
  };

  // Export tickets as CSV
  const handleExport = () => {
    const csv = Papa.unparse(sorted.map(t => ({
      Title: t.title,
      Status: t.status,
      Priority: t.priority,
      Assignee: t.assignedTo?.name || t.assignedTo?.email || 'Unassigned',
      Created: new Date(t.createdAt).toLocaleString(),
    })));
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tickets.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import tickets from CSV
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async results => {
        let success = 0, fail = 0;
        for (const row of results.data) {
          if (!row.Title) continue;
          try {
            await authFetch('/api/bugs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: row.Title,
                status: row.Status || 'Open',
                priority: row.Priority || 'Medium',
                assignedTo: users.find(u => u.name === row.Assignee || u.email === row.Assignee)?._id,
                project: projectId,
                description: row.Description || '',
              }),
            });
            success++;
          } catch { fail++; }
        }
        fetchTickets();
        alert(`Imported: ${success} tickets. Failed: ${fail}`);
      },
      error: () => alert('Failed to parse CSV'),
    });
  };

  // Save filter
  const handleSaveFilter = () => {
    const name = prompt('Name this filter:');
    if (!name) return;
    const filter = { name, filterStatus, filterPriority, filterAssignee, search, dateFrom, dateTo, sortBy, sortOrder };
    const updated = [...savedFilters, filter];
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
  };
  const handleSelectFilter = idx => {
    const f = savedFilters[idx];
    setFilterStatus(f.filterStatus);
    setFilterPriority(f.filterPriority);
    setFilterAssignee(f.filterAssignee);
    setSearch(f.search);
    setDateFrom(f.dateFrom);
    setDateTo(f.dateTo);
    setSortBy(f.sortBy);
    setSortOrder(f.sortOrder);
    setSelectedFilter(idx);
  };
  const handleDeleteFilter = idx => {
    const updated = savedFilters.filter((_, i) => i !== idx);
    setSavedFilters(updated);
    localStorage.setItem('savedFilters', JSON.stringify(updated));
    setSelectedFilter('');
  };

  // Filter chip helpers
  const renderFilterChips = (options, active, setActive, label) => (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs font-semibold text-textSecondary-light dark:text-textSecondary-dark mr-1">{label}:</span>
      <button
        className={clsx(
          'px-3 py-1 rounded-full border text-xs font-medium transition shadow-sm',
          !active ? 'bg-primary text-white border-primary' : 'bg-surface-light dark:bg-surface-dark text-textSecondary-light dark:text-textSecondary-dark border-border-light dark:border-border-dark hover:bg-primary/10',
        )}
        onClick={() => setActive('')}
      >
        All
      </button>
      {options.map(opt => (
        <button
          key={opt.value || opt}
          className={clsx(
            'px-3 py-1 rounded-full border text-xs font-medium transition shadow-sm',
            active === (opt.value || opt)
              ? 'bg-primary text-white border-primary'
              : 'bg-surface-light dark:bg-surface-dark text-textSecondary-light dark:text-textSecondary-dark border-border-light dark:border-border-dark hover:bg-primary/10'
          )}
          onClick={() => setActive(opt.value || opt)}
        >
          {opt.label || opt}
        </button>
      ))}
    </div>
  );

  const handleAssigneeChange = async (ticketId, userId) => {
    setAssigneeLoadingId(ticketId);
    try {
      const res = await authFetch(`/api/bugs/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedTo: userId }),
      });
      if (!res.ok) throw new Error('Failed to update assignee');
      await fetchTickets();
    } catch {}
    setAssigneeLoadingId(null);
    setAssigneeEditId(null);
  };

  if (loading) {
    return <SpinnerOverlay message="Loading tickets..." />;
  }
  if (error) return <div className="p-8 text-center text-danger">{error}</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Project Ticket List</h2>
      {/* Quick Filter Chips */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        {renderFilterChips(STATUS_OPTIONS, filterStatus, setFilterStatus, 'Status')}
        {renderFilterChips(PRIORITY_OPTIONS, filterPriority, setFilterPriority, 'Priority')}
        {renderFilterChips(users.map(u => ({ value: u._id, label: u.name || u.email })), filterAssignee, setFilterAssignee, 'Assignee')}
      </div>
      {/* Advanced Search & Saved Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input className="input input-bordered w-48" type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} />
        <input className="input input-bordered w-36" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <input className="input input-bordered w-36" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        <button className="btn btn-xs btn-outline" onClick={handleSaveFilter}><HiBookmark className="mr-1" /> Save Filter</button>
        {savedFilters.length > 0 && (
          <div className="flex items-center gap-1">
            <select className="select select-xs" value={selectedFilter} onChange={e => handleSelectFilter(e.target.value)}>
              <option value="">Saved Filters</option>
              {savedFilters.map((f, i) => <option key={i} value={i}>{f.name}</option>)}
            </select>
            {selectedFilter !== '' && <button className="btn btn-xs btn-ghost" onClick={() => handleDeleteFilter(selectedFilter)}><HiX /></button>}
          </div>
        )}
      </div>
      {/* Export/Import Bar */}
      <div className="flex gap-2 mb-4 items-center">
        <button className="btn btn-xs btn-outline" onClick={handleExport}>Export CSV</button>
        <label className="btn btn-xs btn-outline cursor-pointer">
          Import CSV
          <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
        </label>
      </div>
      {/* Bulk Actions Bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 shadow animate-fade-in">
          <span className="font-semibold">{selected.length} selected</span>
          <button className="btn btn-xs btn-error" onClick={handleBulkDelete}><HiTrash className="mr-1" /> Delete</button>
          <div className="flex items-center gap-1">
            <span>Status:</span>
            {STATUS_OPTIONS.map(s => (
              <button key={s} className="btn btn-xs btn-outline" onClick={() => handleBulkStatus(s)}>{s}</button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <span>Assign:</span>
            <select className="select select-xs" onChange={e => handleBulkAssign(e.target.value)} defaultValue="">
              <option value="">Select user</option>
              {users.map(u => <option key={u._id} value={u._id}>{u.name || u.email}</option>)}
            </select>
          </div>
          <button className="btn btn-xs btn-ghost" onClick={clearSelection}>Clear</button>
        </div>
      )}
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <HiOutlineTicket className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-text-primary-light dark:text-text-primary-dark">No tickets found</h3>
          <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Get started by creating a new ticket.
          </p>
          <div className="mt-6">
            <button
              onClick={() => { /* TODO: Implement create ticket modal or navigation */ }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <HiPlus className="-ml-1 mr-2 h-5 w-5" />
              New Ticket
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl shadow bg-white dark:bg-gray-900">
          <table className="table w-full">
            <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
              <tr>
                <th className="px-2 py-2"><input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = someSelected; }} onChange={handleSelectAll} aria-label="Select all" /></th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Priority</th>
                <th className="px-4 py-2">Assignee</th>
                <th className="px-4 py-2">Created</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((ticket, idx) => (
                <tr key={ticket._id} className={`transition hover:bg-blue-50 dark:hover:bg-blue-900/30 ${idx % 2 === 1 ? 'bg-gray-50 dark:bg-gray-800/40' : ''}`}>
                  <td className="px-2 py-2"><input type="checkbox" checked={selected.includes(ticket._id)} onChange={() => handleSelect(ticket._id)} aria-label={`Select ticket ${ticket.title}`} /></td>
                  {editId === ticket._id ? (
                    <>
                      <td><input className="input input-bordered w-full" name="title" value={editForm.title} onChange={handleEditChange} /></td>
                      <td>
                        <select className="select select-bordered" name="status" value={editForm.status} onChange={handleEditChange}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="select select-bordered" name="priority" value={editForm.priority} onChange={handleEditChange}>
                          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td>
                        {assigneeLoadingId === ticket._id ? (
                          <InlineSpinner size={20} className="mx-auto" />
                        ) : assigneeEditId === ticket._id ? (
                          <div className="relative">
                            <select
                              className="select select-bordered"
                              value={ticket.assignedTo?._id || ticket.assignedTo || ''}
                              onChange={e => handleAssigneeChange(ticket._id, e.target.value)}
                              onBlur={() => setAssigneeEditId(null)}
                              autoFocus
                            >
                              <option value="">Unassigned</option>
                              {users.map(u => (
                                <option key={u._id} value={u._id}>{u.name || u.email}</option>
                              ))}
                            </select>
                          </div>
                        ) : ticket.assignedTo ? (
                          <button
                            className="flex items-center gap-2 px-2 py-1 rounded-full border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs text-textSecondary-light dark:text-textSecondary-dark hover:bg-primary/10 transition cursor-pointer"
                            onClick={() => setAssigneeEditId(ticket._id)}
                            title="Edit assignee"
                          >
                            <Avatar name={ticket.assignedTo.name || ticket.assignedTo.email} size={7} />
                            <span>{ticket.assignedTo.name || ticket.assignedTo.email}</span>
                          </button>
                        ) : (
                          <button
                            className="px-2 py-1 rounded-full border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs text-textSecondary-light dark:text-textSecondary-dark hover:bg-primary/10 transition cursor-pointer"
                            onClick={() => setAssigneeEditId(ticket._id)}
                            title="Assign user"
                          >
                            Unassigned
                          </button>
                        )}
                      </td>
                      <td>{new Date(ticket.createdAt).toLocaleString()}</td>
                      <td className="flex gap-2">
                        <button className="btn btn-xs btn-primary" onClick={() => handleEditSave(ticket._id)} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                        <button className="btn btn-xs btn-ghost" onClick={handleEditCancel}>Cancel</button>
                        {editError && <div className="text-danger text-xs ml-2">{editError}</div>}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">{ticket.title}</td>
                      <td><Badge label={ticket.status} type="status" /></td>
                      <td><Badge label={ticket.priority} type="priority" /></td>
                      <td>
                        {assigneeLoadingId === ticket._id ? (
                          <InlineSpinner size={20} className="mx-auto" />
                        ) : assigneeEditId === ticket._id ? (
                          <div className="relative">
                            <select
                              className="select select-bordered"
                              value={ticket.assignedTo?._id || ticket.assignedTo || ''}
                              onChange={e => handleAssigneeChange(ticket._id, e.target.value)}
                              onBlur={() => setAssigneeEditId(null)}
                              autoFocus
                            >
                              <option value="">Unassigned</option>
                              {users.map(u => (
                                <option key={u._id} value={u._id}>{u.name || u.email}</option>
                              ))}
                            </select>
                          </div>
                        ) : ticket.assignedTo ? (
                          <button
                            className="flex items-center gap-2 px-2 py-1 rounded-full border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs text-textSecondary-light dark:text-textSecondary-dark hover:bg-primary/10 transition cursor-pointer"
                            onClick={() => setAssigneeEditId(ticket._id)}
                            title="Edit assignee"
                          >
                            <Avatar name={ticket.assignedTo.name || ticket.assignedTo.email} size={7} />
                            <span>{ticket.assignedTo.name || ticket.assignedTo.email}</span>
                          </button>
                        ) : (
                          <button
                            className="px-2 py-1 rounded-full border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-xs text-textSecondary-light dark:text-textSecondary-dark hover:bg-primary/10 transition cursor-pointer"
                            onClick={() => setAssigneeEditId(ticket._id)}
                            title="Assign user"
                          >
                            Unassigned
                          </button>
                        )}
                      </td>
                      <td>{new Date(ticket.createdAt).toLocaleString()}</td>
                      <td className="flex gap-2">
                        <IconButton icon={HiPencil} label="Edit" tooltip="Edit ticket" onClick={() => handleEditClick(ticket)} />
                        <IconButton icon={HiTrash} label="Delete" color="danger" tooltip="Delete ticket" onClick={() => handleDelete(ticket._id)} />
                        <IconButton icon={HiChat} label="Comment" color="info" tooltip="View comments" onClick={() => handleOpenComments(ticket)} />
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Comments Modal (real UI) */}
      {commentTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 btn btn-xs btn-ghost" onClick={() => setCommentTicket(null)}>Close</button>
            <h3 className="text-lg font-bold mb-2">Comments for: {commentTicket.title}</h3>
            {commentsLoading ? (
              <div className="flex items-center gap-2 text-textSecondary-light dark:text-textSecondary-dark" aria-busy="true" aria-live="polite">
                <span className="loading loading-spinner loading-md"></span>
                Loading comments...
              </div>
            ) : (
              <ul className="space-y-3 max-h-48 overflow-y-auto mb-2" aria-label="Comment list">
                {comments.length === 0 ? (
                  <li className="text-textSecondary-light dark:text-textSecondary-dark italic">No comments yet.</li>
                ) : comments.map(c => {
                  const canEdit = c.user?._id === (JSON.parse(localStorage.getItem('user') || '{}'))._id;
                  return (
                    <li key={c._id} className="flex items-start gap-2" tabIndex={0} aria-label={`Comment by ${c.user?.name || c.user?.email}`}> 
                      <span className="rounded-full bg-primary text-white w-8 h-8 flex items-center justify-center font-bold" title={c.user?.name || c.user?.email}>{(c.user?.name || c.user?.email || 'U').slice(0,2).toUpperCase()}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">{c.user?.name || c.user?.email}</div>
                        {editingCommentId === c._id ? (
                          <form className="flex gap-2 mt-1" onSubmit={e => { e.preventDefault(); handleEditCommentSave(c); }}>
                            <input className="input input-bordered flex-1" value={editingCommentText} onChange={e => setEditingCommentText(e.target.value)} autoFocus />
                            <button className="btn btn-primary btn-xs" type="submit" aria-label="Save comment">Save</button>
                            <button className="btn btn-ghost btn-xs" type="button" onClick={handleEditCommentCancel} aria-label="Cancel edit">Cancel</button>
                          </form>
                        ) : (
                          <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">{c.text}</div>
                        )}
                        <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1">{new Date(c.createdAt).toLocaleString()}</div>
                      </div>
                      {canEdit && editingCommentId !== c._id && (
                        <div className="flex flex-col gap-1 ml-2">
                          <button className="btn btn-ghost btn-xs" onClick={() => handleEditComment(c)} aria-label="Edit comment">Edit</button>
                          <button className="btn-error btn-xs" onClick={() => window.confirm('Delete this comment?') && handleDeleteComment(c)} disabled={deletingCommentId === c._id} aria-label="Delete comment">{deletingCommentId === c._id ? 'Deleting...' : 'Delete'}</button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="relative">
              <form className="flex gap-2 mt-2" onSubmit={handleAddComment} aria-label="Add comment form">
                <input ref={commentInputRef} className="input input-bordered flex-1" type="text" placeholder="Add a comment..." value={commentText} onChange={e => setCommentText(e.target.value)} disabled={commentsLoading} aria-label="Comment input" />
                <button className="btn btn-primary" type="submit" disabled={commentsLoading || !commentText.trim()} aria-label="Post comment">Post</button>
              </form>
            </div>
            {commentError && <div className="text-danger mt-1" role="alert">{commentError}</div>}
          </div>
        </div>
      )}
    </div>
  );
} 
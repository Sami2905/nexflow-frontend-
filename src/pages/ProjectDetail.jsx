import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndContext, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { HiOutlineTrash, HiOutlinePencil, HiOutlineUser, HiOutlineExclamationCircle, HiOutlineUserCircle } from 'react-icons/hi';
import { FaBug, FaUsers, FaCog } from 'react-icons/fa';
import { authFetch } from '../utils/authFetch';
import { io } from 'socket.io-client';
import Avatar from '../components/Avatar';
import IconButton from '../components/IconButton';
import { HiPencil, HiTrash } from 'react-icons/hi';
import SpinnerOverlay from '../components/SpinnerOverlay';

const tabs = ['Tickets', 'Kanban', 'Team', 'Activity', 'Settings'];
const STATUS_OPTIONS = [
  { label: 'Open', color: 'bg-info' },
  { label: 'In Progress', color: 'bg-warning' },
  { label: 'Closed', color: 'bg-success' },
];

function getInitials(name) {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
}

// Drag handle for Kanban cards
function DragHandle() {
  return <span className="cursor-grab text-xl text-textSecondary-light dark:text-textSecondary-dark mr-2" title="Drag (hold and move)" aria-label="Drag handle" tabIndex={0}>⋮</span>;
}

// Utility to highlight @mentions in comment text
function highlightMentions(text) {
  if (!text) return '';
  // Replace @username with a span
  return text.replace(/(@[\w\-.]+)/g, '<span class="text-primary font-semibold">$1</span>');
}

// Utility functions for color classes (Jira/Linear style)
function statusColorClass(status) {
  if (status === 'Open') return 'border-blue-500 bg-blue-50';
  if (status === 'In Progress') return 'border-yellow-400 bg-yellow-50';
  if (status === 'In Review') return 'border-purple-400 bg-purple-50';
  if (status === 'Closed') return 'border-green-500 bg-green-50';
  return 'border-gray-300 bg-white';
}
function priorityBadgeClass(priority) {
  if (priority === 'High') return 'bg-red-500 text-white';
  if (priority === 'Medium') return 'bg-yellow-400 text-white';
  return 'bg-blue-500 text-white';
}
function statusBadgeClass(status) {
  if (status === 'Open') return 'bg-blue-500 text-white';
  if (status === 'In Progress') return 'bg-yellow-400 text-white';
  if (status === 'In Review') return 'bg-purple-500 text-white';
  return 'bg-green-500 text-white';
}
function assigneeInitials(user) {
  if (!user) return 'U';
  if (user.name) return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  if (user.email) return user.email[0].toUpperCase();
  return 'U';
}

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('Tickets');
  // Ticket CRUD
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '', priority: 'Medium', status: 'Open', assignee: '' });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: 'Medium', status: 'Open', assignee: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState('');
  // Team management
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [removeLoading, setRemoveLoading] = useState('');
  const [removeConfirm, setRemoveConfirm] = useState({ open: false, user: null });
  const [cancelInviteLoading, setCancelInviteLoading] = useState('');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  // Toasts
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((msg, type = 'info', duration = 3500) => {
    setToasts(ts => [...ts, { id: Date.now() + Math.random(), message: msg, type, duration }]);
  }, []);
  const removeToast = useCallback(id => setToasts(ts => ts.filter(t => t.id !== id)), []);
  // Ticket details modal
  const [ticketDetail, setTicketDetail] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [activityFilter, setActivityFilter] = useState('all');
  const [settingsForm, setSettingsForm] = useState({ name: '', description: '' });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const commentInputRef = useRef();
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentError, setAttachmentError] = useState('');
  const [kanbanLoading, setKanbanLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [mentionDropdown, setMentionDropdown] = useState({ open: false, options: [], index: 0, query: '', anchor: null });

  const activityTypeMap = {
    bug_created: { icon: <FaBug className="text-info text-2xl" />, label: 'Bug' },
    bug_updated: { icon: <FaBug className="text-warning text-2xl" />, label: 'Bug' },
    bug_deleted: { icon: <FaBug className="text-danger text-2xl" />, label: 'Bug' },
    member_added: { icon: <FaUsers className="text-success text-2xl" />, label: 'Member' },
    member_removed: { icon: <FaUsers className="text-danger text-2xl" />, label: 'Member' },
    project_created: { icon: <FaCog className="text-info text-2xl" />, label: 'Project' },
    project_updated: { icon: <FaCog className="text-warning text-2xl" />, label: 'Project' },
    project_deleted: { icon: <FaCog className="text-danger text-2xl" />, label: 'Project' },
    default: { icon: <HiOutlineUserCircle className="text-primary text-2xl" />, label: 'Other' },
  };
  const filteredLogs = activityFilter === 'all' ? activityLogs : activityLogs.filter(log => activityTypeMap[log.type]?.label.toLowerCase() === activityFilter);

  // Role helpers
  const isOwner = project && user && project.createdBy === user._id;
  const isAdmin = user && user.role === 'admin';
  const canManageProject = isOwner || isAdmin;

  useEffect(() => {
    const fetchProject = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const res = await authFetch(`/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch project');
        const data = await res.json();
        setProject(data);
      } catch (err) {
        setError('Could not load project');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [projectId]);

  useEffect(() => {
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
    if (projectId) fetchTickets();
  }, [projectId]);

  // Ticket CRUD
  const handleCreateChange = e => setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  const handleCreateSubmit = async e => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);
    try {
      const res = await authFetch('/api/bugs', {
        method: 'POST',
        body: JSON.stringify({ ...createForm, project: projectId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create ticket');
      }
      setCreateForm({ title: '', description: '', priority: 'Medium', status: 'Open', assignee: '' });
      setShowCreate(false);
      fetchTickets();
      addToast('Ticket created!', 'success');
    } catch (err) {
      setCreateError(err.message);
      addToast(err.message, 'error');
    } finally {
      setCreateLoading(false);
    }
  };
  const handleEditClick = ticket => {
    setEditId(ticket._id);
    setEditForm({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      status: ticket.status,
      assignee: ticket.assignee?._id || '',
    });
  };
  const handleEditChange = e => setEditForm({ ...editForm, [e.target.name]: e.target.value });
  const handleEditSubmit = async e => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/bugs/${editId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update ticket');
      }
      setEditId(null);
      fetchTickets();
      addToast('Ticket updated!', 'success');
    } catch (err) {
      setEditError(err.message);
      addToast(err.message, 'error');
    } finally {
      setEditLoading(false);
    }
  };
  const handleDelete = async id => {
    setDeleteLoading(id);
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/bugs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete ticket');
      fetchTickets();
      addToast('Ticket deleted!', 'success');
    } catch (err) {
      addToast('Failed to delete ticket', 'error');
    }
    setDeleteLoading('');
  };

  // Kanban drag-and-drop
  const groupedTickets = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s.label] = tickets.filter(t => t.status === s.label);
    return acc;
  }, {});
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ticket = tickets.find(t => t._id === active.id);
    if (!ticket) return;
    const newStatus = over.id;
    if (ticket.status === newStatus) return;
    setKanbanLoading(true);
    try {
      const token = localStorage.getItem('token');
      await authFetch(`/api/bugs/${ticket._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...ticket, status: newStatus }),
      });
      fetchTickets();
      addToast('Ticket moved!', 'success');
    } catch {
      addToast('Failed to move ticket', 'error');
    } finally {
      setKanbanLoading(false);
    }
  };

  // Team management
  const handleInvite = async e => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/projects/${projectId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to invite');
      setProject(data);
      setInviteEmail('');
      addToast('Invitation sent!', 'success');
      fetchActivityLogs();
    } catch (err) {
      setInviteError(err.message);
      addToast(err.message, 'error');
    } finally {
      setInviteLoading(false);
    }
  };
  const handleCancelInvite = async email => {
    setCancelInviteLoading(email);
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/projects/${projectId}/cancel-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel invite');
      setProject(data);
      addToast('Invite cancelled', 'success');
      fetchActivityLogs();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCancelInviteLoading('');
    }
  };
  const handleAcceptInvite = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/projects/${projectId}/accept-invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to accept invite');
      setProject(data);
      addToast('Invite accepted!', 'success');
      fetchActivityLogs();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };
  const handleDeclineInvite = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/projects/${projectId}/decline-invite`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to decline invite');
      setProject(data);
      addToast('Invite declined', 'success');
      fetchActivityLogs();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };
  const isUserInvited = project?.pendingInvites?.some(inv => inv.email === user?.email);
  const getUserName = id => {
    const m = (project.members || []).find(m => m._id === id);
    return m ? (m.name || m.email) : 'Unknown';
  };
  const handleRemove = async (userId) => {
    setRemoveLoading(userId);
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/projects/${projectId}/remove-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error('Failed to remove member');
      const updated = await res.json();
      setProject(updated);
      addToast('Member removed!', 'success');
    } catch {
      addToast('Failed to remove member', 'error');
    }
    setRemoveLoading('');
    setRemoveConfirm({ open: false, user: null });
  };

  useEffect(() => {
    if (activeTab === 'Activity' && project) {
      const fetchLogs = async () => {
        setActivityLoading(true);
        setActivityError('');
        try {
          const token = localStorage.getItem('token');
          const res = await authFetch(`/api/projects/${projectId}/activity`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) throw new Error('Failed to fetch activity logs');
          const data = await res.json();
          setActivityLogs(data);
        } catch (err) {
          setActivityError('Could not load activity logs');
        } finally {
          setActivityLoading(false);
        }
      };
      fetchLogs();
    }
  }, [activeTab, project, projectId]);

  useEffect(() => {
    if (activeTab === 'Settings' && project) {
      setSettingsForm({ name: project.name, description: project.description });
      setNewOwnerId('');
    }
  }, [activeTab, project]);

  const handleSettingsChange = e => setSettingsForm({ ...settingsForm, [e.target.name]: e.target.value });
  const handleSettingsSave = async e => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(settingsForm),
      });
      if (!res.ok) throw new Error('Failed to update project');
      const updated = await res.json();
      setProject(updated);
      addToast('Project updated!', 'success');
    } catch (err) {
      setSettingsError(err.message);
      addToast(err.message, 'error');
    } finally {
      setSettingsLoading(false);
    }
  };
  const handleArchiveToggle = async () => {
    setArchiveLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/projects/${projectId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ archived: !project.archived }),
      });
      if (!res.ok) throw new Error('Failed to update archive status');
      const updated = await res.json();
      setProject(updated);
      addToast(updated.archived ? 'Project archived' : 'Project unarchived', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setArchiveLoading(false);
    }
  };
  const handleTransfer = async () => {
    if (!newOwnerId) return;
    setTransferLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/projects/${projectId}/transfer-ownership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newOwnerId }),
      });
      if (!res.ok) throw new Error('Failed to transfer ownership');
      const updated = await res.json();
      setProject(updated);
      addToast('Ownership transferred!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setTransferLoading(false);
    }
  };
  const handleProjectDelete = async () => {
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete project');
      addToast('Project deleted!', 'success');
      navigate('/projects');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const fetchComments = async bugId => {
    setCommentsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/bugs/${bugId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };
  const handleOpenTicketDetail = ticket => {
    if (!ticketDetail || ticketDetail._id !== ticket._id) {
      setTicketDetail(ticket);
      fetchComments(ticket._id);
    }
  };
  const handleAddComment = async e => {
    e.preventDefault();
    setCommentError('');
    if (!commentText.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/bugs/${ticketDetail._id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: commentText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to add comment');
      setComments(c => [...c, data]);
      setCommentText('');
      commentInputRef.current?.focus();
      fetchActivityLogs && fetchActivityLogs();
    } catch (err) {
      setCommentError(err.message);
    }
  };
  const handleUploadAttachment = async e => {
    e.preventDefault();
    setAttachmentError('');
    if (!attachmentFile) return;
    const formData = new FormData();
    formData.append('file', attachmentFile);
    try {
      const token = localStorage.getItem('token');
      const res = await authFetch(`/api/bugs/${ticketDetail._id}/attachments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload');
      setTicketDetail(prev => ({
        ...prev,
        attachments: [...(prev.attachments || []), data]
      }));
      setAttachmentFile(null);
    } catch (err) {
      setAttachmentError(err.message);
    }
  };

  // Add edit and delete handlers for comments
  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.text);
  };
  const handleEditCommentSave = async (comment) => {
    try {
      const res = await authFetch(`/api/bugs/${ticketDetail._id}/comments/${comment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ text: editingCommentText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update comment');
      setComments(cs => cs.map(c => c._id === comment._id ? { ...c, text: editingCommentText } : c));
      setEditingCommentId(null);
      setEditingCommentText('');
      addToast('Comment updated!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };
  const handleEditCommentCancel = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };
  const handleDeleteComment = async (comment) => {
    setDeletingCommentId(comment._id);
    try {
      const res = await authFetch(`/api/bugs/${ticketDetail._id}/comments/${comment._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (!res.ok) throw new Error('Failed to delete comment');
      setComments(cs => cs.filter(c => c._id !== comment._id));
      setDeletingCommentId(null);
      addToast('Comment deleted!', 'success');
    } catch (err) {
      setDeletingCommentId(null);
      addToast(err.message, 'error');
    }
  };

  // In ticket list and Kanban, add:
  const canEditTicket = (ticket) => user && (ticket.createdBy === user._id || isAdmin);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ['websocket'] });
    socket.on('commentAdded', ({ bugId, comment }) => {
      if (ticketDetail && bugId === ticketDetail._id) {
        setComments(cs => [...cs, comment]);
      }
    });
    socket.on('commentUpdated', ({ bugId, comment }) => {
      if (ticketDetail && bugId === ticketDetail._id) {
        setComments(cs => cs.map(c => c._id === comment._id ? comment : c));
      }
    });
    socket.on('commentDeleted', ({ bugId, commentId }) => {
      if (ticketDetail && bugId === ticketDetail._id) {
        setComments(cs => cs.filter(c => c._id !== commentId));
      }
    });
    socket.on('kanbanUpdated', (updatedBug) => {
      if (project && updatedBug.project && updatedBug.project._id === project._id) {
        setTickets(ts => ts.map(t => t._id === updatedBug._id ? { ...t, ...updatedBug } : t));
      }
    });
    socket.on('projectActivity', (activity) => {
      if (project && activity.project === project._id) {
        setActivityLogs(logs => [activity, ...logs]);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [project && project._id, ticketDetail && ticketDetail._id]);

  // Handle @mention autocomplete in comment input
  const handleCommentInput = e => {
    const value = e.target.value;
    setCommentText(value);
    const cursor = e.target.selectionStart;
    const before = value.slice(0, cursor);
    const match = before.match(/@([\w\-.]*)$/);
    if (match && project && project.members) {
      const query = match[1].toLowerCase();
      const options = project.members.filter(m => (m.user?.name || m.user?.email).toLowerCase().includes(query));
      setMentionDropdown({ open: true, options, index: 0, query, anchor: e.target });
    } else {
      setMentionDropdown({ open: false, options: [], index: 0, query: '', anchor: null });
    }
  };
  const handleMentionSelect = (member) => {
    if (!mentionDropdown.anchor) return;
    const input = mentionDropdown.anchor;
    const cursor = input.selectionStart;
    const before = commentText.slice(0, cursor).replace(/@([\w\-.]*)$/, `@${member.user?.name || member.user?.email} `);
    const after = commentText.slice(cursor);
    setCommentText(before + after);
    setMentionDropdown({ open: false, options: [], index: 0, query: '', anchor: null });
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(before.length, before.length);
    }, 0);
  };
  const handleMentionKeyDown = e => {
    if (!mentionDropdown.open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionDropdown(d => ({ ...d, index: (d.index + 1) % d.options.length }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionDropdown(d => ({ ...d, index: (d.index - 1 + d.options.length) % d.options.length }));
    } else if (e.key === 'Enter' && mentionDropdown.options.length > 0) {
      e.preventDefault();
      handleMentionSelect(mentionDropdown.options[mentionDropdown.index]);
    } else if (e.key === 'Escape') {
      setMentionDropdown({ open: false, options: [], index: 0, query: '', anchor: null });
    }
  };

  if (loading) {
    return <SpinnerOverlay message="Loading project..." />;
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-sans transition-colors duration-300 p-6">
      <Toast toasts={toasts} removeToast={removeToast} />
      <Modal open={removeConfirm.open} onClose={() => setRemoveConfirm({ open: false, user: null })} title="Remove Member?">
        <div className="flex items-center gap-3 mb-4">
          <HiOutlineExclamationCircle className="text-danger text-3xl" />
          <span>Are you sure you want to remove <b>{removeConfirm.user?.name || removeConfirm.user?.email}</b> from the project?</span>
        </div>
        <div className="flex gap-2 justify-end">
          <button className="btn btn-ghost" onClick={() => setRemoveConfirm({ open: false, user: null })}>Cancel</button>
          <button
            className="bg-danger text-white px-4 py-2 rounded font-semibold hover:bg-red-700"
            onClick={() => removeConfirm.user && handleRemove(removeConfirm.user._id)}
            disabled={!removeConfirm.user || removeLoading === (removeConfirm.user && removeConfirm.user._id)}
          >
            {removeLoading === (removeConfirm.user && removeConfirm.user._id) ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </Modal>
      <Modal open={!!ticketDetail} onClose={() => setTicketDetail(null)} title={ticketDetail?.title}>
        {ticketDetail && (
          <div>
            <div className="mb-2 text-textSecondary-light dark:text-textSecondary-dark">{ticketDetail.description}</div>
            <div className="mb-2 flex gap-2 text-sm">
              <span className="px-2 py-1 rounded bg-info text-white">{ticketDetail.status}</span>
              <span className="px-2 py-1 rounded bg-accent text-white">{ticketDetail.priority}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <HiOutlineUser className="text-primary" />
              <span>{ticketDetail.assignee?.name || ticketDetail.assignee?.email || 'Unassigned'}</span>
            </div>
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Attachments</h4>
              <ul>
                {(ticketDetail.attachments || []).map(att => (
                  <li key={att.url} className="mb-2">
                    <a href={att.url} target="_blank" rel="noopener noreferrer" className="underline text-primary">{att.filename}</a>
                    {att.filename.match(/\.(jpg|jpeg|png|gif)$/i) && (
                      <img src={att.url} alt={att.filename} style={{ maxWidth: 120, marginTop: 4, borderRadius: 8 }} />
                    )}
                  </li>
                ))}
              </ul>
              <form onSubmit={handleUploadAttachment} className="flex gap-2 mt-2">
                <input type="file" onChange={e => setAttachmentFile(e.target.files[0])} />
                <button className="btn btn-primary" type="submit" disabled={!attachmentFile}>Upload</button>
              </form>
              {attachmentError && <div className="text-danger mt-1">{attachmentError}</div>}
            </div>
            {/* Comments Section */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2 text-textPrimary-light dark:text-textPrimary-dark">Comments</h4>
              {commentsLoading ? (
                <div className="flex items-center gap-2 text-textSecondary-light dark:text-textSecondary-dark" aria-busy="true" aria-live="polite">
                  <span className="loading loading-spinner loading-md"></span>
                  Loading comments...
                </div>
              ) : (
                <ul className="space-y-3 max-h-64 overflow-y-auto mb-2" aria-label="Comment list">
                  {comments.length === 0 ? (
                    <li className="text-textSecondary-light dark:text-textSecondary-dark italic">No comments yet.</li>
                  ) : comments.map(c => {
                    const canEdit = c.user?._id === user?._id || user?.role === 'admin';
                    return (
                      <li key={c._id} className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-gray-900 shadow border border-border-light dark:border-border-dark group transition hover:shadow-lg">
                        <Avatar name={c.user?.name || c.user?.email} size={7} />
                        <div className="flex-1">
                          <div className="font-semibold text-textPrimary-light dark:text-textPrimary-dark flex items-center gap-2">
                            {c.user?.name || c.user?.email}
                            {/* Optionally add role badge here */}
                          </div>
                          {editingCommentId === c._id ? (
                            <form className="flex gap-2 mt-1" onSubmit={e => { e.preventDefault(); handleEditCommentSave(c); }}>
                              <input className="input input-bordered flex-1" value={editingCommentText} onChange={e => setEditingCommentText(e.target.value)} autoFocus />
                              <button className="btn btn-primary btn-xs" type="submit" aria-label="Save comment">Save</button>
                              <button className="btn btn-ghost btn-xs" type="button" onClick={handleEditCommentCancel} aria-label="Cancel edit">Cancel</button>
                            </form>
                          ) : (
                            <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark" dangerouslySetInnerHTML={{ __html: highlightMentions(c.text) }}></div>
                          )}
                          <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1">{new Date(c.createdAt).toLocaleString()}</div>
                        </div>
                        {canEdit && editingCommentId !== c._id && (
                          <div className="flex flex-col gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconButton icon={HiPencil} label="Edit" tooltip="Edit comment" onClick={() => handleEditComment(c)} size="sm" />
                            <IconButton icon={HiTrash} label="Delete" color="danger" tooltip="Delete comment" onClick={() => window.confirm('Delete this comment?') && handleDeleteComment(c)} size="sm" />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <div className="relative mt-2">
                <form className="flex gap-2 mt-2 sm:static sm:mt-2 fixed bottom-0 left-0 w-full bg-card-light dark:bg-card-dark p-2 border-t border-border-light dark:border-border-dark z-10 sm:rounded-none rounded-b-xl" onSubmit={handleAddComment} aria-label="Add comment form">
                  <input ref={commentInputRef} className="input input-bordered flex-1" type="text" placeholder="Add a comment..." value={commentText} onChange={handleCommentInput} onKeyDown={handleMentionKeyDown} disabled={commentsLoading} aria-label="Comment input" autoComplete="off" />
                  <button className="btn btn-primary" type="submit" disabled={commentsLoading || !commentText.trim()} aria-label="Post comment">Post</button>
                  {/* @mention dropdown */}
                  {mentionDropdown.open && mentionDropdown.options.length > 0 && (
                    <ul className="absolute left-0 bottom-12 w-64 max-h-48 overflow-y-auto bg-white dark:bg-gray-900 border border-border-light dark:border-border-dark rounded-xl shadow-lg z-50 animate-fade-in">
                      {mentionDropdown.options.map((m, i) => (
                        <li key={m.user?._id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer ${i === mentionDropdown.index ? 'bg-blue-100 dark:bg-blue-800' : ''}`} onMouseDown={e => { e.preventDefault(); handleMentionSelect(m); }}>
                          <Avatar name={m.user?.name || m.user?.email} size={6} />
                          <span className="font-semibold">{m.user?.name || m.user?.email}</span>
                          <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark ml-2">{m.role}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </form>
              </div>
              {commentError && <div className="text-danger mt-1" role="alert">{commentError}</div>}
            </div>
          </div>
        )}
      </Modal>
      <button
        className="mb-4 text-primary hover:underline font-semibold flex items-center gap-1"
        onClick={() => navigate('/projects')}
        aria-label="Back to Projects"
      >
        ← Back to Projects
      </button>
      {loading ? (
        <div className="text-textSecondary-light dark:text-textSecondary-dark">Loading project...</div>
      ) : error ? (
        <div className="rounded-lg p-4 mb-4 bg-danger text-white font-sans animate-fade-in">{error}</div>
      ) : project ? (
        <>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-textPrimary-light dark:text-textPrimary-dark mb-1">{project.name}</h1>
            <p className="text-textSecondary-light dark:text-textSecondary-dark">{project.description}</p>
            <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark mb-1">Created: {new Date(project.createdAt).toLocaleString()}</div>
            <div className="flex gap-2 mt-2">
              {(project.members || []).map((m, i) => (
                <span key={m._id || m.email || i} className="rounded-full bg-primary text-white w-8 h-8 flex items-center justify-center font-bold" title={m.name || m.email}>{getInitials(m.name || m.email)}</span>
              ))}
            </div>
          </div>
          <div className="mb-6 border-b border-border-light dark:border-border-dark">
            <nav className="flex gap-6">
              {tabs.map(tab => (
                <button key={tab} className={`py-2 px-1 text-base font-semibold border-b-2 border-transparent focus:outline-none transition ${activeTab === tab ? 'text-primary border-primary' : 'text-textSecondary-light dark:text-textSecondary-dark hover:text-primary'}`} onClick={() => setActiveTab(tab)}>{tab}</button>
              ))}
            </nav>
          </div>
          {/* Tickets Tab */}
          {activeTab === 'Tickets' && project && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-textPrimary-light dark:text-textPrimary-dark">Tickets</h2>
                <button className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark" onClick={() => setShowCreate(v => !v)}>{showCreate ? 'Cancel' : '+ Create Ticket'}</button>
              </div>
              {showCreate && (
                <form className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6 mb-6 space-y-3" onSubmit={handleCreateSubmit} aria-label="Create Ticket Form">
                  <h3 className="text-lg font-semibold mb-2 text-textPrimary-light dark:text-textPrimary-dark">New Ticket</h3>
                  {createError && <div className="rounded-lg p-4 mb-2 bg-danger text-white font-sans animate-fade-in">{createError}</div>}
                  <input type="text" name="title" placeholder="Title" className="input input-bordered w-full mb-2" value={createForm.title} onChange={handleCreateChange} required aria-label="Title" />
                  <textarea name="description" placeholder="Description" className="textarea textarea-bordered w-full mb-2" value={createForm.description} onChange={handleCreateChange} aria-label="Description" />
                  <select name="priority" className="input input-bordered w-full mb-2" value={createForm.priority} onChange={handleCreateChange} aria-label="Priority">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                  <select name="status" className="input input-bordered w-full mb-2" value={createForm.status} onChange={handleCreateChange} aria-label="Status">
                    <option>Open</option>
                    <option>In Progress</option>
                    <option>Closed</option>
                  </select>
                  <button className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark w-full" type="submit" disabled={createLoading}>{createLoading ? 'Creating...' : 'Create Ticket'}</button>
                </form>
              )}
              <div className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6 text-textSecondary-light dark:text-textSecondary-dark">
                {tickets.length === 0 ? (
                  <div className="text-center">No tickets found for this project.</div>
                ) : (
                  <ul className="space-y-2">
                    {tickets.map(ticket => (
                      <li key={ticket._id} className="border-b border-border-light dark:border-border-dark pb-2 mb-2">
                        {editId === ticket._id ? (
                          <form className="space-y-2" onSubmit={handleEditSubmit} aria-label="Edit Ticket Form">
                            {editError && <div className="rounded-lg p-2 bg-danger text-white font-sans animate-fade-in">{editError}</div>}
                            <input type="text" name="title" className="input input-bordered w-full" value={editForm.title} onChange={handleEditChange} required aria-label="Title" />
                            <textarea name="description" className="textarea textarea-bordered w-full" value={editForm.description} onChange={handleEditChange} aria-label="Description" />
                            <select name="priority" className="input input-bordered w-full" value={editForm.priority} onChange={handleEditChange} aria-label="Priority">
                              <option>Low</option>
                              <option>Medium</option>
                              <option>High</option>
                            </select>
                            <select name="status" className="input input-bordered w-full" value={editForm.status} onChange={handleEditChange} aria-label="Status">
                              <option>Open</option>
                              <option>In Progress</option>
                              <option>Closed</option>
                            </select>
                            <div className="flex gap-2">
                              <button className="bg-primary text-white px-4 py-1 rounded font-semibold hover:bg-primary-dark" type="submit" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                              <button className="btn btn-ghost" type="button" onClick={() => setEditId(null)}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-primary text-white w-8 h-8 flex items-center justify-center font-bold cursor-pointer" title="View details" onClick={() => handleOpenTicketDetail(ticket)}>{getInitials(ticket.title)}</span>
                            <div className="flex-1 cursor-pointer" onClick={() => handleOpenTicketDetail(ticket)}>
                              <div className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">{ticket.title}</div>
                              <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark mb-1">Status: {ticket.status} | Priority: {ticket.priority} | Assignee: {ticket.assignee?.name || ticket.assignee?.email || 'Unassigned'}</div>
                            </div>
                            {canEditTicket(ticket) && <button className="btn btn-xs btn-outline" onClick={() => handleEditClick(ticket)}><HiOutlinePencil /></button>}
                            {canEditTicket(ticket) && <button className="btn btn-xs btn-error" onClick={() => handleDelete(ticket._id)} disabled={deleteLoading === ticket._id}><HiOutlineTrash />{deleteLoading === ticket._id ? '...' : ''}</button>}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
          {/* Kanban Tab */}
          {activeTab === 'Kanban' && project && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Kanban Board</h2>
              {kanbanLoading && <div className="flex items-center gap-2 mb-2"><span className="loading loading-spinner loading-md"></span> <span>Moving ticket...</span></div>}
              <div className="flex gap-4 overflow-x-auto md:flex-row flex-col md:items-stretch items-start">
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  {STATUS_OPTIONS.map(({ label, color }) => (
                    <div key={label} className="flex-1 min-w-[260px] bg-card-light dark:bg-card-dark rounded-xl shadow p-4 mb-4 md:mb-0" style={{ maxWidth: 400 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-3 h-3 rounded-full inline-block ${color}`}></span>
                        <h3 className="font-bold text-textPrimary-light dark:text-textPrimary-dark">{label}</h3>
                      </div>
                      <SortableContext items={groupedTickets[label].map(t => t._id)} strategy={verticalListSortingStrategy}>
                        <ul className="space-y-2 min-h-[60px]">
                          {groupedTickets[label].length === 0 ? (
                            <li className="text-center text-textSecondary-light dark:text-textSecondary-dark italic opacity-60 py-6">No tickets</li>
                          ) : groupedTickets[label].map(ticket => (
                            <li key={ticket._id} id={ticket._id} className={`relative rounded-xl p-4 shadow group border-l-8 ${statusColorClass(ticket.status)} transition-all duration-150 hover:scale-[1.03] hover:shadow-2xl cursor-pointer`}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${priorityBadgeClass(ticket.priority)}`} title={`Priority: ${ticket.priority}`}>{ticket.priority}</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${statusBadgeClass(ticket.status)}`} title={`Status: ${ticket.status}`}>{ticket.status}</span>
                                {ticket.tags && ticket.tags.map((tag, i) => (
                                  <span key={i} className="badge badge-outline text-xs" title={`Tag: ${tag}`}>{tag}</span>
                                ))}
                              </div>
                              <div className="font-semibold text-lg text-textPrimary-light dark:text-textPrimary-dark mb-1 line-clamp-1">{ticket.title}</div>
                              {ticket.description && <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark line-clamp-2 mb-2">{ticket.description}</div>}
                              <div className="flex items-center gap-2 mt-auto">
                                <span className="rounded-full bg-primary text-white w-8 h-8 flex items-center justify-center font-bold text-base border-2 border-white shadow" title={ticket.assignee?.name || ticket.assignee?.email || 'Unassigned'}>{assigneeInitials(ticket.assignee)}</span>
                                <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark" title={ticket.assignee?.name || ticket.assignee?.email || 'Unassigned'}>{ticket.assignee?.name || ticket.assignee?.email || 'Unassigned'}</span>
                              </div>
                              {/* Quick actions on hover */}
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canEditTicket(ticket) && <button className="btn btn-xs btn-outline" title="Edit ticket" aria-label="Edit ticket" onClick={e => { e.stopPropagation(); handleEditClick(ticket); }}><HiOutlinePencil /></button>}
                                <button className="btn btn-xs btn-outline" title="Comment" aria-label="Comment" onClick={e => { e.stopPropagation(); handleOpenTicketDetail(ticket); }}><HiOutlineUser /></button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </SortableContext>
                    </div>
                  ))}
                </DndContext>
              </div>
            </div>
          )}
          {/* Team Tab */}
          {activeTab === 'Team' && project && (
            <div className="mb-8 max-w-xl">
              <h2 className="text-xl font-semibold mb-4">Team Members</h2>
              {canManageProject && (
                <form onSubmit={handleInvite} className="flex gap-2 mb-4">
                  <input type="email" className="input input-bordered" placeholder="Invite by email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required disabled={inviteLoading} />
                  <button className="btn btn-primary" type="submit" disabled={inviteLoading}>{inviteLoading ? 'Inviting...' : 'Invite'}</button>
                </form>
              )}
              {inviteError && <div className="text-danger mb-2">{inviteError}</div>}
              <div>
                <h3 className="font-semibold mb-2">Members</h3>
                <ul>
                  {(project.members || []).map(m => (
                    <li key={m._id} className="flex items-center gap-2">{m.name || m.email}
                      {m._id === project.createdBy && <span className="badge badge-primary ml-2">Owner</span>}
                      {m.role === 'admin' && m._id !== project.createdBy && <span className="badge badge-warning ml-2">Admin</span>}
                      {m.role !== 'admin' && m._id !== project.createdBy && <span className="badge badge-neutral ml-2">Member</span>}
                      {canManageProject && m._id !== project.createdBy && (
                        <button onClick={() => handleRemove(m._id)} className="btn btn-xs btn-error ml-2">Remove</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mt-4 mb-2">Pending Invites</h3>
                <ul>
                  {(project.pendingInvites || []).map((inv, i) => (
                    <li key={inv.email + (inv.invitedAt || i)}>{inv.email} (Invited by {getUserName(inv.invitedBy)})
                      {canManageProject && (
                        <button onClick={() => handleCancelInvite(inv.email)} className="btn btn-xs btn-warning ml-2" disabled={cancelInviteLoading === inv.email}>{cancelInviteLoading === inv.email ? 'Cancelling...' : 'Cancel'}</button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {isUserInvited && (
                <div className="mt-4">
                  <button onClick={handleAcceptInvite} className="btn btn-success mr-2">Accept Invite</button>
                  <button onClick={handleDeclineInvite} className="btn btn-ghost">Decline</button>
                </div>
              )}
            </div>
          )}
          {/* Activity Tab */}
          {activeTab === 'Activity' && project && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Activity Logs</h2>
              <div className="flex items-center gap-4 mb-4">
                <label htmlFor="activity-filter" className="text-sm font-semibold text-textSecondary-light dark:text-textSecondary-dark">Filter:</label>
                <select id="activity-filter" className="input input-bordered w-40" value={activityFilter} onChange={e => setActivityFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="bug">Bugs</option>
                  <option value="member">Members</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6">
                {activityLoading ? (
                  <div className="text-center text-textSecondary-light dark:text-textSecondary-dark"><span className="loading loading-spinner loading-md"></span> Loading activity...</div>
                ) : activityError ? (
                  <div className="rounded-lg p-4 mb-4 bg-danger text-white font-sans animate-fade-in">{activityError}</div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-textSecondary-light dark:text-textSecondary-dark text-center italic opacity-70">No activity yet for this project.</div>
                ) : (
                  <ul className="space-y-4">
                    {filteredLogs.map(log => {
                      const typeInfo = activityTypeMap[log.type] || activityTypeMap.default;
                      return (
                        <li key={log._id} className="flex items-start gap-3 p-3 rounded-lg bg-background-light dark:bg-background-dark shadow-sm border-l-4" style={{ borderColor: typeInfo.icon.props.className.includes('danger') ? '#ef4444' : typeInfo.icon.props.className.includes('warning') ? '#f59e42' : typeInfo.icon.props.className.includes('success') ? '#22c55e' : typeInfo.icon.props.className.includes('info') ? '#3b82f6' : '#6366f1' }}>
                          <span className="mt-1">{typeInfo.icon}</span>
                          <div className="flex-1">
                            <div className="font-semibold text-textPrimary-light dark:text-textPrimary-dark">{log.user?.name || log.user?.email || 'User'}</div>
                            <div className="text-sm text-textSecondary-light dark:text-textSecondary-dark">{log.message}</div>
                            <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1">{typeInfo.label} • {log.type.replace('_', ' ')} • {new Date(log.createdAt).toLocaleString()}</div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          )}
          {/* Settings Tab */}
          {activeTab === 'Settings' && project && (
            <div className="mb-8 max-w-xl">
              <h2 className="text-xl font-semibold mb-4 text-textPrimary-light dark:text-textPrimary-dark">Project Settings</h2>
              <form className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6 space-y-4" onSubmit={handleSettingsSave}>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-textSecondary-light dark:text-textSecondary-dark" htmlFor="project-name">Project Name</label>
                  <input id="project-name" className="input input-bordered w-full" type="text" name="name" value={settingsForm.name} onChange={handleSettingsChange} required disabled={settingsLoading || !canManageProject} title={!canManageProject ? 'Only the owner or admin can edit project settings' : ''} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-textSecondary-light dark:text-textSecondary-dark" htmlFor="project-desc">Description</label>
                  <textarea id="project-desc" className="textarea textarea-bordered w-full" name="description" value={settingsForm.description} onChange={handleSettingsChange} required disabled={settingsLoading || !canManageProject} title={!canManageProject ? 'Only the owner or admin can edit project settings' : ''} />
                </div>
                <button className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark" type="submit" disabled={settingsLoading || !canManageProject} title={!canManageProject ? 'Only the owner or admin can save changes' : ''}>{settingsLoading ? 'Saving...' : 'Save Changes'}</button>
                {settingsError && <div className="rounded-lg p-2 mt-2 bg-danger text-white font-sans animate-fade-in">{settingsError}</div>}
              </form>
              <div className="rounded-xl bg-card-light dark:bg-card-dark shadow p-6 mt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-textSecondary-light dark:text-textSecondary-dark">Archive Project:</span>
                  <button className={`px-4 py-2 rounded font-semibold ${project.archived ? 'bg-warning text-white' : 'bg-success text-white'} hover:opacity-90`} onClick={handleArchiveToggle} disabled={archiveLoading || !canManageProject} title={!canManageProject ? 'Only the owner or admin can archive/unarchive' : ''}>{archiveLoading ? 'Updating...' : project.archived ? 'Unarchive' : 'Archive'}</button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-textSecondary-light dark:text-textSecondary-dark">Transfer Ownership:</span>
                  <select className="input input-bordered w-48" value={newOwnerId} onChange={e => setNewOwnerId(e.target.value)} disabled={transferLoading || !canManageProject} title={!canManageProject ? 'Only the owner or admin can transfer ownership' : ''}>
                    <option value="">Select member</option>
                    {(project.members || []).filter(m => m._id !== project.createdBy).map(m => (
                      <option key={m._id} value={m._id}>{m.name || m.email}</option>
                    ))}
                  </select>
                  <button className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark" onClick={handleTransfer} disabled={transferLoading || !newOwnerId || !canManageProject} title={!canManageProject ? 'Only the owner or admin can transfer ownership' : ''}>{transferLoading ? 'Transferring...' : 'Transfer'}</button>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <button className="bg-danger text-white px-4 py-2 rounded font-semibold hover:bg-red-700" onClick={() => setShowDeleteModal(true)} disabled={deleteLoading || !canManageProject} title={!canManageProject ? 'Only the owner or admin can delete the project' : ''}>Delete Project</button>
                </div>
              </div>
              <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Project?">
                <div className="mb-4">Are you sure you want to delete this project? This action cannot be undone.</div>
                <div className="flex gap-2 justify-end">
                  <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                  <button className="bg-danger text-white px-4 py-2 rounded font-semibold hover:bg-red-700" onClick={handleProjectDelete} disabled={deleteLoading || !canManageProject}>{deleteLoading ? 'Deleting...' : 'Delete'}</button>
                </div>
              </Modal>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
} 
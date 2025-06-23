import React, { useState, useEffect, useRef } from 'react';
import { HiBell, HiSun, HiMoon, HiLogout, HiPlus, HiOutlineUserCircle, HiOutlineCog, HiOutlineLogout } from 'react-icons/hi';
import { useNavigate, NavLink } from 'react-router-dom';
import AdvancedSearch from './AdvancedSearch'; // Assuming AdvancedSearch is in the same folder
import { authFetch } from '../utils/authFetch';
import { io } from 'socket.io-client';
import { UserPlus, FolderPlus, Bug as BugIcon, Search } from 'lucide-react';

function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase();
}

const Dropdown = ({ trigger, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setIsOpen((open) => !open)}>{trigger}</div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface-light dark:bg-surface-dark rounded-md shadow-lg py-1 z-50 border border-border-light dark:border-border-dark animate-fade-in-fast">
          {children}
        </div>
      )}
    </div>
  );
};

export default function Header({ 
  user, 
  onLogout, 
  theme, 
  toggleTheme, 
  profileOpen, 
  setProfileOpen, 
  showDashboardControls,
  onSearch,
  onClearSearch,
  onSaveSearch,
  onLoadSearch,
  projects,
  users,
  savedSearches,
  onCreateBug
}) {
  const isDark = theme === 'dark';
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifError, setNotifError] = useState('');
  const [notifLoading, setNotifLoading] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const navigate = useNavigate();
  const notifRef = useRef();

  useEffect(() => {
    const fetchNotifications = async () => {
      setNotifLoading(true);
      try {
        const res = await authFetch('/api/auth/notifications');
        if (!res.ok) throw new Error('Failed to fetch notifications');
        const data = await res.json();
        setNotifications(data);
      } catch (err) {
        setNotifError('Could not load notifications');
      } finally {
        setNotifLoading(false);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, { transports: ['websocket'] });
    socket.on('notification', ({ userId, notification }) => {
      if (user && user._id === userId) {
        setNotifications(n => [notification, ...n]);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [user && user._id]);

  const markAsRead = async id => {
    try {
      await authFetch(`/api/auth/notifications/${id}/read`, {
        method: 'PATCH',
      });
      setNotifications(n => n.map(notif => notif._id === id ? { ...notif, read: true } : notif));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await authFetch('/api/auth/notifications/read-all', {
        method: 'PATCH',
      });
      setNotifications(n => n.map(notif => ({ ...notif, read: true })));
    } catch {}
  };

  const handleNotifClick = () => setNotifOpen((open) => !open);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notifOpen]);

  return (
    <header className="flex items-center justify-end h-16 px-6 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <AdvancedSearch onSearch={onSearch} onClearSearch={onClearSearch} onSaveSearch={onSaveSearch} onLoadSearch={onLoadSearch} projects={projects} users={users} savedSearches={savedSearches} />
          <Dropdown
            trigger={
              <button type="button" className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                <HiPlus />
                Create
              </button>
            }
          >
            <button
              onClick={() => navigate('/projects/create')}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
            >
              <FolderPlus size={18} /> Create Project
            </button>
            <button
              onClick={() => navigate('/invite')}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
            >
              <UserPlus size={18} /> Invite Member
            </button>
            <button
              onClick={() => navigate('/bugs/new')}
              className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary/10 focus:bg-primary/10 focus:outline-none"
            >
              <BugIcon size={18} /> Report Bug
            </button>
          </Dropdown>
        </div>
        <Dropdown
          trigger={
            <button type="button" className="p-2 rounded-full hover:bg-primary/10 text-text-secondary-light dark:text-text-secondary-dark relative" aria-label="Notifications" onClick={handleNotifClick}>
              <HiBell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-danger text-white rounded-full text-xs w-5 h-5 flex items-center justify-center animate-bounce" aria-label={`${unreadCount} unread notifications`}>{unreadCount}</span>
              )}
            </button>
          }
        >
          {notifOpen && (
            <div ref={notifRef} className="absolute right-0 mt-2 w-80 bg-surface-light dark:bg-surface-dark rounded-md shadow-lg py-2 z-50 border border-border-light dark:border-border-dark animate-fade-in-fast" role="menu" aria-label="Notifications dropdown">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border-light dark:border-border-dark">
                <span className="font-semibold">Notifications</span>
                <button className="btn btn-xs btn-outline" onClick={markAllAsRead} disabled={notifLoading || notifications.length === 0} aria-label="Mark all as read">Mark all as read</button>
              </div>
              {notifLoading ? (
                <div className="flex items-center gap-2 px-4 py-4 text-textSecondary-light dark:text-textSecondary-dark"><span className="loading loading-spinner loading-md"></span> Loading...</div>
              ) : notifError ? (
                <div className="px-4 py-4 text-danger">{notifError}</div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-4 text-textSecondary-light dark:text-textSecondary-dark italic">No notifications</div>
              ) : (
                <ul className="max-h-72 overflow-y-auto" aria-label="Notification list">
                  {notifications.map(n => (
                    <li key={n._id} className={`px-4 py-3 border-b border-border-light dark:border-border-dark cursor-pointer transition ${!n.read ? 'bg-primary/10 font-semibold' : ''}`} tabIndex={0} role="menuitem" aria-label={n.message} onClick={() => markAsRead(n._id)} onKeyDown={e => { if (e.key === 'Enter') markAsRead(n._id); }}>
                      <div className="text-sm text-textPrimary-light dark:text-textPrimary-dark">{n.message}</div>
                      <div className="text-xs text-textSecondary-light dark:text-textSecondary-dark mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Dropdown>

        {user && (
          <Dropdown
            trigger={
              <button type="button" className="flex items-center justify-center h-9 w-9 bg-primary/20 rounded-full text-primary font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                {getInitials(user.name)}
              </button>
            }
          >
            <div className="px-4 py-3 border-b border-border-light dark:border-border-dark">
              <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark truncate">{user.name}</p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <NavLink to="/profile" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary/10">
                <HiOutlineUserCircle className="h-5 w-5" /> Profile
              </NavLink>
              <NavLink to="/settings" className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-text-primary-light dark:text-text-primary-dark hover:bg-primary/10">
                <HiOutlineCog className="h-5 w-5" /> Settings
              </NavLink>
            </div>
            <div className="py-1 border-t border-border-light dark:border-border-dark">
              <button onClick={onLogout} className="flex items-center gap-3 w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10">
                <HiOutlineLogout className="h-5 w-5" /> Logout
              </button>
            </div>
          </Dropdown>
        )}
      </div>
    </header>
  );
} 
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { authFetch } from '../utils/authFetch';
import { HiMenu } from 'react-icons/hi';

export default function Layout() {
  // --- Theme Management ---
  const getInitialTheme = () => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  };
  const [theme, setTheme] = useState(getInitialTheme);
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  
  // --- Sidebar State ---
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // --- User & Auth Management ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const baseUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    console.log('Layout useEffect running. Path:', window.location.pathname, 'Token:', localStorage.getItem('token'));
    const fetchUser = async () => {
      console.log('Layout: Checking for token...');
      const token = localStorage.getItem('token');
      const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
      const isPublicRoute = publicRoutes.some(route => window.location.pathname.startsWith(route));
      if (!token && !isPublicRoute) {
        console.log('Layout: No token found, redirecting to login.');
        setLoading(false);
        setTimeout(() => navigate('/login'), 100);
        return;
      }
      
      console.log('Layout: Token found. Verifying with server...');
      try {
        const res = await authFetch('/api/auth/me');

        console.log('Layout: Server responded with status:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('Layout: User verified successfully.', data);
          setUser(data);
        } else {
          console.error('Layout: Token verification failed. Clearing token and redirecting to login.');
          localStorage.removeItem('token');
          navigate('/login');
        }
      } catch (error) {
        console.error("Layout: Error fetching user. Clearing token and redirecting to login.", error);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <p className="text-text-primary-light dark:text-text-primary-dark">Loading application...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-background-light dark:bg-background-dark relative">
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileSidebarOpen(false)} />
      )}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        theme={theme}
        toggleTheme={toggleTheme}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} md:ml-64`} style={{ minWidth: 0 }}>
        {/* Header with mobile menu button */}
        <div className="md:hidden flex items-center h-16 px-4 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
          <button className="mr-4 p-2 rounded hover:bg-primary/10 focus:outline-none" onClick={() => setMobileSidebarOpen(true)}>
            <HiMenu className="h-6 w-6" />
          </button>
          <Header user={user} onLogout={handleLogout} />
        </div>
        {/* Desktop Header */}
        <div className="hidden md:block">
          <Header user={user} onLogout={handleLogout} />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet context={{ user, theme, toggleTheme }} />
        </main>
      </div>
    </div>
  );
} 
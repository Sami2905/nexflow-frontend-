import React from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/nexflow-logo.svg';
import { 
  HiOutlineChartPie, 
  HiOutlineFolder, 
  HiOutlineCog, 
  HiOutlineChevronDoubleLeft, 
  HiOutlineChevronDoubleRight, 
  HiOutlineSun, 
  HiOutlineMoon, 
} from 'react-icons/hi';
import { Bug } from 'lucide-react';

const NAV_LINKS = [
  { name: 'Dashboard', to: '/', icon: HiOutlineChartPie },
  { name: 'Projects', to: '/projects', icon: HiOutlineFolder },
  { name: 'Bugs', to: '/bugs', icon: Bug },
  { name: 'Settings', to: '/settings', icon: HiOutlineCog },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, theme, toggleTheme, mobileOpen = false, onCloseMobile }) {

  return (
    <aside 
      className={`fixed md:static top-0 left-0 h-full z-40 md:z-auto transition-transform duration-300 ease-in-out bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark flex flex-col 
        ${isCollapsed ? 'w-20' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        md:h-auto
      `}
      style={{ minWidth: 0 }}
    >
      {/* Mobile Close Button */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 border-b border-border-light dark:border-border-dark">
        <img src={logo} alt="NexFlow" className="h-8 w-auto" />
        <button onClick={onCloseMobile} className="p-2 rounded hover:bg-primary/10 focus:outline-none">
          <HiOutlineChevronDoubleLeft className="h-6 w-6" />
        </button>
      </div>
      {/* Header (desktop) */}
      <div className="hidden md:flex items-center h-16 px-4 border-b border-border-light dark:border-border-dark">
        <img src={logo} alt="NexFlow" className={`h-8 w-auto transition-all duration-300 ease-in-out ${isCollapsed ? 'mx-auto' : ''}`} />
        <span className={`text-xl font-bold ml-3 text-text-primary-light dark:text-text-primary-dark transition-all duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>NexFlow</span>
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-2">
        {NAV_LINKS.map(link => (
          <NavLink
            key={link.name}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => 
              `flex items-center p-2 rounded-md text-sm font-medium transition-all duration-200 ease-in-out
              ${isActive ? 'bg-primary/10 text-primary' : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/5 hover:scale-[1.04] active:scale-95'}
              ${isCollapsed ? 'justify-center' : ''}`
            }
            onClick={onCloseMobile}
          >
            <link.icon className={`h-6 w-6 transition-all duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-100 mr-3'}`} />
            <span className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>{!isCollapsed && link.name}</span>
          </NavLink>
        ))}
      </nav>
      {/* Footer (Collapse/Theme Toggle) */}
      <div className="px-3 py-4 border-t border-border-light dark:border-border-dark">
        <button
          onClick={toggleTheme}
          className={`flex items-center w-full p-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/5 hover:scale-105 active:scale-95 mb-2 transition-all duration-200
          ${isCollapsed ? 'justify-center' : ''}`}
        >
          {theme === 'dark' ? <HiOutlineSun className="h-6 w-6 transition-all duration-300" /> : <HiOutlineMoon className="h-6 w-6 transition-all duration-300" />}
          <span className={`ml-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>{!isCollapsed && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}</span>
        </button>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center w-full p-2 rounded-md text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/5 hover:scale-105 active:scale-95 transition-all duration-200
          ${isCollapsed ? 'justify-center' : ''}`}
        >
          {isCollapsed ? <HiOutlineChevronDoubleRight className="h-6 w-6 transition-all duration-300" /> : <HiOutlineChevronDoubleLeft className="h-6 w-6 transition-all duration-300" />}
          <span className={`ml-3 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>{!isCollapsed && 'Collapse'}</span>
        </button>
      </div>
    </aside>
  );
} 
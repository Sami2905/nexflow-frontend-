import React from 'react';

export default function SpinnerOverlay({ message = 'Loading...', className = '' }) {
  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/30 backdrop-blur-sm ${className}`} role="status" aria-live="polite">
      <svg className="animate-spin h-12 w-12 text-primary mb-4" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle className="opacity-20" cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="6" />
        <path className="opacity-80" d="M45 25c0-11.046-8.954-20-20-20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      </svg>
      <span className="text-lg font-medium text-textPrimary-light dark:text-textPrimary-dark animate-fade-in-fast">{message}</span>
    </div>
  );
} 
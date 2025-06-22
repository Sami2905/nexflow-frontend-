import React from 'react';

export default function IconButton({ icon: Icon, label, onClick, color = 'primary', size = 'md', tooltip }) {
  const colorClass = color === 'danger' ? 'text-red-600 hover:bg-red-100' : color === 'info' ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-700 hover:bg-gray-100';
  const sizeClass = size === 'sm' ? 'p-1' : size === 'lg' ? 'p-3' : 'p-2';
  return (
    <button
      className={`rounded-full transition ${colorClass} ${sizeClass}`}
      aria-label={label}
      title={tooltip || label}
      onClick={onClick}
      type="button"
    >
      <Icon className="w-5 h-5" />
    </button>
  );
} 
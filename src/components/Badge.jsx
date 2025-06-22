import React from 'react';

const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-700 border-blue-400',
  'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-400',
  Closed: 'bg-green-100 text-green-700 border-green-400',
  'In Review': 'bg-purple-100 text-purple-700 border-purple-400',
};
const PRIORITY_COLORS = {
  High: 'bg-red-100 text-red-700 border-red-400',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-400',
  Low: 'bg-gray-100 text-gray-700 border-gray-400',
};

export default function Badge({ label, type = 'status', icon: Icon }) {
  const colorClass = type === 'priority' ? PRIORITY_COLORS[label] : STATUS_COLORS[label] || 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${colorClass}`}
      title={label}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </span>
  );
} 
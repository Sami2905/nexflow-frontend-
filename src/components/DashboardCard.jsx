import React from 'react';

export default function DashboardCard({ title, icon, value, color = 'primary' }) {
  // Semantic color classes for status icons
  const iconColorMap = {
    accent: 'text-accent',
    warning: 'text-warning',
    danger: 'text-danger',
    info: 'text-info',
    default: 'text-primary',
  };
  const iconClass = iconColorMap[color] || iconColorMap.default;

  return (
    <div className="rounded-xl p-6 flex items-center gap-6 shadow-md transition-all duration-300 bg-card-light dark:bg-card-dark text-textPrimary-light dark:text-textPrimary-dark font-sans hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
         aria-label={title}>
      <div className={`w-12 h-12 flex items-center justify-center text-3xl ${iconClass}`}>{icon}</div>
      <div>
        <div className="text-base font-semibold mb-1 text-textSecondary-light dark:text-textSecondary-dark">{title}</div>
        <div className="text-4xl font-bold leading-tight">{value}</div>
      </div>
    </div>
  );
} 
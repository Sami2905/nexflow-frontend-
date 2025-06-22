import React from 'react';

export default function Avatar({ name = '', src = '', size = 8 }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  const sizeClass = `w-${size} h-${size}`;
  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${sizeClass} border-2 border-white shadow`} title={name} />;
  }
  return (
    <span className={`rounded-full bg-primary text-white flex items-center justify-center font-bold text-base border-2 border-white shadow ${sizeClass}`} title={name}>
      {initials}
    </span>
  );
} 
import React, { useEffect } from 'react';
import { HiCheckCircle, HiExclamationCircle, HiInformationCircle, HiX } from 'react-icons/hi';

export default function Toast({ toasts, removeToast }) {
  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map(t => setTimeout(() => removeToast(t.id), t.duration || 3500));
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  const iconMap = {
    success: <HiCheckCircle className="text-success text-2xl mr-2" />, // checkmark
    error: <HiExclamationCircle className="text-danger text-2xl mr-2" />,
    info: <HiInformationCircle className="text-info text-2xl mr-2" />,
  };

  const bgMap = {
    success: 'bg-green-50 border-green-400 text-green-900',
    error: 'bg-red-50 border-red-400 text-red-900',
    info: 'bg-blue-50 border-blue-400 text-blue-900',
  };

  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 items-end max-w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          role="alert"
          aria-live="assertive"
          tabIndex={0}
          className={`rounded-xl shadow-2xl border px-5 py-3 min-w-[220px] max-w-xs font-semibold animate-toast-in flex items-center gap-2 cursor-pointer focus:ring-2 focus:ring-primary outline-none transition-all duration-150 ${bgMap[t.type]}`}
          onClick={() => removeToast(t.id)}
        >
          {iconMap[t.type]}
          <span className="flex-1 break-words">{t.message}</span>
          <button
            className="ml-2 text-xl text-textSecondary-light dark:text-textSecondary-dark hover:text-danger focus:outline-none rounded-full transition-colors duration-150"
            onClick={e => { e.stopPropagation(); removeToast(t.id); }}
            aria-label="Close notification"
            tabIndex={0}
          >
            <HiX />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes toast-in { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: none; } }
        .animate-toast-in { animation: toast-in 0.25s cubic-bezier(.4,1.4,.6,1) both; }
      `}</style>
    </div>
  );
} 
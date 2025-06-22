import React, { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children }) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    // Focus trap
    const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length) focusable[0].focus();
    const handleKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab' && focusable.length > 1) {
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={modalRef}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-border-light dark:border-border-dark max-w-lg w-full mx-4 p-6 relative animate-modal-in transition-transform duration-200">
        <button
          className="absolute top-3 right-3 text-textSecondary-light dark:text-textSecondary-dark hover:text-danger focus:ring-2 focus:ring-primary focus:outline-none text-2xl font-bold rounded-full transition-colors duration-150"
          onClick={onClose}
          aria-label="Close dialog"
          tabIndex={0}
        >
          ×
        </button>
        {title && <h2 id="modal-title" className="text-xl font-bold mb-4 text-textPrimary-light dark:text-textPrimary-dark">{title}</h2>}
        <div>{children}</div>
      </div>
      <style>{`
        @keyframes modal-in { from { transform: translateY(40px) scale(0.98); opacity: 0; } to { transform: none; opacity: 1; } }
        .animate-modal-in { animation: modal-in 0.22s cubic-bezier(.4,1.4,.6,1) both; }
      `}</style>
    </div>
  );
} 
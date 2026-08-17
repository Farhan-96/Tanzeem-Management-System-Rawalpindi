import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  printFriendly?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-xl',
  printFriendly = false,
}) => {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-black/60 backdrop-blur-xs ${
        printFriendly ? 'print:static print:bg-white print:p-0 print:inset-auto print:overflow-visible' : ''
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="flex min-h-[100dvh] sm:min-h-full items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className={`bg-white w-full ${maxWidth} rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden ${
            printFriendly
              ? 'print:h-auto print:shadow-none print:border-0 print:rounded-none print:my-0 print:max-w-none print:max-h-none print:overflow-visible print:p-0'
              : ''
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

interface ModalHeaderProps {
  children: React.ReactNode;
  onClose: () => void;
  closeId?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, onClose, closeId }) => (
  <div className="flex items-start sm:items-center justify-between gap-3 border-b border-slate-100 px-4 sm:px-6 pt-[max(1rem,env(safe-area-inset-top))] sm:pt-6 pb-3 shrink-0 print:hidden">
    <div className="min-w-0 flex-1">{children}</div>
    <button
      type="button"
      id={closeId}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
      className="shrink-0 text-slate-400 hover:text-slate-600 p-2.5 -mr-1 cursor-pointer transition-colors rounded-lg hover:bg-slate-100"
      aria-label="Close modal"
    >
      <X className="w-5 h-5 pointer-events-none" />
    </button>
  </div>
);

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className = '' }) => (
  <div className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 ${className}`}>
    {children}
  </div>
);

interface ModalFooterProps {
  children: React.ReactNode;
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children }) => (
  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-4 sm:px-6 py-3 border-t border-slate-100 bg-white shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
    {children}
  </div>
);

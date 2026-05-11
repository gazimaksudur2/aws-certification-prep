import { useEffect } from 'react';

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div className="relative w-full max-w-3xl card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            {title && (
              <div className="text-lg font-extrabold leading-tight">{title}</div>
            )}
          </div>
          <button type="button" onClick={onClose} className="btn-ghost px-3 py-2">
            Close
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-auto">{children}</div>
      </div>
    </div>
  );
}


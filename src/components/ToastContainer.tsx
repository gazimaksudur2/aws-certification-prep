import type { ToastKind } from '../hooks/useToast';

interface Toast { id: number; kind: ToastKind; message: string; }
interface Props { toasts: Toast[]; }

export function ToastContainer({ toasts }: Props) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl border text-sm font-semibold shadow-2xl animate-slide-up backdrop-blur-sm pointer-events-auto transition-all ${
            t.kind === 'correct'
              ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-900/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {t.kind === 'correct' ? '✓ ' : '✗ '}{t.message}
        </div>
      ))}
    </div>
  );
}

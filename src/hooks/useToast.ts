import { useCallback, useRef, useState } from 'react';

export type ToastKind = 'correct' | 'incorrect';

interface Toast { id: number; kind: ToastKind; message: string; }

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const show = useCallback((kind: ToastKind, message: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  }, []);

  return { toasts, show };
}

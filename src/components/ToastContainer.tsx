import React from 'react';
import { CheckCircle2, Info, AlertTriangle, X, RotateCcw } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { ToastItem } from '../types/task';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
  onUndo: (taskId: string, toastId: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  onUndo,
}) => {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon =
            toast.variant === 'warning'
              ? AlertTriangle
              : toast.variant === 'info'
                ? Info
                : CheckCircle2;

          const iconColor =
            toast.variant === 'warning'
              ? 'text-amber-500'
              : toast.variant === 'info'
                ? 'text-blue-500'
                : 'text-emerald-500';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 shadow-lg"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} aria-hidden="true" />
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                  {toast.message}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {toast.undoTaskId && (
                  <button
                    type="button"
                    onClick={() => onUndo(toast.undoTaskId!, toast.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors whitespace-nowrap"
                  >
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    <span>{toast.undoLabel ?? 'Undo'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

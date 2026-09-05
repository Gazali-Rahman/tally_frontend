import React, { useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Trash2, X, Bell } from 'lucide-react';

export const ToastNotification = ({ notification, onClose }) => {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const { type, title, message } = notification;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[70] pointer-events-none animate-slideDown">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-3.5 flex items-start gap-3 transition-all">
        <div className="shrink-0 mt-0.5">
          {type === 'income' ? (
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowUpCircle className="w-4 h-4" />
            </div>
          ) : type === 'expense' ? (
            <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <ArrowDownCircle className="w-4 h-4" />
            </div>
          ) : type === 'deleted' ? (
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Trash2 className="w-4 h-4" />
            </div>
          ) : (
            <div className="p-1.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <Bell className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <p className="text-xs font-bold text-slate-900 leading-tight">
            {title || 'Pembaruan Dompet'}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
            {message}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

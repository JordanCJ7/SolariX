import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const Toast = ({ type = 'info', message, onClose, duration = 6000 }) => {
  useEffect(() => {
    if (!duration || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-rose-950/90 border-rose-500/50 text-rose-200',
      icon: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-950/90 border-amber-500/50 text-amber-200',
      icon: <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-slate-900/90 border-slate-700 text-slate-200',
      icon: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />,
    },
  };

  const current = styles[type] || styles.info;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-slide-up">
      <div
        className={`flex items-start justify-between p-4 rounded-xl border shadow-2xl backdrop-blur-md ${current.bg}`}
      >
        <div className="flex items-start space-x-3">
          {current.icon}
          <div className="text-sm font-medium leading-relaxed pr-2">{message}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;

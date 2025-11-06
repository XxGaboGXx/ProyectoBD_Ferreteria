// src/hooks/ToastContainer.tsx
import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import type { Toast } from './useToast';

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="text-green-500 text-xl" />;
      case 'error':
        return <FaExclamationCircle className="text-red-500 text-xl" />;
      case 'warning':
        return <FaExclamationTriangle className="text-yellow-500 text-xl" />;
      case 'info':
        return <FaInfoCircle className="text-blue-500 text-xl" />;
    }
  };

  const getBgColor = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-2 ${getBgColor(
            toast.type
          )} animate-slide-in-right min-w-[300px] max-w-[400px]`}
        >
          {getIcon(toast.type)}
          <p className="flex-1 text-gray-800 font-medium">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <FaTimes />
          </button>
        </div>
      ))}
    </div>
  );
};

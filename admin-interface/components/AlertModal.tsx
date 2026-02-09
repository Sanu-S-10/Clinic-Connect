import React from 'react';

export interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AlertModalProps {
  state: AlertState;
  onClose: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({ state, onClose }) => {
  if (!state.isOpen) return null;

  const config = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      headerBg: 'bg-green-50',
      headerText: 'text-green-600',
      bodyText: 'text-green-800',
      button: 'bg-green-600 hover:bg-green-700',
      icon: '✓'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      headerBg: 'bg-red-50',
      headerText: 'text-red-600',
      bodyText: 'text-red-800',
      button: 'bg-red-600 hover:bg-red-700',
      icon: '✕'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      headerBg: 'bg-yellow-50',
      headerText: 'text-yellow-600',
      bodyText: 'text-yellow-800',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      icon: '⚠'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      headerBg: 'bg-blue-50',
      headerText: 'text-blue-600',
      bodyText: 'text-blue-800',
      button: 'bg-blue-600 hover:bg-blue-700',
      icon: 'ℹ'
    }
  };

  const colors = config[state.type];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 min-h-screen">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className={`${colors.headerBg} px-8 py-6 border-b ${colors.border}`}>
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${colors.headerText}`}>{colors.icon}</span>
            <h2 className={`text-2xl font-bold ${colors.headerText}`}>{state.title}</h2>
          </div>
        </div>

        <div className="px-8 py-6">
          <p className={`${colors.bodyText} text-sm leading-relaxed`}>{state.message}</p>
        </div>

        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className={`px-6 py-2 ${colors.button} text-white rounded-lg transition-colors font-semibold`}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;

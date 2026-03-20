import React from 'react';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
}

interface ConfirmDialogProps {
  state: ConfirmDialogState;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ state, onConfirm, onCancel }) => {
  if (!state.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 min-h-screen">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">{state.title}</h2>
        </div>
        <div className="px-8 py-6">
          <p className="text-gray-700 text-sm leading-relaxed">{state.message}</p>
        </div>
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

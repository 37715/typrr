import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmationText, setConfirmationText] = useState('');

  const resetModal = () => {
    setStep(1);
    setConfirmationText('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handleConfirm = () => {
    if (confirmationText.toLowerCase() === 'delete') {
      onConfirm();
      resetModal();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-md w-full mx-4 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              delete account
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Initial Warning */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-zinc-700 dark:text-zinc-300">
              this will permanently delete your account and all associated data:
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <ul className="space-y-1 text-sm text-red-800 dark:text-red-200">
                <li>• your username and profile</li>
                <li>• all typing statistics</li>
                <li>• practice history</li>
                <li>• daily challenge progress</li>
              </ul>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
              this action cannot be undone.
            </p>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                cancel
              </button>
              <button
                onClick={handleNextStep}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Final Warning */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-zinc-700 dark:text-zinc-300 font-medium">
              last chance!
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              your account and all data will be permanently deleted. this cannot be recovered.
            </p>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                in the next step, you'll need to type <span className="font-mono bg-zinc-200 dark:bg-zinc-700 px-1 py-0.5 rounded">delete</span> to confirm.
              </p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                cancel
              </button>
              <button
                onClick={handleNextStep}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                i understand
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Type to Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-zinc-700 dark:text-zinc-300">
              type <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-red-600 dark:text-red-400 font-medium">delete</span> to confirm account deletion:
            </p>
            
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="type here..."
              disabled={isDeleting}
            />
            
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isDeleting || confirmationText.toLowerCase() !== 'delete'}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                {isDeleting ? 'deleting...' : 'delete account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
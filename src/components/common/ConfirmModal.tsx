import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, AlertTriangle, Info, X } from 'lucide-react';

export const ConfirmModal: React.FC = () => {
  const { confirmModal, closeConfirmModal } = useApp();

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && confirmModal) {
        if (confirmModal.onCancel) {
          confirmModal.onCancel();
        }
        closeConfirmModal();
      }
    };

    if (confirmModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmModal, closeConfirmModal]);

  if (!confirmModal) return null;

  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmVariant = 'danger',
    onConfirm,
    onCancel
  } = confirmModal;

  const handleConfirm = () => {
    onConfirm();
    closeConfirmModal();
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    closeConfirmModal();
  };

  const getVariantStyles = () => {
    switch (confirmVariant) {
      case 'danger':
        return {
          iconBox: 'bg-rose-50 text-rose-600 border-rose-200',
          icon: <Trash2 className="w-5 h-5 text-rose-600" />,
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white'
        };
      case 'warning':
        return {
          iconBox: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white'
        };
      case 'primary':
      default:
        return {
          iconBox: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: <Info className="w-5 h-5 text-emerald-600" />,
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex min-h-full items-center justify-center p-4">
      <div 
        className="fixed inset-0 transition-opacity" 
        onClick={handleCancel}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md transform rounded-2xl bg-white text-left shadow-2xl transition-all border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm flex-shrink-0 ${styles.iconBox}`}>
              {styles.icon}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close confirmation dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Action Buttons Footer */}
        <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleCancel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 ${styles.confirmBtn}`}
            autoFocus
          >
            {styles.icon && confirmVariant === 'danger' && <Trash2 className="w-3.5 h-3.5" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

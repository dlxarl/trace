import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  filePathsToDelete?: string[];
  warningMessage?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  filePathsToDelete = [],
  warningMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#18181c] border border-rose-900/60 rounded-lg max-w-md w-full shadow-popover overflow-hidden text-xs">
        <div className="flex items-center justify-between px-4 py-3 border-b border-obsidian-border bg-rose-950/30">
          <div className="flex items-center space-x-2 font-semibold text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-obsidian-dim hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-obsidian-text">
            Are you sure you want to permanently delete <strong className="text-white">"{itemName}"</strong>?
          </p>

          {warningMessage && (
            <p className="text-amber-300 bg-amber-950/40 border border-amber-800/60 p-2.5 rounded">
              {warningMessage}
            </p>
          )}

          {filePathsToDelete.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-obsidian-muted uppercase">
                The following files and folders will be removed from your workspace:
              </span>
              <div className="bg-[#141416] p-2 rounded border border-obsidian-border max-h-36 overflow-y-auto space-y-1 font-mono text-[11px] text-rose-400/90">
                {filePathsToDelete.map((f) => (
                  <div key={f} className="truncate">
                    • {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-2 border-t border-obsidian-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-obsidian-hover hover:bg-[#2b2b35] text-obsidian-text rounded"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-medium"
            >
              Confirm Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

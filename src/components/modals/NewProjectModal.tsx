import React, { useState } from 'react';
import { X, FolderPlus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim());
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#18181c] border border-obsidian-border rounded-lg max-w-md w-full shadow-popover overflow-hidden text-xs">
        <div className="flex items-center justify-between px-4 py-3 border-b border-obsidian-border bg-[#151518]">
          <div className="flex items-center space-x-2 font-semibold text-obsidian-text">
            <FolderPlus className="w-4 h-4 text-obsidian-accent" />
            <span>New Investigation Project</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-obsidian-dim hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block font-medium text-obsidian-muted mb-1">
              Project Name *
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Operation Nightfall, Domain Clustered Research..."
              className="w-full px-3 py-2 bg-[#141416] border border-obsidian-border rounded text-sm text-obsidian-text focus:outline-none focus:border-obsidian-accent"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-obsidian-muted mb-1">
              Investigation Objective & Scope
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Document the primary focus, target suspects, and research bounds..."
              className="w-full px-3 py-2 bg-[#141416] border border-obsidian-border rounded text-xs text-obsidian-text focus:outline-none focus:border-obsidian-accent resize-none leading-relaxed"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-obsidian-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-obsidian-hover hover:bg-[#2b2b35] text-obsidian-text rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-1.5 bg-obsidian-accent hover:bg-obsidian-accentHover text-white rounded font-medium disabled:opacity-50"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

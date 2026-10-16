import React, { useState, useEffect } from 'react';
import { Note, ProjectData } from '@/types';
import { MarkdownEditor } from '@/components/common/MarkdownEditor';
import { Save, Trash2, FileText, X } from 'lucide-react';

interface NoteEditorProps {
  note: Note;
  projectData: ProjectData;
  onSave: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onOpenEntity: (entityId: string) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  note,
  projectData,
  onSave,
  onDelete,
  onOpenEntity,
}) => {
  const [draft, setDraft] = useState<Note>({ ...note });
  const [tagInput, setTagInput] = useState<string>('');
  const [isDirty, setIsDirty] = useState<boolean>(false);

  useEffect(() => {
    setDraft({ ...note });
    setIsDirty(false);
  }, [note]);

  const updateDraft = (updates: Partial<Note>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(draft);
    setIsDirty(false);
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    if (!draft.tags.includes(tagInput.trim())) {
      updateDraft({ tags: [...draft.tags, tagInput.trim()] });
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    updateDraft({ tags: draft.tags.filter((t) => t !== tag) });
  };

  return (
    <div className="h-full flex flex-col bg-obsidian-panel overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 bg-obsidian-panel/95 backdrop-blur border-b border-obsidian-border">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-300">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-obsidian-dim">{draft.id}</span>
              {isDirty && (
                <span className="text-[11px] bg-amber-950/80 border border-amber-800 text-amber-300 px-1.5 py-0.2 rounded font-medium">
                  Unsaved changes
                </span>
              )}
            </div>
            <h1 className="text-lg font-semibold text-obsidian-text">{draft.title}</h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={!isDirty}
            className={`px-3 py-1.5 flex items-center space-x-1.5 text-xs rounded-md font-medium transition-colors ${
              isDirty
                ? 'bg-obsidian-accent hover:bg-obsidian-accentHover text-white shadow-sm'
                : 'bg-obsidian-card text-obsidian-dim cursor-not-allowed border border-obsidian-border'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Note</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(draft.id)}
            className="p-1.5 text-obsidian-dim hover:text-rose-400 hover:bg-rose-950/40 rounded-md transition-colors"
            title="Delete Note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 max-w-4xl w-full mx-auto space-y-6">
        <div className="bg-obsidian-card border border-obsidian-border rounded-lg p-5 space-y-4 shadow-subtle">
          <div>
            <label className="block text-xs font-medium text-obsidian-muted mb-1">
              Note Title *
            </label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              className="w-full px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded text-sm text-obsidian-text focus:outline-none focus:border-obsidian-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-obsidian-muted mb-1">Tags</label>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              {draft.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300 border border-zinc-700"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1.5 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-1 bg-[#141416] border border-obsidian-border rounded text-xs text-obsidian-text focus:outline-none focus:border-obsidian-accent"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-2.5 py-1 text-xs bg-obsidian-hover hover:bg-[#2b2b35] text-obsidian-text border border-obsidian-border rounded"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <MarkdownEditor
            value={draft.markdownBody}
            onChange={(val) => updateDraft({ markdownBody: val })}
            onWikilinkClick={(target) => {
              const ent = projectData.entities.find((e) => e.id === target || e.name === target);
              if (ent) onOpenEntity(ent.id);
            }}
          />
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { ProjectData, Source, SOURCE_TYPES, SourceType } from '@/types';
import { MarkdownEditor } from '@/components/common/MarkdownEditor';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  Save,
  Trash2,
  Globe,
  ExternalLink,
  Calendar,
  FileText,
  Link,
  ShieldCheck,
  Star,
} from 'lucide-react';

interface SourceEditorProps {
  source: Source;
  projectData: ProjectData;
  onSave: (source: Source) => void;
  onDelete: (sourceId: string) => void;
  onOpenRelationship: (relId: string) => void;
  onOpenEntity: (entityId: string) => void;
  isQuickPinned?: boolean;
  onToggleQuickPin?: () => void;
}

export const SourceEditor: React.FC<SourceEditorProps> = ({
  source,
  projectData,
  onSave,
  onDelete,
  onOpenRelationship,
  onOpenEntity,
  isQuickPinned,
  onToggleQuickPin,
}) => {
  const [draft, setDraft] = useState<Source>({ ...source });
  const [isDirty, setIsDirty] = useState<boolean>(false);

  useEffect(() => {
    setDraft({ ...source });
    setIsDirty(false);
  }, [source]);

  const updateDraft = (updates: Partial<Source>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSave(draft);
    setIsDirty(false);
  };

  // Find relationships that cite this source
  const citingRelationships = projectData.relationships.filter((r) =>
    r.evidence.includes(source.id)
  );

  return (
    <div className="h-full flex flex-col bg-obsidian-panel overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 bg-obsidian-panel/95 backdrop-blur border-b border-obsidian-border">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-md bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-obsidian-dim">{draft.id}</span>
              <span className="text-xs text-emerald-400 font-mono">[{draft.source_type}]</span>
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
          {onToggleQuickPin && (
            <button
              type="button"
              onClick={onToggleQuickPin}
              className={`px-2.5 py-1.5 flex items-center space-x-1.5 text-xs rounded-md font-medium transition-colors border ${
                isQuickPinned
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-[#18181f] text-obsidian-dim hover:text-white hover:bg-white/5 border-obsidian-border'
              }`}
              title={isQuickPinned ? 'Remove from Global Quick Access' : 'Pin to Global Quick Access'}
            >
              <Star className={`w-3.5 h-3.5 ${isQuickPinned ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isQuickPinned ? 'In Quick Access' : 'Quick Access'}</span>
            </button>
          )}

          {draft.url && (
            <a
              href={draft.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-obsidian-dim hover:text-emerald-400 hover:bg-white/5 rounded-md transition-colors"
              title="Open URL in Browser"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

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
            <span>Save Source</span>
          </button>

          <button
            type="button"
            onClick={() => onDelete(draft.id)}
            className="p-1.5 text-obsidian-dim hover:text-rose-400 hover:bg-rose-950/40 rounded-md transition-colors"
            title="Delete Source"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 max-w-4xl w-full mx-auto space-y-6">
        {/* Source Metadata Card */}
        <div className="bg-obsidian-card border border-obsidian-border rounded-lg p-5 space-y-4 shadow-subtle">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Source Title *
              </label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded text-sm text-obsidian-text focus:outline-none focus:border-obsidian-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Source Type *
              </label>
              <select
                value={draft.source_type}
                onChange={(e) => updateDraft({ source_type: e.target.value as SourceType })}
                className="w-full px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded text-sm text-obsidian-text focus:outline-none focus:border-obsidian-accent cursor-pointer"
              >
                {SOURCE_TYPES.map((st) => (
                  <option key={st.type} value={st.type} className="bg-[#18181c]">
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                URL / Archive Link
              </label>
              <div className="flex items-center space-x-1">
                <input
                  type="text"
                  value={draft.url || ''}
                  onChange={(e) => updateDraft({ url: e.target.value })}
                  placeholder="https://..."
                  className="flex-1 px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded text-xs text-obsidian-text focus:outline-none focus:border-obsidian-accent"
                />
                {draft.url && (
                  <a
                    href={draft.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-obsidian-muted hover:text-white bg-[#141416] border border-obsidian-border rounded"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-obsidian-muted mb-1">
                Accessed / Archived At
              </label>
              <input
                type="text"
                value={draft.accessed_at}
                onChange={(e) => updateDraft({ accessed_at: e.target.value })}
                className="w-full px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded text-xs text-obsidian-text font-mono focus:outline-none focus:border-obsidian-accent"
              />
            </div>
          </div>
        </div>

        {/* Markdown Extract & Notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-obsidian-text">Source Content & Extract</h2>
              <p className="text-xs text-obsidian-dim">
                Record the relevant excerpt, observations, and what this evidence establishes
              </p>
            </div>
          </div>
          <MarkdownEditor
            value={draft.markdownBody}
            onChange={(val) => updateDraft({ markdownBody: val })}
            onWikilinkClick={(target) => {
              const ent = projectData.entities.find((e) => e.id === target || e.name === target);
              if (ent) onOpenEntity(ent.id);
            }}
          />
        </div>

        {/* Citations in Investigation */}
        <div className="bg-obsidian-card border border-obsidian-border rounded-lg p-5 space-y-3 shadow-subtle">
          <h2 className="text-sm font-semibold text-obsidian-text border-b border-obsidian-border pb-2">
            Cited as Evidence in Relationships ({citingRelationships.length})
          </h2>
          {citingRelationships.length > 0 ? (
            <div className="space-y-2">
              {citingRelationships.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onOpenRelationship(rel.id)}
                  className="p-2.5 bg-[#141416] hover:bg-obsidian-hover border border-obsidian-border rounded cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div className="truncate mr-3">
                    <span className="font-mono text-xs text-purple-300 font-medium">
                      {rel.type}
                    </span>{' '}
                    <span className="text-xs text-obsidian-muted">
                      ({rel.source_entity} → {rel.target_entity})
                    </span>
                  </div>
                  <StatusBadge status={rel.status} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-obsidian-dim italic">
              This source is not cited as evidence by any relationships yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

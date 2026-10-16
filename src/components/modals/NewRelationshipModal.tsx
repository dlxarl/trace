import React, { useState } from 'react';
import { ProjectData, Relationship, RelationshipStatus, RELATIONSHIP_STATUSES } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { X, Share2, Plus } from 'lucide-react';

interface NewRelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (rel: Relationship) => void;
  projectData: ProjectData;
  defaultSourceId?: string;
}

const COMMON_RELATIONSHIP_TYPES = [
  'operates',
  'owns',
  'works_for',
  'resolves_to',
  'registered',
  'associated_with',
  'finances',
  'controls',
  'promotes',
  'director_of',
  'located_at',
  'communicates_with',
  'member_of',
  'mentioned_in',
];

export const NewRelationshipModal: React.FC<NewRelationshipModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  projectData,
  defaultSourceId,
}) => {
  const [sourceId, setSourceId] = useState<string>(
    defaultSourceId || (projectData.entities[0]?.id ?? '')
  );
  const [targetId, setTargetId] = useState<string>(
    projectData.entities.find((e) => e.id !== defaultSourceId)?.id ?? ''
  );
  const [type, setType] = useState<string>('associated_with');
  const [status, setStatus] = useState<RelationshipStatus>('candidate');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [directed, setDirected] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || !type.trim()) return;

    const now = new Date().toISOString();
    const id = `rel-${Date.now().toString(36)}`;

    const newRel: Relationship = {
      id,
      type: type.trim(),
      source_entity: sourceId,
      target_entity: targetId,
      directed,
      status,
      confidence,
      evidence: [],
      created_at: now,
      markdownBody: `# Relationship: ${type.trim()}\n\n## Explanation\n\nDocument reason for relationship hypothesis.\n\n## Evidence\n\nAdd supporting observations.`,
    };

    onCreate(newRel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#18181c] border border-obsidian-border rounded-lg max-w-lg w-full shadow-popover overflow-hidden text-xs">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-obsidian-border bg-[#151518]">
          <div className="flex items-center space-x-2 font-semibold text-obsidian-text">
            <Share2 className="w-4 h-4 text-purple-400" />
            <span>Create Relationship Claim</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-obsidian-dim hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-obsidian-muted mb-1">
                Source Entity *
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#141416] border border-obsidian-border rounded text-obsidian-text focus:outline-none focus:border-obsidian-accent cursor-pointer"
                required
              >
                {projectData.entities.map((e) => (
                  <option key={e.id} value={e.id} className="bg-[#18181c]">
                    {e.name} ({e.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-obsidian-muted mb-1">
                Target Entity *
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-[#141416] border border-obsidian-border rounded text-obsidian-text focus:outline-none focus:border-obsidian-accent cursor-pointer"
                required
              >
                {projectData.entities.map((e) => (
                  <option key={e.id} value={e.id} className="bg-[#18181c]">
                    {e.name} ({e.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-obsidian-muted mb-1">
              Predicate / Relationship Type *
            </label>
            <input
              type="text"
              list="modal-rel-types"
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g. operates, owns, registered..."
              className="w-full px-3 py-1.5 bg-[#141416] border border-obsidian-border rounded font-mono text-purple-300 focus:outline-none focus:border-obsidian-accent"
              required
            />
            <datalist id="modal-rel-types">
              {COMMON_RELATIONSHIP_TYPES.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-obsidian-muted mb-1">
                Verification Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as RelationshipStatus)}
                className="w-full px-2.5 py-1.5 bg-[#141416] border border-obsidian-border rounded text-obsidian-text focus:outline-none focus:border-obsidian-accent cursor-pointer"
              >
                {RELATIONSHIP_STATUSES.map((s) => (
                  <option key={s.status} value={s.status} className="bg-[#18181c]">
                    {s.label} ({s.borderStyle})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-obsidian-muted mb-1">
                Direction
              </label>
              <label className="flex items-center space-x-2 mt-2 cursor-pointer text-obsidian-text">
                <input
                  type="checkbox"
                  checked={directed}
                  onChange={(e) => setDirected(e.target.checked)}
                  className="rounded bg-[#141416] border-obsidian-border text-obsidian-accent focus:ring-0"
                />
                <span>Directed (Source → Target)</span>
              </label>
            </div>
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
              disabled={!sourceId || !targetId || !type.trim()}
              className="px-4 py-1.5 bg-obsidian-accent hover:bg-obsidian-accentHover text-white rounded font-medium disabled:opacity-50"
            >
              Create Relationship
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

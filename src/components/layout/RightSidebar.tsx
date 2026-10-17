import React from 'react';
import { Entity, ProjectData, Relationship } from '@/types';
import { EntityIcon, getEntityTypeColor } from '@/components/common/EntityIcon';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  ChevronRight,
  ExternalLink,
  Plus,
  Share2,
  Globe,
  Tag,
  Hash,
  Shield,
  Layers,
  Info,
} from 'lucide-react';

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  projectData: ProjectData;
  selectedEntityId?: string;
  selectedRelationshipId?: string;
  onOpenEntity: (entityId: string) => void;
  onOpenRelationship: (relId: string) => void;
  onOpenSource: (sourceId: string) => void;
  onCreateRelationship: (sourceId: string) => void;
  width?: number;
  onResize?: (width: number) => void;
  onResetWidth?: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  onToggle,
  projectData,
  selectedEntityId,
  selectedRelationshipId,
  onOpenEntity,
  onOpenRelationship,
  onOpenSource,
  onCreateRelationship,
  width = 320,
  onResize,
  onResetWidth,
}) => {
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX; // dragging to the left increases width
      onResize?.(startWidth + deltaX);
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  if (!isOpen) return null;

  const selectedEntity = selectedEntityId
    ? projectData.entities.find((e) => e.id === selectedEntityId)
    : undefined;

  const selectedRel = selectedRelationshipId
    ? projectData.relationships.find((r) => r.id === selectedRelationshipId)
    : undefined;

  const getEntityName = (id: string) => {
    const e = projectData.entities.find((ent) => ent.id === id);
    return e ? e.name : id;
  };

  return (
    <aside
      style={{ width: `${width}px` }}
      className="bg-obsidian-sidebar border-l border-obsidian-border flex flex-col h-full overflow-hidden select-none text-xs relative shrink-0"
    >
      {/* Left Edge Resize Handle */}
      <div
        onMouseDown={handleMouseDownResize}
        onDoubleClick={onResetWidth}
        className="absolute top-0 left-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-40 group"
        title="Drag to resize inspector (double-click to reset)"
      >
        <div className="w-[1px] h-full mx-auto bg-transparent group-hover:bg-indigo-400 group-active:bg-indigo-400" />
      </div>

      {/* Top Header */}
      <div className="h-8 flex items-center justify-between px-3 border-b border-obsidian-border bg-[#18181b] shrink-0">
        <span className="font-semibold text-obsidian-text uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-obsidian-muted" />
          <span>Inspector</span>
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="p-1 text-obsidian-dim hover:text-white hover:bg-obsidian-hover rounded transition-colors"
          title="Collapse Panel (Ctrl/Cmd + ])"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Entity Inspector */}
        {selectedEntity ? (
          <div className="space-y-4">
            {/* Entity Header */}
            <div className="p-3 bg-obsidian-card border border-obsidian-border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{
                    backgroundColor: `${getEntityTypeColor(selectedEntity.type)}22`,
                    color: getEntityTypeColor(selectedEntity.type),
                  }}
                >
                  <EntityIcon type={selectedEntity.type} className="w-3 h-3" />
                  <span>{selectedEntity.type}</span>
                </span>
                <span className="font-mono text-[10px] text-obsidian-dim">{selectedEntity.id}</span>
              </div>
              <h2 className="text-sm font-bold text-obsidian-text leading-snug">
                {selectedEntity.name}
              </h2>

              <div className="pt-1 flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => onOpenEntity(selectedEntity.id)}
                  className="flex-1 py-1 px-2 flex items-center justify-center space-x-1 bg-obsidian-accent hover:bg-obsidian-accentHover text-white rounded text-[11px] font-medium transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open Full Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => onCreateRelationship(selectedEntity.id)}
                  className="p-1 bg-obsidian-hover hover:bg-[#2b2b35] text-obsidian-text border border-obsidian-border rounded"
                  title="Add Relationship"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Aliases */}
            {selectedEntity.aliases.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-obsidian-muted uppercase">
                  Aliases ({selectedEntity.aliases.length})
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedEntity.aliases.map((alias) => (
                    <span
                      key={alias}
                      className="px-1.5 py-0.5 bg-[#141416] border border-obsidian-border rounded text-[11px] text-obsidian-text"
                    >
                      {alias}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {selectedEntity.tags.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-semibold text-obsidian-muted uppercase">Tags</div>
                <div className="flex flex-wrap gap-1">
                  {selectedEntity.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-purple-950/40 border border-purple-800/60 rounded text-[11px] text-purple-300 font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Attributes */}
            {Object.keys(selectedEntity.attributes).length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-obsidian-muted uppercase">
                  Attributes
                </div>
                <div className="bg-[#141416] border border-obsidian-border rounded-md divide-y divide-obsidian-borderSubtle overflow-hidden">
                  {Object.entries(selectedEntity.attributes).map(([k, v]) => (
                    <div key={k} className="p-1.5 px-2 flex justify-between items-start">
                      <span className="text-[11px] font-mono text-obsidian-dim mr-2">{k}</span>
                      <span className="text-[11px] text-obsidian-text font-medium text-right truncate">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Neighbors / Claims */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-semibold text-obsidian-muted uppercase">
                Connections
              </div>
              <div className="space-y-1">
                {projectData.relationships
                  .filter(
                    (r) =>
                      r.source_entity === selectedEntity.id ||
                      r.target_entity === selectedEntity.id
                  )
                  .map((rel) => {
                    const isSource = rel.source_entity === selectedEntity.id;
                    const neighborId = isSource ? rel.target_entity : rel.source_entity;
                    return (
                      <div
                        key={rel.id}
                        onClick={() => onOpenRelationship(rel.id)}
                        className="p-1.5 px-2 bg-[#141416] hover:bg-obsidian-hover border border-obsidian-border rounded cursor-pointer transition-colors space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-purple-300">
                            {isSource ? '→ ' : '← '}
                            {rel.type}
                          </span>
                          <StatusBadge status={rel.status} size="sm" />
                        </div>
                        <div className="text-[11px] text-obsidian-text font-medium truncate">
                          {getEntityName(neighborId)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        ) : selectedRel ? (
          /* Relationship Inspector */
          <div className="space-y-4">
            <div className="p-3 bg-obsidian-card border border-obsidian-border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-purple-400 uppercase font-semibold">
                  Relationship
                </span>
                <StatusBadge status={selectedRel.status} size="sm" />
              </div>
              <h2 className="text-sm font-bold text-obsidian-text leading-snug">
                {selectedRel.type}
              </h2>

              <div className="p-2 bg-[#141416] border border-obsidian-border rounded text-[11px] space-y-1">
                <div className="truncate">
                  <span className="text-obsidian-dim">Source: </span>
                  <span className="text-obsidian-text font-medium">
                    {getEntityName(selectedRel.source_entity)}
                  </span>
                </div>
                <div className="truncate">
                  <span className="text-obsidian-dim">Target: </span>
                  <span className="text-obsidian-text font-medium">
                    {getEntityName(selectedRel.target_entity)}
                  </span>
                </div>
                {selectedRel.confidence !== null && selectedRel.confidence !== undefined && (
                  <div className="truncate text-obsidian-dim">
                    Confidence: <span className="text-sky-400">{selectedRel.confidence}%</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onOpenRelationship(selectedRel.id)}
                className="w-full py-1 px-2 flex items-center justify-center space-x-1 bg-obsidian-accent hover:bg-obsidian-accentHover text-white rounded text-[11px] font-medium transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open Relationship Editor</span>
              </button>
            </div>

            {/* Evidence Sources */}
            {selectedRel.evidence.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-semibold text-obsidian-muted uppercase">
                  Supporting Evidence ({selectedRel.evidence.length})
                </div>
                <div className="space-y-1">
                  {selectedRel.evidence.map((srcId) => {
                    const src = projectData.sources.find((s) => s.id === srcId);
                    return (
                      <div
                        key={srcId}
                        onClick={() => onOpenSource(srcId)}
                        className="p-1.5 px-2 bg-[#141416] hover:bg-obsidian-hover border border-obsidian-border rounded cursor-pointer transition-colors"
                      >
                        <div className="text-[11px] font-medium text-obsidian-text truncate">
                          {src ? src.title : srcId}
                        </div>
                        <div className="text-[10px] text-obsidian-dim font-mono">
                          {src?.source_type} {src?.url ? `• ${src.url}` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Default Legend & Info */
          <div className="space-y-4 text-obsidian-muted">
            <div className="p-3 bg-obsidian-card border border-obsidian-border rounded-lg space-y-2">
              <span className="font-semibold text-obsidian-text text-xs">Selection Info</span>
              <p className="text-[11px] text-obsidian-dim leading-relaxed">
                Click any entity or relationship edge on the graph to inspect properties,
                evidence, and quick navigation links.
              </p>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              <span className="text-[10px] font-semibold uppercase text-obsidian-dim">
                Relationship Verification Legend
              </span>
              <div className="space-y-1">
                <div className="flex items-center justify-between p-1.5 bg-[#141416] rounded border border-obsidian-borderSubtle">
                  <span className="text-emerald-400 font-medium">Confirmed</span>
                  <span className="text-[10px] font-mono text-obsidian-dim">Solid Line</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#141416] rounded border border-obsidian-borderSubtle">
                  <span className="text-sky-400 font-medium">Supported</span>
                  <span className="text-[10px] font-mono text-obsidian-dim">Solid Line</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#141416] rounded border border-obsidian-borderSubtle">
                  <span className="text-amber-400 font-medium">Unverified</span>
                  <span className="text-[10px] font-mono text-obsidian-dim">Dashed Line</span>
                </div>
                <div className="flex items-center justify-between p-1.5 bg-[#141416] rounded border border-obsidian-borderSubtle">
                  <span className="text-zinc-400 font-medium">Candidate</span>
                  <span className="text-[10px] font-mono text-obsidian-dim">Dotted Line</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

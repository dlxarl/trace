import React, { useState } from 'react';
import { Project, ProjectData, RELATIONSHIP_STATUSES, ENTITY_TYPES } from '@/types';
import { EntityIcon, getEntityTypeColor } from '@/components/common/EntityIcon';
import { StatusBadge } from '@/components/common/StatusBadge';
import { MarkdownEditor } from '@/components/common/MarkdownEditor';
import {
  Layers,
  Share2,
  Globe,
  FileText,
  Download,
  RefreshCw,
  Plus,
  Calendar,
  Save,
  CheckCircle2,
  FolderOpen,
} from 'lucide-react';

interface ProjectOverviewProps {
  projectData: ProjectData;
  onSaveProject: (project: Project) => void;
  onOpenGraph: () => void;
  onCreateEntity: () => void;
  onCreateRelationship: () => void;
  onExportZip: () => void;
  onRebuildIndex: () => void;
  onOpenEntity: (entityId: string) => void;
  onOpenInExplorer?: () => void;
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  projectData,
  onSaveProject,
  onOpenGraph,
  onCreateEntity,
  onCreateRelationship,
  onExportZip,
  onRebuildIndex,
  onOpenEntity,
  onOpenInExplorer,
}) => {
  const [draft, setDraft] = useState<Project>({ ...projectData.project });
  const [isDirty, setIsDirty] = useState<boolean>(false);

  const updateDraft = (updates: Partial<Project>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onSaveProject(draft);
    setIsDirty(false);
  };

  // Stats calculation
  const entityTypeCounts = ENTITY_TYPES.map((t) => ({
    ...t,
    count: projectData.entities.filter((e) => e.type === t.type).length,
  })).filter((t) => t.count > 0);

  const statusCounts = RELATIONSHIP_STATUSES.map((s) => ({
    ...s,
    count: projectData.relationships.filter((r) => r.status === s.status).length,
  }));

  return (
    <div className="h-full flex flex-col bg-obsidian-panel overflow-y-auto">
      {/* Top Banner */}
      <div className="px-8 py-6 border-b border-obsidian-border bg-gradient-to-b from-[#18181d] to-obsidian-panel">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="font-mono text-xs text-obsidian-dim uppercase tracking-wider">
                Investigation Project • {draft.id}
              </span>
              <h1 className="text-2xl font-bold text-obsidian-text">{draft.name}</h1>
              <div className="flex items-center space-x-4 text-xs text-obsidian-dim pt-1">
                <span>Created: {new Date(draft.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>Last Updated: {new Date(draft.updated_at).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onOpenGraph}
                className="px-3.5 py-1.5 flex items-center space-x-1.5 text-xs bg-obsidian-accent hover:bg-obsidian-accentHover text-white rounded-md font-medium shadow-sm transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Open Graph View</span>
              </button>

              {onOpenInExplorer && (
                <button
                  type="button"
                  onClick={onOpenInExplorer}
                  className="px-3.5 py-1.5 flex items-center space-x-1.5 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-md font-medium transition-colors"
                  title="Open project folder in macOS Finder"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Show in Finder</span>
                </button>
              )}

              <button
                type="button"
                onClick={onExportZip}
                className="px-3 py-1.5 flex items-center space-x-1.5 text-xs bg-obsidian-hover hover:bg-[#2b2b35] text-obsidian-text border border-obsidian-border rounded-md transition-colors"
                title="Export complete canonical Markdown structure as ZIP"
              >
                <Download className="w-3.5 h-3.5 text-obsidian-muted" />
                <span>Export ZIP</span>
              </button>

              <button
                type="button"
                onClick={onRebuildIndex}
                className="p-1.5 text-obsidian-dim hover:text-white bg-obsidian-hover rounded-md border border-obsidian-border transition-colors"
                title="Rebuild SQLite search index from Markdown records"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            <div className="bg-[#141416] border border-obsidian-border rounded-lg p-3">
              <div className="flex items-center justify-between text-obsidian-muted text-xs">
                <span>Entities</span>
                <Layers className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-xl font-bold text-obsidian-text mt-1">
                {projectData.entities.length}
              </div>
            </div>

            <div className="bg-[#141416] border border-obsidian-border rounded-lg p-3">
              <div className="flex items-center justify-between text-obsidian-muted text-xs">
                <span>Relationships</span>
                <Share2 className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-bold text-obsidian-text mt-1">
                {projectData.relationships.length}
              </div>
            </div>

            <div className="bg-[#141416] border border-obsidian-border rounded-lg p-3">
              <div className="flex items-center justify-between text-obsidian-muted text-xs">
                <span>Sources</span>
                <Globe className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-obsidian-text mt-1">
                {projectData.sources.length}
              </div>
            </div>

            <div className="bg-[#141416] border border-obsidian-border rounded-lg p-3">
              <div className="flex items-center justify-between text-obsidian-muted text-xs">
                <span>Notes</span>
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-obsidian-text mt-1">
                {projectData.notes.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Breakdown Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Entity Type Distribution */}
          <div className="bg-obsidian-card border border-obsidian-border rounded-lg p-4 space-y-3 shadow-subtle">
            <div className="flex items-center justify-between border-b border-obsidian-border pb-2">
              <span className="text-xs font-semibold text-obsidian-text uppercase tracking-wider">
                Entity Type Breakdown
              </span>
              <button
                type="button"
                onClick={onCreateEntity}
                className="text-xs text-obsidian-accent hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Entity</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {entityTypeCounts.map((t) => (
                <div
                  key={t.type}
                  className="flex items-center justify-between p-2 rounded bg-[#141416] border border-obsidian-borderSubtle"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-xs text-obsidian-muted truncate">{t.label}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-obsidian-text">{t.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Relationship Status Breakdown */}
          <div className="bg-obsidian-card border border-obsidian-border rounded-lg p-4 space-y-3 shadow-subtle">
            <div className="flex items-center justify-between border-b border-obsidian-border pb-2">
              <span className="text-xs font-semibold text-obsidian-text uppercase tracking-wider">
                Relationship Verification Status
              </span>
              <button
                type="button"
                onClick={onCreateRelationship}
                className="text-xs text-obsidian-accent hover:underline flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Relationship</span>
              </button>
            </div>
            <div className="flex flex-col space-y-1.5">
              {statusCounts.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center justify-between p-1.5 px-2.5 rounded bg-[#141416] border border-obsidian-borderSubtle"
                >
                  <StatusBadge status={s.status} size="sm" />
                  <span className="text-xs font-mono font-bold text-obsidian-text">
                    {s.count} claims
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Markdown Objective & Scope */}
        <div className="bg-obsidian-card border border-obsidian-border rounded-lg p-5 space-y-3 shadow-subtle">
          <div className="flex items-center justify-between border-b border-obsidian-border pb-2">
            <div>
              <h2 className="text-sm font-semibold text-obsidian-text">
                Project Documentation & Scope (project.md)
              </h2>
              <p className="text-xs text-obsidian-dim">
                Investigation objectives, leads, and operational notes
              </p>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty}
              className={`px-3 py-1 flex items-center space-x-1.5 text-xs rounded font-medium transition-colors ${
                isDirty
                  ? 'bg-obsidian-accent hover:bg-obsidian-accentHover text-white'
                  : 'bg-obsidian-hover text-obsidian-dim cursor-not-allowed border border-obsidian-border'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Document</span>
            </button>
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
      </div>
    </div>
  );
};

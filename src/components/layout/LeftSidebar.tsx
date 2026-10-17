import React, { useState, useEffect } from 'react';
import {
  EntityType,
  ProjectData,
  ProjectSummary,
  TabType,
  Workspace,
} from '@/types';
import { getEntityTypeColor } from '@/components/common/EntityIcon';
import { StatusBadge } from '@/components/common/StatusBadge';
import {
  ChevronRight,
  ChevronDown,
  FolderKanban,
  Layers,
  Compass,
  Search,
  Plus,
  Share2,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Copy,
  Hash,
  Pin,
  Check,
  FolderOpen,
  Settings,
  Keyboard,
} from 'lucide-react';

interface LeftSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  workspace: Workspace;
  projects: ProjectSummary[];
  activeProjectId?: string;
  projectData?: ProjectData | null;
  onSelectProject: (projectId: string) => void;
  onCreateProjectModal: () => void;
  onDeleteProject: (projectId: string) => void;
  activeTabType?: TabType;
  activeTargetId?: string;
  onOpenTab: (type: TabType, targetId?: string, title?: string, options?: { isPreview?: boolean; isPinned?: boolean }) => void;
  onCreateEntityModal: (defaultType?: EntityType) => void;
  onCreateRelationshipModal: (sourceEntityId?: string) => void;
  onCreateSourceModal: () => void;
  onCreateNoteModal: () => void;
  onExportZip: () => void;
  onImportZip: () => void;
  onRebuildIndex: () => void;
  onDeleteEntity?: (id: string) => void;
  onDeleteRelationship?: (id: string) => void;
  onDeleteSource?: (id: string) => void;
  onDeleteNote?: (id: string) => void;
  isDesktop?: boolean;
  onOpenInExplorer?: (projectId?: string) => void;
  onOpenSettings?: () => void;
  onOpenShortcuts?: () => void;
  width?: number;
  onResize?: (width: number) => void;
  onResetWidth?: () => void;
}

interface SidebarContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  itemType: 'entity' | 'relationship' | 'source' | 'note';
  itemId: string;
  itemTitle: string;
  extra?: any;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  isOpen,
  onToggle,
  projects,
  activeProjectId,
  projectData,
  onSelectProject,
  onCreateProjectModal,
  onDeleteProject,
  activeTabType,
  activeTargetId,
  onOpenTab,
  onCreateEntityModal,
  onCreateRelationshipModal,
  onCreateSourceModal,
  onCreateNoteModal,
  onExportZip,
  onImportZip,
  onRebuildIndex,
  onDeleteEntity,
  onDeleteRelationship,
  onDeleteSource,
  onDeleteNote,
  isDesktop,
  onOpenInExplorer,
  onOpenSettings,
  onOpenShortcuts,
  width = 280,
  onResize,
  onResetWidth,
}) => {
  // Collapsible sections
  const currentProject = projects.find((p) => p.id === activeProjectId);
  const [entitiesOpen, setEntitiesOpen] = useState<boolean>(true);
  const [relationshipsOpen, setRelationshipsOpen] = useState<boolean>(true);
  const [sourcesOpen, setSourcesOpen] = useState<boolean>(true);
  const [notesOpen, setNotesOpen] = useState<boolean>(true);
  const [projectSelectorOpen, setProjectSelectorOpen] = useState<boolean>(false);

  // Custom Context Menu State
  const [contextMenu, setContextMenu] = useState<SidebarContextMenuState | null>(null);

  // Dismiss context menu on outside click or Esc
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && !target.closest('[data-sidebar-context-menu]')) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('pointerdown', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const openContextMenu = (
    e: React.MouseEvent,
    itemType: 'entity' | 'relationship' | 'source' | 'note',
    itemId: string,
    itemTitle: string,
    extra?: any
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      itemType,
      itemId,
      itemTitle,
      extra,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setContextMenu(null);
  };

  useEffect(() => {
    if (!projectSelectorOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && !target.closest('[data-project-selector]') && !target.closest('[data-project-button]')) {
        setProjectSelectorOpen(false);
      }
    };
    window.addEventListener('pointerdown', handleOutsideClick);
    return () => window.removeEventListener('pointerdown', handleOutsideClick);
  }, [projectSelectorOpen]);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
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

  return (
    <aside
      style={{ width: `${width}px` }}
      className="bg-obsidian-sidebar border-r border-obsidian-border flex flex-col h-full overflow-hidden select-none text-xs relative shrink-0"
    >
      {/* Right Edge Resize Handle */}
      <div
        onMouseDown={handleMouseDownResize}
        onDoubleClick={onResetWidth}
        className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-40 group"
        title="Drag to resize sidebar (double-click to reset)"
      >
        <div className="w-[1px] h-full mx-auto bg-transparent group-hover:bg-indigo-400 group-active:bg-indigo-400" />
      </div>

      {/* Main Navigation Views */}
      <div className="p-2 border-b border-obsidian-border space-y-0.5">
        <button
          type="button"
          onClick={() => onOpenTab('graph', undefined, 'Interactive Graph')}
          className={`w-full px-2.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors ${
            activeTabType === 'graph'
              ? 'bg-obsidian-accent text-white font-medium'
              : 'text-obsidian-muted hover:text-obsidian-text hover:bg-obsidian-hover'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Graph Visualization</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenTab('overview', undefined, 'Project Overview')}
          className={`w-full px-2.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors ${
            activeTabType === 'overview'
              ? 'bg-obsidian-accent text-white font-medium'
              : 'text-obsidian-muted hover:text-obsidian-text hover:bg-obsidian-hover'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Project Overview</span>
        </button>

        <button
          type="button"
          onClick={() => onOpenTab('search', undefined, 'Full-Text Search')}
          className={`w-full px-2.5 py-1.5 rounded-lg flex items-center space-x-2 transition-colors ${
            activeTabType === 'search'
              ? 'bg-obsidian-accent text-white font-medium'
              : 'text-obsidian-muted hover:text-obsidian-text hover:bg-obsidian-hover'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search Investigation</span>
        </button>
      </div>

      {/* Scrollable Tree Browser */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Entities Section */}
        <div>
          <div className="flex items-center justify-between py-1 px-1 text-obsidian-muted hover:text-white">
            <button
              type="button"
              onClick={() => setEntitiesOpen(!entitiesOpen)}
              className="flex items-center space-x-1 font-semibold uppercase text-[10px] tracking-wider"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${entitiesOpen ? 'rotate-90' : ''}`}
              />
              <span>Entities ({projectData?.entities.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => onCreateEntityModal()}
              className="p-0.5 hover:text-obsidian-accent rounded transition-colors"
              title="Add Entity"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {entitiesOpen && projectData && (
            <div className="pl-2 space-y-0.5 mt-0.5">
              {projectData.entities.map((entity) => {
                const isActive = activeTabType === 'entity' && activeTargetId === entity.id;
                const color = getEntityTypeColor(entity.type);
                return (
                  <div
                    key={entity.id}
                    onClick={() => onOpenTab('entity', entity.id, entity.name, { isPreview: true })}
                    onDoubleClick={() => onOpenTab('entity', entity.id, entity.name, { isPinned: true, isPreview: false })}
                    onContextMenu={(e) => openContextMenu(e, 'entity', entity.id, entity.name, { type: entity.type })}
                    className={`px-2 py-1 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-obsidian-hover text-white font-medium border-l-2 border-obsidian-accent'
                        : 'text-obsidian-muted hover:text-obsidian-text hover:bg-obsidian-hover/50'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 truncate">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate">{entity.name}</span>
                    </div>
                    <span className="text-[10px] text-obsidian-dim font-mono">{entity.type}</span>
                  </div>
                );
              })}
              {projectData.entities.length === 0 && (
                <div className="text-[11px] text-obsidian-dim italic px-2 py-1">No entities yet</div>
              )}
            </div>
          )}
        </div>

        {/* Relationships Section */}
        <div>
          <div className="flex items-center justify-between py-1 px-1 text-obsidian-muted hover:text-white">
            <button
              type="button"
              onClick={() => setRelationshipsOpen(!relationshipsOpen)}
              className="flex items-center space-x-1 font-semibold uppercase text-[10px] tracking-wider"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${relationshipsOpen ? 'rotate-90' : ''}`}
              />
              <span>Relationships ({projectData?.relationships.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => onCreateRelationshipModal()}
              className="p-0.5 hover:text-obsidian-accent rounded transition-colors"
              title="Add Relationship"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {relationshipsOpen && projectData && (
            <div className="pl-2 space-y-0.5 mt-0.5">
              {projectData.relationships.map((rel) => {
                const isActive = activeTabType === 'relationship' && activeTargetId === rel.id;
                return (
                  <div
                    key={rel.id}
                    onClick={() => onOpenTab('relationship', rel.id, `Rel: ${rel.type}`, { isPreview: true })}
                    onDoubleClick={() => onOpenTab('relationship', rel.id, `Rel: ${rel.type}`, { isPinned: true, isPreview: false })}
                    onContextMenu={(e) => openContextMenu(e, 'relationship', rel.id, `Rel: ${rel.type}`)}
                    className={`px-2 py-1 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-obsidian-hover text-white font-medium border-l-2 border-obsidian-accent'
                        : 'text-obsidian-muted hover:text-obsidian-text hover:bg-obsidian-hover/50'
                    }`}
                  >
                    <div className="truncate mr-1 font-mono text-[11px] text-purple-300">
                      {rel.type}
                    </div>
                    <StatusBadge status={rel.status} size="sm" />
                  </div>
                );
              })}
              {projectData.relationships.length === 0 && (
                <div className="text-[11px] text-obsidian-dim italic px-2 py-1">
                  No relationships yet
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sources Section */}
        <div>
          <div className="flex items-center justify-between py-1 px-1 text-obsidian-muted hover:text-white">
            <button
              type="button"
              onClick={() => setSourcesOpen(!sourcesOpen)}
              className="flex items-center space-x-1 font-semibold uppercase text-[10px] tracking-wider"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${sourcesOpen ? 'rotate-90' : ''}`}
              />
              <span>Sources ({projectData?.sources.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={onCreateSourceModal}
              className="p-0.5 hover:text-obsidian-accent rounded transition-colors"
              title="Add Source"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {sourcesOpen && projectData && (
            <div className="pl-2 space-y-0.5 mt-0.5">
              {projectData.sources.map((src) => {
                const isActive = activeTabType === 'source' && activeTargetId === src.id;
                return (
                  <div
                    key={src.id}
                    onClick={() => onOpenTab('source', src.id, src.title, { isPreview: true })}
                    onDoubleClick={() => onOpenTab('source', src.id, src.title, { isPinned: true, isPreview: false })}
                    onContextMenu={(e) => openContextMenu(e, 'source', src.id, src.title)}
                    className={`px-2 py-1 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-obsidian-hover text-white font-medium border-l-2 border-obsidian-accent'
                        : 'text-obsidian-muted hover:text-obsidian-text hover:bg-obsidian-hover/50'
                    }`}
                  >
                    <span className="truncate">{src.title}</span>
                    <span className="text-[10px] text-obsidian-dim font-mono">{src.source_type}</span>
                  </div>
                );
              })}
              {projectData.sources.length === 0 && (
                <div className="text-[11px] text-obsidian-dim italic px-2 py-1">No sources yet</div>
              )}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div>
          <div className="flex items-center justify-between py-1 px-1 text-obsidian-muted hover:text-white">
            <button
              type="button"
              onClick={() => setNotesOpen(!notesOpen)}
              className="flex items-center space-x-1 font-semibold uppercase text-[10px] tracking-wider"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${notesOpen ? 'rotate-90' : ''}`}
              />
              <span>Notes ({projectData?.notes.length || 0})</span>
            </button>
            <button
              type="button"
              onClick={onCreateNoteModal}
              className="p-0.5 hover:text-obsidian-accent rounded transition-colors"
              title="Add Note"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {notesOpen && projectData && (
            <div className="pl-2 space-y-0.5 mt-0.5">
              {projectData.notes.map((note) => {
                const isActive = activeTabType === 'note' && activeTargetId === note.id;
                return (
                  <div
                    key={note.id}
                    onClick={() => onOpenTab('note', note.id, note.title, { isPreview: true })}
                    onDoubleClick={() => onOpenTab('note', note.id, note.title, { isPinned: true, isPreview: false })}
                    onContextMenu={(e) => openContextMenu(e, 'note', note.id, note.title)}
                    className={`px-2 py-1 rounded-md flex items-center justify-between cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-obsidian-hover text-white font-medium border-l-2 border-obsidian-accent'
                        : 'text-obsidian-muted hover:text-obsidian-text hover:bg-obsidian-hover/50'
                    }`}
                  >
                    <span className="truncate">{note.title}</span>
                  </div>
                );
              })}
              {projectData.notes.length === 0 && (
                <div className="text-[11px] text-obsidian-dim italic px-2 py-1">No notes yet</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Utilities */}
      <div className="p-2 border-t border-obsidian-border bg-[#18181c] flex items-center justify-between text-obsidian-dim">
        <div className="flex items-center space-x-0.5">
          {onOpenInExplorer && (
            <button
              type="button"
              onClick={() => onOpenInExplorer(activeProjectId)}
              className="p-1.5 hover:text-indigo-300 hover:bg-white/10 rounded-lg transition-colors"
              title={isDesktop ? 'Show in Finder' : 'Download Project Files'}
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onExportZip}
            className="p-1.5 hover:text-white hover:bg-obsidian-hover rounded-lg transition-colors"
            title="Export Project ZIP"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onImportZip}
            className="p-1.5 hover:text-white hover:bg-obsidian-hover rounded-lg transition-colors"
            title="Import Project ZIP"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onRebuildIndex}
            className="p-1.5 hover:text-white hover:bg-obsidian-hover rounded-lg transition-colors"
            title="Rebuild SQLite FTS Index"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center space-x-0.5">
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="p-1.5 hover:text-white hover:bg-obsidian-hover rounded-lg transition-colors"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-1.5 hover:text-white hover:bg-obsidian-hover rounded-lg transition-colors"
              title="Application Settings (Cmd + ,)"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {currentProject && (
            <button
              type="button"
              onClick={() => onDeleteProject(currentProject.id)}
              className="p-1.5 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
              title="Delete Current Project"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Custom Context Menu Everywhere in Sidebar */}
      {contextMenu && contextMenu.visible && (
        <div
          data-sidebar-context-menu
          className="fixed z-50 w-52 bg-[#141419]/95 backdrop-blur-xl border border-[#2e2e3d] rounded-xl shadow-2xl p-1 text-xs text-obsidian-text ring-1 ring-white/10 select-none animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: `${Math.min(contextMenu.y, window.innerHeight - 240)}px`,
            left: `${Math.min(contextMenu.x, window.innerWidth - 220)}px`,
          }}
        >
          <div className="px-3 py-1.5 border-b border-[#252532] bg-[#1a1a24]/70 rounded-t-lg mb-1">
            <div className="text-[10px] uppercase font-mono text-zinc-400 font-semibold truncate">
              {contextMenu.itemType}
            </div>
            <div className="text-xs font-semibold text-white truncate">{contextMenu.itemTitle}</div>
          </div>

          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                onOpenTab(contextMenu.itemType, contextMenu.itemId, contextMenu.itemTitle, { isPreview: true });
                setContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-obsidian-accent" />
              <span>Open in Preview</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpenTab(contextMenu.itemType, contextMenu.itemId, contextMenu.itemTitle, { isPinned: true, isPreview: false });
                setContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
            >
              <Pin className="w-3.5 h-3.5 text-amber-400" />
              <span>Open & Pin Tab</span>
            </button>

            {contextMenu.itemType === 'entity' && (
              <button
                type="button"
                onClick={() => {
                  onCreateRelationshipModal(contextMenu.itemId);
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Create Relationship...</span>
              </button>
            )}

            <div className="border-t border-[#252532] my-1" />

            <button
              type="button"
              onClick={() => copyToClipboard(contextMenu.itemTitle)}
              className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copy Title</span>
            </button>

            <button
              type="button"
              onClick={() => copyToClipboard(contextMenu.itemId)}
              className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
            >
              <Hash className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copy ID</span>
            </button>

            <div className="border-t border-[#252532] my-1" />

            <button
              type="button"
              onClick={() => {
                if (contextMenu.itemType === 'entity') onDeleteEntity?.(contextMenu.itemId);
                else if (contextMenu.itemType === 'relationship') onDeleteRelationship?.(contextMenu.itemId);
                else if (contextMenu.itemType === 'source') onDeleteSource?.(contextMenu.itemId);
                else if (contextMenu.itemType === 'note') onDeleteNote?.(contextMenu.itemId);
                setContextMenu(null);
              }}
              className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded-lg text-left transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete {contextMenu.itemType}</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

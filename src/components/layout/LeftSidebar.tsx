import React, { useState, useEffect } from 'react';
import {
  Entity,
  EntityType,
  ProjectData,
  ProjectSummary,
  QuickSource,
  TabType,
  Workspace,
} from '@/types';
import { EntityIcon, getEntityTypeColor } from '@/components/common/EntityIcon';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ApiQuickSourceModal } from '@/components/modals/ApiQuickSourceModal';
import {
  ChevronRight,
  ChevronDown,
  FolderKanban,
  Network,
  LayoutDashboard,
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
  Users,
  Link2,
  StickyNote,
  FileText,
  Star,
  Globe,
  Zap,
  X,
  Play,
  Code,
  Sparkles,
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
  quickSources?: QuickSource[];
  onAddQuickSource?: (qs: Omit<QuickSource, 'id' | 'created_at'>) => void;
  onRemoveQuickSource?: (id: string) => void;
  onTogglePinQuickSource?: (sourceId: string) => void;
  isSourceQuickPinned?: (sourceId: string) => boolean;
  entities?: Entity[];
  onAttachSourceToEntity?: (entityId: string, title: string, url: string, content: string) => Promise<void> | void;
  onAddEntityAttribute?: (entityId: string, key: string, value: any) => Promise<void> | void;
  onCreateNoteOnEntity?: (entityId: string, title: string, content: string) => Promise<void> | void;
  onUpdateQuickSource?: (qs: QuickSource) => void;
  onOpenRelationshipDiscovery?: () => void;
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
  quickSources = [],
  onAddQuickSource,
  onRemoveQuickSource,
  onTogglePinQuickSource,
  isSourceQuickPinned,
  entities,
  onAttachSourceToEntity,
  onAddEntityAttribute,
  onCreateNoteOnEntity,
  onUpdateQuickSource,
  onOpenRelationshipDiscovery,
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
  const [quickSourcesOpen, setQuickSourcesOpen] = useState<boolean>(true);
  const [sourcesOpen, setSourcesOpen] = useState<boolean>(true);
  const [notesOpen, setNotesOpen] = useState<boolean>(true);
  const [projectSelectorOpen, setProjectSelectorOpen] = useState<boolean>(false);

  // New Quick Source Modal state
  const [newQuickSourceOpen, setNewQuickSourceOpen] = useState<boolean>(false);
  const [newQsTitle, setNewQsTitle] = useState<string>('');
  const [newQsUrl, setNewQsUrl] = useState<string>('');
  const [newQsType, setNewQsType] = useState<string>('webpage');
  const [newQsDesc, setNewQsDesc] = useState<string>('');
  const [newQsMethod, setNewQsMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [newQsHeaders, setNewQsHeaders] = useState<string>('');
  const [newQsBody, setNewQsBody] = useState<string>('');

  // API Quick Source Runner Modal state
  const [apiModalQs, setApiModalQs] = useState<QuickSource | null>(null);

  const OSINT_STARTER_PACK: Array<Omit<QuickSource, 'id' | 'created_at'>> = [
    {
      title: 'IP-API Geolocation (API)',
      url: 'http://ip-api.com/json/8.8.8.8',
      source_type: 'api',
      method: 'GET',
      description: 'Free IP geolocation and network lookup JSON API',
    },
    {
      title: 'Crt.sh Certificates (API)',
      url: 'https://crt.sh/?q=example.com&output=json',
      source_type: 'api',
      method: 'GET',
      description: 'Certificate transparency log search API',
    },
    {
      title: 'VirusTotal',
      url: 'https://www.virustotal.com',
      source_type: 'tool',
      description: 'Analyse suspicious files, domains, IPs and URLs',
    },
    {
      title: 'OSINT Framework',
      url: 'https://osintframework.com',
      source_type: 'tool',
      description: 'Directory of OSINT tools and resources',
    },
    {
      title: 'Wayback Machine',
      url: 'https://archive.org/web/',
      source_type: 'archive',
      description: 'Explore web pages saved over time',
    },
    {
      title: 'Shodan',
      url: 'https://www.shodan.io',
      source_type: 'database',
      description: 'Search engine for connected devices',
    },
    {
      title: 'WHOIS Lookup',
      url: 'https://who.is',
      source_type: 'webpage',
      description: 'Domain and IP WHOIS lookup',
    },
  ];

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
          <Network className="w-3.5 h-3.5" />
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
          <LayoutDashboard className="w-3.5 h-3.5" />
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
              className="flex items-center space-x-1.5 font-semibold uppercase text-[10px] tracking-wider"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${entitiesOpen ? 'rotate-90' : ''}`}
              />
              <Users className="w-3 h-3 text-indigo-400" />
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
                    <div className="flex items-center space-x-2 truncate">
                      <EntityIcon type={entity.type} className="w-3.5 h-3.5 shrink-0" />
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
              className="flex items-center space-x-1.5 font-semibold uppercase text-[10px] tracking-wider"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${relationshipsOpen ? 'rotate-90' : ''}`}
              />
              <Share2 className="w-3 h-3 text-purple-400" />
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
                    <div className="flex items-center space-x-1.5 truncate mr-1 font-mono text-[11px] text-purple-300">
                      <Share2 className="w-3 h-3 text-purple-400/70 shrink-0" />
                      <span className="truncate">{rel.type}</span>
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

        {/* Quick Access Sources (Global / Independent of Project) */}
        <div>
          <div className="flex items-center justify-between py-1 px-1 text-obsidian-muted hover:text-white">
            <button
              type="button"
              onClick={() => setQuickSourcesOpen(!quickSourcesOpen)}
              className="flex items-center space-x-1.5 font-semibold uppercase text-[10px] tracking-wider text-amber-400/90"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${quickSourcesOpen ? 'rotate-90' : ''}`}
              />
              <Star className="w-3 h-3 text-amber-400 fill-amber-400/40" />
              <span>Quick Sources ({quickSources.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setNewQuickSourceOpen(true)}
              className="p-0.5 hover:text-amber-400 rounded transition-colors text-obsidian-muted"
              title="Add Quick Access Source"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {quickSourcesOpen && (
            <div className="pl-2 space-y-0.5 mt-0.5">
              {quickSources.map((qs) => {
                return (
                  <div
                    key={qs.id}
                    onClick={() => {
                      if (qs.source_type === 'api') {
                        setApiModalQs(qs);
                      } else if (qs.projectId && qs.projectId === activeProjectId) {
                        onOpenTab('source', qs.id.replace('qs-', ''), qs.title, { isPreview: true });
                      } else if (qs.url) {
                        window.open(qs.url, '_blank');
                      }
                    }}
                    className="group px-2 py-1 rounded-md flex items-center justify-between cursor-pointer transition-colors text-zinc-300 hover:text-white hover:bg-white/5"
                    title={`${qs.title}${qs.url ? ` (${qs.url})` : ''}\n${qs.source_type === 'api' ? 'Click to open API Console' : 'Click to open'}`}
                  >
                    <div className="flex items-center space-x-1.5 truncate flex-1 min-w-0 mr-1.5">
                      {qs.source_type === 'api' ? (
                        <Code className="w-3 h-3 text-purple-400 shrink-0" />
                      ) : (
                        <Globe className="w-3 h-3 text-amber-400/80 shrink-0" />
                      )}
                      <span className="truncate text-xs">{qs.title}</span>
                      {qs.source_type === 'api' && qs.method && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono font-bold shrink-0">
                          {qs.method}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {qs.source_type === 'api' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setApiModalQs(qs);
                          }}
                          className="p-0.5 text-obsidian-dim hover:text-purple-400 rounded"
                          title="Execute / Configure API Request"
                        >
                          <Play className="w-3 h-3 fill-purple-400/20 text-purple-400" />
                        </button>
                      )}
                      {qs.url && (
                        <a
                          href={qs.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-0.5 text-obsidian-dim hover:text-emerald-400 rounded"
                          title="Open URL in Browser"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {onRemoveQuickSource && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveQuickSource(qs.id);
                          }}
                          className="p-0.5 text-obsidian-dim hover:text-rose-400 rounded"
                          title="Remove from Quick Sources"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {quickSources.length === 0 && (
                <div className="px-2 py-1.5 bg-[#18181f]/60 border border-white/5 rounded-lg text-center space-y-1.5 my-1">
                  <div className="text-[10px] text-obsidian-dim">No quick sources yet</div>
                  {onAddQuickSource && (
                    <button
                      type="button"
                      onClick={() => {
                        OSINT_STARTER_PACK.forEach((tool) => onAddQuickSource(tool));
                      }}
                      className="w-full text-[10px] py-1 px-2 rounded bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 flex items-center justify-center space-x-1 transition-colors"
                    >
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Load OSINT Presets</span>
                    </button>
                  )}
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
              className="flex items-center space-x-1.5 font-semibold uppercase text-[10px] tracking-wider"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${sourcesOpen ? 'rotate-90' : ''}`}
              />
              <Link2 className="w-3 h-3 text-emerald-400" />
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
                    <div className="flex items-center space-x-1.5 truncate">
                      <Link2 className="w-3 h-3 text-emerald-400/70 shrink-0" />
                      <span className="truncate">{src.title}</span>
                    </div>
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
              className="flex items-center space-x-1.5 font-semibold uppercase text-[10px] tracking-wider"
            >
              <ChevronRight
                className={`w-3 h-3 transition-transform ${notesOpen ? 'rotate-90' : ''}`}
              />
              <FileText className="w-3 h-3 text-amber-400" />
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
                    <div className="flex items-center space-x-1.5 truncate">
                      <FileText className="w-3 h-3 text-amber-400/70 shrink-0" />
                      <span className="truncate">{note.title}</span>
                    </div>
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

            {contextMenu.itemType === 'source' && onTogglePinQuickSource && (
              <button
                type="button"
                onClick={() => {
                  onTogglePinQuickSource(contextMenu.itemId);
                  setContextMenu(null);
                }}
                className="w-full px-2.5 py-1.5 flex items-center space-x-2 text-zinc-200 hover:text-white hover:bg-white/10 rounded-lg text-left transition-colors"
              >
                <Star className={`w-3.5 h-3.5 ${isSourceQuickPinned?.(contextMenu.itemId) ? 'text-amber-400 fill-amber-400/40' : 'text-amber-400'}`} />
                <span>{isSourceQuickPinned?.(contextMenu.itemId) ? 'Remove from Quick Access' : 'Pin to Quick Access'}</span>
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

      {/* Modal to add new Quick Source */}
      {newQuickSourceOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#18181c] border border-obsidian-border rounded-xl max-w-sm w-full shadow-2xl p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-obsidian-border pb-2">
              <div className="flex items-center space-x-1.5 font-semibold text-white">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400/40" />
                <span>Add Quick Source</span>
              </div>
              <button
                type="button"
                onClick={() => setNewQuickSourceOpen(false)}
                className="text-obsidian-dim hover:text-white p-0.5 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newQsTitle.trim()) return;
                onAddQuickSource?.({
                  title: newQsTitle.trim(),
                  url: newQsUrl.trim() || undefined,
                  source_type: newQsType,
                  description: newQsDesc.trim() || undefined,
                  method: newQsType === 'api' ? newQsMethod : undefined,
                  headers: newQsType === 'api' && newQsHeaders.trim() ? newQsHeaders.trim() : undefined,
                  body: newQsType === 'api' && newQsBody.trim() ? newQsBody.trim() : undefined,
                });
                setNewQsTitle('');
                setNewQsUrl('');
                setNewQsDesc('');
                setNewQsHeaders('');
                setNewQsBody('');
                setNewQuickSourceOpen(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] text-obsidian-muted mb-1 font-medium">Source Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VirusTotal, Censys, WHOIS..."
                  value={newQsTitle}
                  onChange={(e) => setNewQsTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#141416] border border-obsidian-border rounded-lg text-obsidian-text focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-obsidian-muted mb-1 font-medium">
                  {newQsType === 'api' ? 'API Endpoint URL *' : 'URL (optional)'}
                </label>
                <input
                  type="url"
                  required={newQsType === 'api'}
                  placeholder={newQsType === 'api' ? 'https://api.example.com/v1/...' : 'https://...'}
                  value={newQsUrl}
                  onChange={(e) => setNewQsUrl(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#141416] border border-obsidian-border rounded-lg text-obsidian-text focus:outline-none focus:border-amber-400 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-obsidian-muted mb-1 font-medium">Type</label>
                <select
                  value={newQsType}
                  onChange={(e) => setNewQsType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#141416] border border-obsidian-border rounded-lg text-obsidian-text focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="webpage">Webpage</option>
                  <option value="tool">OSINT Tool</option>
                  <option value="database">Database / Registry</option>
                  <option value="archive">Archive</option>
                  <option value="social">Social Media</option>
                  <option value="api">API Endpoint</option>
                </select>
              </div>

              {/* API Specific Fields */}
              {newQsType === 'api' && (
                <div className="p-2.5 rounded-lg bg-purple-950/20 border border-purple-500/30 space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-1/3">
                      <label className="block text-[10px] text-purple-300 mb-1 font-medium">Method</label>
                      <select
                        value={newQsMethod}
                        onChange={(e) => setNewQsMethod(e.target.value as any)}
                        className="w-full px-2 py-1 bg-[#141416] border border-obsidian-border rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:border-purple-400"
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </div>

                    <div className="w-2/3">
                      <label className="block text-[10px] text-purple-300 mb-1 font-medium">Headers (optional JSON)</label>
                      <input
                        type="text"
                        value={newQsHeaders}
                        onChange={(e) => setNewQsHeaders(e.target.value)}
                        placeholder='{"Accept": "application/json"}'
                        className="w-full px-2 py-1 bg-[#141416] border border-obsidian-border rounded-lg text-xs font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                  </div>

                  {['POST', 'PUT', 'PATCH', 'DELETE'].includes(newQsMethod) && (
                    <div>
                      <label className="block text-[10px] text-purple-300 mb-1 font-medium">Request Body</label>
                      <textarea
                        rows={2}
                        value={newQsBody}
                        onChange={(e) => setNewQsBody(e.target.value)}
                        placeholder='{"query": "example"}'
                        className="w-full p-2 bg-[#141416] border border-obsidian-border rounded-lg text-xs font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-purple-400 resize-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-obsidian-border">
                <button
                  type="button"
                  onClick={() => setNewQuickSourceOpen(false)}
                  className="px-3 py-1.5 bg-obsidian-hover hover:bg-[#2b2b35] text-obsidian-text rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newQsTitle.trim() || (newQsType === 'api' && !newQsUrl.trim())}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-semibold rounded-lg disabled:opacity-50"
                >
                  Add Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive API Requester Modal */}
      {apiModalQs && (
        <ApiQuickSourceModal
          isOpen={!!apiModalQs}
          onClose={() => setApiModalQs(null)}
          quickSource={apiModalQs}
          onUpdateQuickSource={onUpdateQuickSource}
          entities={entities || projectData?.entities || []}
          onAttachSourceToEntity={onAttachSourceToEntity}
          onAddEntityAttribute={onAddEntityAttribute}
          onCreateNoteOnEntity={onCreateNoteOnEntity}
        />
      )}
    </aside>
  );
};

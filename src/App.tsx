import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Entity,
  EntityType,
  GraphLayout,
  Note,
  Project,
  ProjectData,
  ProjectSummary,
  Relationship,
  SearchResult,
  Source,
  Tab,
  TabType,
  Workspace,
} from '@/types';
import { getStorageService } from '@/services/storage';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { TabBar } from '@/components/layout/TabBar';
import { GraphView } from '@/features/graph/GraphView';
import { EntityEditor } from '@/features/entities/EntityEditor';
import { RelationshipEditor } from '@/features/relationships/RelationshipEditor';
import { SourceEditor } from '@/features/sources/SourceEditor';
import { NoteEditor } from '@/features/notes/NoteEditor';
import { ProjectOverview } from '@/features/projects/ProjectOverview';
import { SearchView } from '@/features/search/SearchView';
import { NewEntityModal } from '@/components/modals/NewEntityModal';
import { NewRelationshipModal } from '@/components/modals/NewRelationshipModal';
import { NewProjectModal } from '@/components/modals/NewProjectModal';
import { DeleteConfirmModal } from '@/components/modals/DeleteConfirmModal';
import { CommandPaletteModal } from '@/components/modals/CommandPaletteModal';
import { ShortcutsModal } from '@/components/modals/ShortcutsModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import saveAs from 'file-saver';

export function App() {
  const storage = getStorageService();

  // App State
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [graphPositions, setGraphPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Layout Panels State
  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(true);

  // Tabs State
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'tab-graph', type: 'graph', title: 'Interactive Graph' },
    { id: 'tab-overview', type: 'overview', title: 'Project Overview' },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-graph');

  // Selection State
  const [selectedEntityId, setSelectedEntityId] = useState<string | undefined>(undefined);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | undefined>(undefined);

  // Modals State
  const [entityModalOpen, setEntityModalOpen] = useState<boolean>(false);
  const [entityModalDefaultType, setEntityModalDefaultType] = useState<EntityType | undefined>(undefined);
  const [relModalOpen, setRelModalOpen] = useState<boolean>(false);
  const [relModalDefaultSource, setRelModalDefaultSource] = useState<string | undefined>(undefined);
  const [projectModalOpen, setProjectModalOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);

  // Delete modal state
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    title: string;
    itemName: string;
    filePaths: string[];
    warningMessage?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    itemName: '',
    filePaths: [],
    warningMessage: undefined,
    onConfirm: () => {},
  });

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Open Project / Workspace in Finder or Explorer
  const handleOpenInExplorer = async (projectId?: string) => {
    const targetId = projectId || activeProjectId;
    try {
      const opened = await storage.openInExplorer(targetId);
      if (opened) {
        showToast(storage.isDesktop() ? 'Opening in File Explorer / Finder...' : 'Downloaded project archive (.zip)');
      }
    } catch (e) {
      console.error('Failed to open folder:', e);
      showToast('Could not open folder on disk');
    }
  };

  // Hidden File input ref for ZIP import
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load Workspace and Projects
  const loadWorkspaceData = useCallback(async () => {
    try {
      setIsLoading(true);
      const ws = await storage.getWorkspace();
      setWorkspace(ws);

      const projs = await storage.listProjects();
      setProjects(projs);

      let targetProjectId = ws.activeProjectId || projs[0]?.id;
      if (!targetProjectId && projs.length === 0) {
        const created = await storage.createProject('Default Investigation');
        targetProjectId = created.id;
        const updatedProjs = await storage.listProjects();
        setProjects(updatedProjs);
      }

      if (targetProjectId) {
        setActiveProjectId(targetProjectId);
        let data = await storage.getProject(targetProjectId);
        if (!data && projs.length > 0) {
          data = await storage.getProject(projs[0].id);
          setActiveProjectId(projs[0].id);
        }
        setProjectData(data);
        const layout = await storage.getGraphLayout(targetProjectId);
        setGraphPositions(layout.positions || {});
      }
    } catch (err) {
      console.error('Failed to load workspace:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storage]);

  useEffect(() => {
    loadWorkspaceData();

    // Listen to external/storage changes
    const unsubscribe = storage.onStorageChange((event) => {
      if (activeProjectId) {
        storage.getProject(activeProjectId).then((data) => {
          if (data) setProjectData(data);
        });
        storage.listProjects().then(setProjects);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [loadWorkspaceData]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
      // Cmd/Ctrl + [: Toggle Left Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '[') {
        e.preventDefault();
        setLeftSidebarOpen((prev) => !prev);
      }
      // Cmd/Ctrl + ]: Toggle Right Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === ']') {
        e.preventDefault();
        setRightSidebarOpen((prev) => !prev);
      }
      // Cmd/Ctrl + G: Jump to Graph
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        openTab('graph', undefined, 'Interactive Graph');
      }
      // Cmd/Ctrl + O: Jump to Overview
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        openTab('overview', undefined, 'Project Overview');
      }
      // Cmd/Ctrl + F: Search Tab
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        openTab('search', undefined, 'Full-Text Search');
      }
      // Cmd/Ctrl + ,: Open Settings
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setSettingsModalOpen((prev) => !prev);
      }
      // ? or Cmd/Ctrl + /: Open Shortcuts
      if (
        (e.key === '?' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) ||
        ((e.metaKey || e.ctrlKey) && e.key === '/')
      ) {
        e.preventDefault();
        setShortcutsModalOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Switch Active Project
  const handleSelectProject = async (projectId: string) => {
    if (projectId === activeProjectId) return;
    setIsLoading(true);
    setActiveProjectId(projectId);

    if (workspace) {
      await storage.saveWorkspace({ ...workspace, activeProjectId: projectId });
    }

    const data = await storage.getProject(projectId);
    setProjectData(data);
    const layout = await storage.getGraphLayout(projectId);
    setGraphPositions(layout.positions || {});

    // Reset tabs to default for new project
    setTabs([
      { id: 'tab-graph', type: 'graph', title: 'Interactive Graph' },
      { id: 'tab-overview', type: 'overview', title: 'Project Overview' },
    ]);
    setActiveTabId('tab-graph');
    setSelectedEntityId(undefined);
    setSelectedRelationshipId(undefined);
    setIsLoading(false);
    showToast(`Switched to project: ${data?.project.name}`);
  };

  // Tab Navigation Actions
  const openTab = (
    type: TabType,
    targetId?: string,
    title?: string,
    options?: { isPreview?: boolean; isPinned?: boolean }
  ) => {
    const tabId = targetId ? `tab-${type}-${targetId}` : `tab-${type}`;
    const existingIndex = tabs.findIndex((t) => t.id === tabId);

    if (existingIndex >= 0) {
      if (options?.isPinned) {
        setTabs((prev) =>
          prev.map((t) => (t.id === tabId ? { ...t, isPinned: true, isPreview: false } : t))
        );
      } else if (options?.isPreview === false) {
        setTabs((prev) =>
          prev.map((t) => (t.id === tabId ? { ...t, isPreview: false } : t))
        );
      }
      setActiveTabId(tabId);
    } else {
      const defaultTitle =
        title ||
        (type === 'graph'
          ? 'Interactive Graph'
          : type === 'overview'
          ? 'Project Overview'
          : type === 'search'
          ? 'Full-Text Search'
          : `${type.toUpperCase()} Record`);

      const wantsPreview =
        options?.isPreview ?? (type === 'entity' || type === 'relationship' || type === 'source' || type === 'note');

      // Check if there is an unpinned, clean preview tab that can be replaced (like VS Code!)
      const replaceablePreviewIndex = tabs.findIndex(
        (t) =>
          t.isPreview &&
          !t.isDirty &&
          !t.isPinned &&
          t.type !== 'graph' &&
          t.type !== 'overview' &&
          t.type !== 'search'
      );

      const newTab: Tab = {
        id: tabId,
        type,
        targetId,
        title: defaultTitle,
        isPinned: options?.isPinned ?? false,
        isPreview: wantsPreview,
        isDirty: false,
      };

      if (wantsPreview && replaceablePreviewIndex >= 0) {
        setTabs((prev) => {
          const updated = [...prev];
          updated[replaceablePreviewIndex] = newTab;
          return updated;
        });
      } else {
        setTabs((prev) => [...prev, newTab]);
      }
      setActiveTabId(tabId);
    }

    if (type === 'entity' && targetId) {
      setSelectedEntityId(targetId);
      setSelectedRelationshipId(undefined);
    } else if (type === 'relationship' && targetId) {
      setSelectedRelationshipId(targetId);
      setSelectedEntityId(undefined);
    }
  };

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return;
    const nextTabs = tabs.filter((t) => t.id !== tabId);
    setTabs(nextTabs);

    if (activeTabId === tabId) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id);
    }
  };

  const togglePinTab = (tabId: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId ? { ...t, isPinned: !t.isPinned, isPreview: false } : t
      )
    );
  };

  const closeOtherTabs = (tabId: string) => {
    setTabs((prev) => prev.filter((t) => t.id === tabId || t.isPinned));
    setActiveTabId(tabId);
  };

  const closeTabsToRight = (tabId: string) => {
    const idx = tabs.findIndex((t) => t.id === tabId);
    if (idx < 0) return;
    setTabs((prev) => prev.filter((t, i) => i <= idx || t.isPinned));
    setActiveTabId(tabId);
  };

  const setTabDirty = (tabId: string, isDirty: boolean) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === tabId ? { ...t, isDirty, isPreview: isDirty ? false : t.isPreview } : t
      )
    );
  };

  // Entity Actions
  const handleSaveEntity = async (entity: Entity) => {
    if (!activeProjectId) return;
    await storage.saveEntity(activeProjectId, entity);
    const updated = await storage.getProject(activeProjectId);
    setProjectData(updated);
    showToast(`Entity "${entity.name}" saved`);
  };

  const handleDeleteEntity = (entityId: string) => {
    if (!activeProjectId || !projectData) return;
    const entity = projectData.entities.find((e) => e.id === entityId);
    const name = entity ? entity.name : entityId;

    const connectedRels = projectData.relationships.filter(
      (r) => r.source_entity === entityId || r.target_entity === entityId
    );

    setDeleteModalState({
      isOpen: true,
      title: 'Delete Entity',
      itemName: name,
      filePaths: [
        `projects/${activeProjectId}/entities/${entityId}.md`,
        ...connectedRels.map((r) => `projects/${activeProjectId}/relationships/${r.id}.md`),
      ],
      warningMessage:
        connectedRels.length > 0
          ? `Deleting this entity will also remove ${connectedRels.length} connected relationship record(s).`
          : undefined,
      onConfirm: async () => {
        await storage.deleteEntity(activeProjectId, entityId);
        const updated = await storage.getProject(activeProjectId);
        setProjectData(updated);
        closeTab(`tab-entity-${entityId}`);
        if (selectedEntityId === entityId) setSelectedEntityId(undefined);
        showToast(`Entity "${name}" deleted`);
      },
    });
  };

  // Relationship Actions
  const handleSaveRelationship = async (rel: Relationship) => {
    if (!activeProjectId) return;
    await storage.saveRelationship(activeProjectId, rel);
    const updated = await storage.getProject(activeProjectId);
    setProjectData(updated);
    showToast(`Relationship "${rel.type}" saved`);
  };

  const handleDeleteRelationship = (relId: string) => {
    if (!activeProjectId || !projectData) return;
    const rel = projectData.relationships.find((r) => r.id === relId);
    const name = rel ? `Relationship: ${rel.type}` : relId;

    setDeleteModalState({
      isOpen: true,
      title: 'Delete Relationship',
      itemName: name,
      filePaths: [`projects/${activeProjectId}/relationships/${relId}.md`],
      onConfirm: async () => {
        await storage.deleteRelationship(activeProjectId, relId);
        const updated = await storage.getProject(activeProjectId);
        setProjectData(updated);
        closeTab(`tab-relationship-${relId}`);
        if (selectedRelationshipId === relId) setSelectedRelationshipId(undefined);
        showToast(`Relationship deleted`);
      },
    });
  };

  // Source Actions
  const handleSaveSource = async (source: Source) => {
    if (!activeProjectId) return;
    await storage.saveSource(activeProjectId, source);
    const updated = await storage.getProject(activeProjectId);
    setProjectData(updated);
    showToast(`Source "${source.title}" saved`);
  };

  const handleDeleteSource = (sourceId: string) => {
    if (!activeProjectId || !projectData) return;
    const src = projectData.sources.find((s) => s.id === sourceId);
    const name = src ? src.title : sourceId;

    setDeleteModalState({
      isOpen: true,
      title: 'Delete Source',
      itemName: name,
      filePaths: [`projects/${activeProjectId}/sources/${sourceId}.md`],
      warningMessage:
        'Any relationship records citing this source will have their evidence references updated.',
      onConfirm: async () => {
        await storage.deleteSource(activeProjectId, sourceId);
        const updated = await storage.getProject(activeProjectId);
        setProjectData(updated);
        closeTab(`tab-source-${sourceId}`);
        showToast(`Source "${name}" deleted`);
      },
    });
  };

  // Note Actions
  const handleSaveNote = async (note: Note) => {
    if (!activeProjectId) return;
    await storage.saveNote(activeProjectId, note);
    const updated = await storage.getProject(activeProjectId);
    setProjectData(updated);
    showToast(`Note "${note.title}" saved`);
  };

  const handleDeleteNote = (noteId: string) => {
    if (!activeProjectId || !projectData) return;
    const note = projectData.notes.find((n) => n.id === noteId);
    const name = note ? note.title : noteId;

    setDeleteModalState({
      isOpen: true,
      title: 'Delete Note',
      itemName: name,
      filePaths: [`projects/${activeProjectId}/notes/${noteId}.md`],
      onConfirm: async () => {
        await storage.deleteNote(activeProjectId, noteId);
        const updated = await storage.getProject(activeProjectId);
        setProjectData(updated);
        closeTab(`tab-note-${noteId}`);
        showToast(`Note "${name}" deleted`);
      },
    });
  };

  // Project Actions
  const handleCreateProject = async (name: string, description: string) => {
    const proj = await storage.createProject(name, description);
    await loadWorkspaceData();
    openTab('overview', undefined, 'Project Overview');
    showToast(`Created project: ${proj.name}`);
  };

  const handleDeleteProject = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    const name = proj ? proj.name : projectId;

    setDeleteModalState({
      isOpen: true,
      title: 'Delete Investigation Project',
      itemName: name,
      filePaths: [
        `projects/${projectId}/project.md`,
        `projects/${projectId}/graph-layout.json`,
        `projects/${projectId}/entities/ (*.md)`,
        `projects/${projectId}/relationships/ (*.md)`,
        `projects/${projectId}/sources/ (*.md)`,
        `projects/${projectId}/notes/ (*.md)`,
        `SQLite Index records for ${projectId}`,
      ],
      warningMessage:
        'This will permanently delete the entire project directory and all canonical Markdown files.',
      onConfirm: async () => {
        await storage.deleteProject(projectId);
        await loadWorkspaceData();
        showToast(`Deleted project: ${name}`);
      },
    });
  };

  // Save layout positions
  const handleSavePositions = async (positions: Record<string, { x: number; y: number }>) => {
    if (!activeProjectId) return;
    await storage.saveGraphLayout(activeProjectId, { positions });
    setGraphPositions(positions);
    showToast('Graph node layout positions saved');
  };

  // Rebuild Index
  const handleRebuildIndex = async () => {
    if (!activeProjectId) return;
    await storage.rebuildIndex(activeProjectId);
    showToast('SQLite full-text index rebuilt from Markdown records');
  };

  // Export ZIP
  const handleExportZip = async () => {
    if (!activeProjectId || !projectData) return;
    try {
      const blob = await storage.exportProjectZip(activeProjectId);
      saveAs(blob, `${projectData.project.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-export.zip`);
      showToast('Project exported as canonical Markdown ZIP');
    } catch (err) {
      console.error('Export failed:', err);
      showToast('Export failed');
    }
  };

  // Import ZIP
  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Importing project archive...');
      const importedId = await storage.importProjectZip(file);
      await loadWorkspaceData();
      setActiveProjectId(importedId);
      openTab('overview', undefined, 'Project Overview');
      showToast('Project imported successfully');
    } catch (err) {
      console.error('Import failed:', err);
      alert(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-obsidian-bg text-obsidian-text font-sans">
      {/* Hidden File Input for ZIP Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zip"
        onChange={handleImportFileChange}
        className="hidden"
      />

      {/* Left Sidebar */}
      {workspace && (
        <LeftSidebar
          isOpen={leftSidebarOpen}
          onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
          workspace={workspace}
          projects={projects}
          activeProjectId={activeProjectId}
          projectData={projectData}
          onSelectProject={handleSelectProject}
          onCreateProjectModal={() => setProjectModalOpen(true)}
          onDeleteProject={handleDeleteProject}
          activeTabType={activeTab?.type}
          activeTargetId={activeTab?.targetId}
          onOpenTab={openTab}
          onCreateEntityModal={(defaultType) => {
            setEntityModalDefaultType(defaultType);
            setEntityModalOpen(true);
          }}
          onCreateRelationshipModal={(sourceId) => {
            setRelModalDefaultSource(sourceId);
            setRelModalOpen(true);
          }}
          onCreateSourceModal={() => {
            if (!activeProjectId) return;
            const now = new Date().toISOString();
            const newSource: Source = {
              id: `src-${Date.now().toString(36)}`,
              type: 'source',
              title: 'New Evidence Source',
              accessed_at: now,
              source_type: 'webpage',
              markdownBody: '# New Source\n\n## Extract\n\nRecord excerpt...\n\n## Notes\n\nNotes...',
            };
            storage.saveSource(activeProjectId, newSource).then(async () => {
              const updated = await storage.getProject(activeProjectId);
              setProjectData(updated);
              openTab('source', newSource.id, newSource.title);
            });
          }}
          onCreateNoteModal={() => {
            if (!activeProjectId) return;
            const now = new Date().toISOString();
            const newNote: Note = {
              id: `note-${Date.now().toString(36)}`,
              type: 'note',
              title: 'Investigation Note',
              tags: [],
              created_at: now,
              updated_at: now,
              markdownBody: '# Investigation Note\n\nRecord observations...',
            };
            storage.saveNote(activeProjectId, newNote).then(async () => {
              const updated = await storage.getProject(activeProjectId);
              setProjectData(updated);
              openTab('note', newNote.id, newNote.title);
            });
          }}
          onExportZip={handleExportZip}
          onImportZip={() => fileInputRef.current?.click()}
          onRebuildIndex={handleRebuildIndex}
          onDeleteEntity={handleDeleteEntity}
          onDeleteRelationship={handleDeleteRelationship}
          onDeleteSource={handleDeleteSource}
          onDeleteNote={handleDeleteNote}
          isDesktop={storage.isDesktop()}
          onOpenInExplorer={handleOpenInExplorer}
          onOpenSettings={() => setSettingsModalOpen(true)}
          onOpenShortcuts={() => setShortcutsModalOpen(true)}
        />
      )}

      {/* Center Main Workspace */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-obsidian-panel min-w-0">
        {/* Tab Bar */}
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSelectTab={setActiveTabId}
          onCloseTab={closeTab}
          onNewTab={() => openTab('graph', undefined, 'Interactive Graph', { isPinned: true })}
          onTogglePinTab={togglePinTab}
          onCloseOtherTabs={closeOtherTabs}
          onCloseTabsToRight={closeTabsToRight}
        />

        {/* Tab Content Canvas */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-[#141416]/80 backdrop-blur z-20 flex flex-col items-center justify-center text-xs text-obsidian-muted gap-2.5">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Loading investigation project...</span>
            </div>
          )}

          {!isLoading && !projectData && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-xs text-obsidian-muted gap-3">
              <p>No active investigation project loaded.</p>
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
              >
                Reset & Reload Workspace
              </button>
            </div>
          )}

          {projectData && activeTab && (
            <>
              {activeTab.type === 'graph' && (
                <GraphView
                  projectData={projectData}
                  selectedEntityId={selectedEntityId}
                  selectedRelationshipId={selectedRelationshipId}
                  onSelectEntity={(id) => {
                    setSelectedEntityId(id);
                    setSelectedRelationshipId(undefined);
                  }}
                  onSelectRelationship={(id) => {
                    setSelectedRelationshipId(id);
                    setSelectedEntityId(undefined);
                  }}
                  onOpenEntity={(id) => {
                    const e = projectData.entities.find((ent) => ent.id === id);
                    openTab('entity', id, e ? e.name : id);
                  }}
                  onOpenRelationship={(id) => {
                    const r = projectData.relationships.find((rel) => rel.id === id);
                    openTab('relationship', id, r ? `Rel: ${r.type}` : id);
                  }}
                  onOpenNote={(id) => {
                    const n = projectData.notes.find((nt) => nt.id === id);
                    openTab('note', id, n ? n.title : id);
                  }}
                  onCreateEntity={() => setEntityModalOpen(true)}
                  onCreateRelationshipFromEntity={(sourceId) => {
                    setRelModalDefaultSource(sourceId);
                    setRelModalOpen(true);
                  }}
                  onDeleteEntity={handleDeleteEntity}
                  onDeleteRelationship={handleDeleteRelationship}
                  onDeleteNote={handleDeleteNote}
                  initialPositions={graphPositions}
                  onSavePositions={handleSavePositions}
                />
              )}

              {activeTab.type === 'overview' && (
                <ProjectOverview
                  projectData={projectData}
                  onSaveProject={(p) => storage.saveProject(p)}
                  onOpenGraph={() => openTab('graph', undefined, 'Interactive Graph')}
                  onCreateEntity={() => setEntityModalOpen(true)}
                  onCreateRelationship={() => setRelModalOpen(true)}
                  onExportZip={handleExportZip}
                  onRebuildIndex={handleRebuildIndex}
                  onOpenEntity={(id) => {
                    const e = projectData.entities.find((ent) => ent.id === id);
                    openTab('entity', id, e ? e.name : id);
                  }}
                  onOpenInExplorer={() => handleOpenInExplorer()}
                />
              )}

              {activeTab.type === 'entity' && activeTab.targetId && (
                (() => {
                  const entity = projectData.entities.find((e) => e.id === activeTab.targetId);
                  if (!entity) {
                    return (
                      <div className="p-8 text-center text-obsidian-dim">
                        Entity not found or has been deleted.
                      </div>
                    );
                  }
                  return (
                    <EntityEditor
                      entity={entity}
                      projectData={projectData}
                      onSave={handleSaveEntity}
                      onDelete={handleDeleteEntity}
                      onOpenEntity={(id) => {
                        const e = projectData.entities.find((ent) => ent.id === id);
                        openTab('entity', id, e ? e.name : id);
                      }}
                      onOpenRelationship={(id) => {
                        const r = projectData.relationships.find((rel) => rel.id === id);
                        openTab('relationship', id, r ? `Rel: ${r.type}` : id);
                      }}
                      onCreateRelationship={(sourceId) => {
                        setRelModalDefaultSource(sourceId);
                        setRelModalOpen(true);
                      }}
                      onShowInGraph={(id) => {
                        setSelectedEntityId(id);
                        openTab('graph', undefined, 'Interactive Graph');
                      }}
                      onDirtyChange={(dirty) => setTabDirty(activeTab.id, dirty)}
                    />
                  );
                })()
              )}

              {activeTab.type === 'relationship' && activeTab.targetId && (
                (() => {
                  const rel = projectData.relationships.find((r) => r.id === activeTab.targetId);
                  if (!rel) {
                    return (
                      <div className="p-8 text-center text-obsidian-dim">
                        Relationship not found or has been deleted.
                      </div>
                    );
                  }
                  return (
                    <RelationshipEditor
                      relationship={rel}
                      projectData={projectData}
                      onSave={handleSaveRelationship}
                      onDelete={handleDeleteRelationship}
                      onOpenEntity={(id) => {
                        const e = projectData.entities.find((ent) => ent.id === id);
                        openTab('entity', id, e ? e.name : id);
                      }}
                      onOpenSource={(id) => {
                        const s = projectData.sources.find((src) => src.id === id);
                        openTab('source', id, s ? s.title : id);
                      }}
                      onShowInGraph={(id) => {
                        setSelectedRelationshipId(id);
                        openTab('graph', undefined, 'Interactive Graph');
                      }}
                    />
                  );
                })()
              )}

              {activeTab.type === 'source' && activeTab.targetId && (
                (() => {
                  const src = projectData.sources.find((s) => s.id === activeTab.targetId);
                  if (!src) {
                    return (
                      <div className="p-8 text-center text-obsidian-dim">
                        Source not found or has been deleted.
                      </div>
                    );
                  }
                  return (
                    <SourceEditor
                      source={src}
                      projectData={projectData}
                      onSave={handleSaveSource}
                      onDelete={handleDeleteSource}
                      onOpenRelationship={(id) => {
                        const r = projectData.relationships.find((rel) => rel.id === id);
                        openTab('relationship', id, r ? `Rel: ${r.type}` : id);
                      }}
                      onOpenEntity={(id) => {
                        const e = projectData.entities.find((ent) => ent.id === id);
                        openTab('entity', id, e ? e.name : id);
                      }}
                    />
                  );
                })()
              )}

              {activeTab.type === 'note' && activeTab.targetId && (
                (() => {
                  const note = projectData.notes.find((n) => n.id === activeTab.targetId);
                  if (!note) {
                    return (
                      <div className="p-8 text-center text-obsidian-dim">
                        Note not found or has been deleted.
                      </div>
                    );
                  }
                  return (
                    <NoteEditor
                      note={note}
                      projectData={projectData}
                      onSave={handleSaveNote}
                      onDelete={handleDeleteNote}
                      onOpenEntity={(id) => {
                        const e = projectData.entities.find((ent) => ent.id === id);
                        openTab('entity', id, e ? e.name : id);
                      }}
                    />
                  );
                })()
              )}

              {activeTab.type === 'search' && activeProjectId && (
                <SearchView
                  onSearch={(q) => storage.search(activeProjectId, q)}
                  onSelectResult={(res) => {
                    if (res.type === 'entity') {
                      openTab('entity', res.id, res.title);
                    } else if (res.type === 'relationship') {
                      openTab('relationship', res.id, res.title);
                    } else if (res.type === 'source') {
                      openTab('source', res.id, res.title);
                    } else if (res.type === 'note') {
                      openTab('note', res.id, res.title);
                    } else if (res.type === 'project') {
                      openTab('overview', undefined, 'Project Overview');
                    }
                  }}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Right Sidebar Context Inspector */}
      {projectData && (
        <RightSidebar
          isOpen={rightSidebarOpen}
          onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
          projectData={projectData}
          selectedEntityId={selectedEntityId}
          selectedRelationshipId={selectedRelationshipId}
          onOpenEntity={(id) => {
            const e = projectData.entities.find((ent) => ent.id === id);
            openTab('entity', id, e ? e.name : id);
          }}
          onOpenRelationship={(id) => {
            const r = projectData.relationships.find((rel) => rel.id === id);
            openTab('relationship', id, r ? `Rel: ${r.type}` : id);
          }}
          onOpenSource={(id) => {
            const s = projectData.sources.find((src) => src.id === id);
            openTab('source', id, s ? s.title : id);
          }}
          onCreateRelationship={(sourceId) => {
            setRelModalDefaultSource(sourceId);
            setRelModalOpen(true);
          }}
        />
      )}

      {/* Modals */}
      <NewEntityModal
        isOpen={entityModalOpen}
        onClose={() => setEntityModalOpen(false)}
        onCreate={async (newEntity) => {
          if (!activeProjectId) return;
          await handleSaveEntity(newEntity);
          openTab('entity', newEntity.id, newEntity.name);
        }}
        defaultType={entityModalDefaultType}
      />

      {projectData && (
        <NewRelationshipModal
          isOpen={relModalOpen}
          onClose={() => setRelModalOpen(false)}
          onCreate={async (newRel) => {
            if (!activeProjectId) return;
            await handleSaveRelationship(newRel);
            openTab('relationship', newRel.id, `Rel: ${newRel.type}`);
          }}
          projectData={projectData}
          defaultSourceId={relModalDefaultSource}
        />
      )}

      <NewProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />

      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalState.onConfirm}
        title={deleteModalState.title}
        itemName={deleteModalState.itemName}
        filePathsToDelete={deleteModalState.filePaths}
        warningMessage={deleteModalState.warningMessage}
      />

      <CommandPaletteModal
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        projectData={projectData}
        onOpenTab={openTab}
        onCreateEntity={() => setEntityModalOpen(true)}
        onCreateRelationship={() => setRelModalOpen(true)}
      />

      <ShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        workspace={workspace}
        activeProjectId={activeProjectId}
        isDesktop={storage.isDesktop()}
        onOpenInExplorer={handleOpenInExplorer}
        onExportZip={handleExportZip}
        onRebuildIndex={handleRebuildIndex}
        onOpenShortcuts={() => setShortcutsModalOpen(true)}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-[#1e1e24] border border-obsidian-accent text-white px-3 py-2 rounded-md shadow-popover text-xs flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-obsidian-accent" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;

import {
  Entity,
  GraphLayout,
  Note,
  Project,
  ProjectData,
  ProjectSummary,
  Relationship,
  SearchResult,
  Source,
  StorageChangeEvent,
  Workspace,
} from '@/types';

export interface IStorageService {
  isDesktop(): boolean;
  getWorkspace(): Promise<Workspace>;
  saveWorkspace(workspace: Workspace): Promise<void>;
  
  // Projects
  listProjects(): Promise<ProjectSummary[]>;
  createProject(name: string, description?: string): Promise<Project>;
  getProject(id: string): Promise<ProjectData | null>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;

  // Entities
  saveEntity(projectId: string, entity: Entity): Promise<void>;
  deleteEntity(projectId: string, entityId: string): Promise<void>;

  // Relationships
  saveRelationship(projectId: string, rel: Relationship): Promise<void>;
  deleteRelationship(projectId: string, relId: string): Promise<void>;

  // Sources
  saveSource(projectId: string, source: Source): Promise<void>;
  deleteSource(projectId: string, sourceId: string): Promise<void>;

  // Notes
  saveNote(projectId: string, note: Note): Promise<void>;
  deleteNote(projectId: string, noteId: string): Promise<void>;

  // Graph Layout
  getGraphLayout(projectId: string): Promise<GraphLayout>;
  saveGraphLayout(projectId: string, layout: GraphLayout): Promise<void>;

  // Search & Indexing
  search(projectId: string, query: string): Promise<SearchResult[]>;
  rebuildIndex(projectId: string): Promise<void>;

  // Import / Export & File System
  exportProjectZip(projectId: string): Promise<Blob>;
  importProjectZip(file: File | ArrayBuffer): Promise<string>;
  openInExplorer(projectId?: string): Promise<boolean>;

  // Events & File Watching
  onStorageChange(listener: (event: StorageChangeEvent) => void): () => void;
}

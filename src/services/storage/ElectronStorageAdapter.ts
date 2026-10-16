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
import { IStorageService } from './IStorageService';
import {
  serializeEntityFile,
  serializeNoteFile,
  serializeProjectFile,
  serializeRelationshipFile,
  serializeSourceFile,
} from '../markdownParser';

declare global {
  interface Window {
    electronAPI?: {
      isDesktop: boolean;
      getWorkspace: () => Promise<Workspace>;
      saveWorkspace: (ws: Workspace) => Promise<void>;
      listProjects: () => Promise<ProjectSummary[]>;
      createProject: (name: string, description?: string) => Promise<Project>;
      getProject: (id: string) => Promise<ProjectData | null>;
      saveProject: (raw: string) => Promise<void>;
      deleteProject: (id: string) => Promise<void>;
      saveEntity: (projectId: string, entityId: string, raw: string) => Promise<void>;
      deleteEntity: (projectId: string, entityId: string) => Promise<void>;
      saveRelationship: (projectId: string, relId: string, raw: string) => Promise<void>;
      deleteRelationship: (projectId: string, relId: string) => Promise<void>;
      saveSource: (projectId: string, sourceId: string, raw: string) => Promise<void>;
      deleteSource: (projectId: string, sourceId: string) => Promise<void>;
      saveNote: (projectId: string, noteId: string, raw: string) => Promise<void>;
      deleteNote: (projectId: string, noteId: string) => Promise<void>;
      getGraphLayout: (projectId: string) => Promise<GraphLayout>;
      saveGraphLayout: (projectId: string, layout: GraphLayout) => Promise<void>;
      search: (projectId: string, query: string) => Promise<SearchResult[]>;
      rebuildIndex: (projectId: string) => Promise<void>;
      exportProjectZip: (projectId: string) => Promise<ArrayBuffer>;
      importProjectZip: (data: ArrayBuffer) => Promise<string>;
      openInExplorer: (projectId?: string) => Promise<boolean>;
      onStorageChange: (callback: (event: StorageChangeEvent) => void) => () => void;
      selectDirectory: () => Promise<string | null>;
    };
  }
}

export class ElectronStorageAdapter implements IStorageService {
  isDesktop(): boolean {
    return true;
  }

  private get api() {
    if (!window.electronAPI) {
      throw new Error('Electron API is not available in browser mode');
    }
    return window.electronAPI;
  }

  async getWorkspace(): Promise<Workspace> {
    return this.api.getWorkspace();
  }

  async saveWorkspace(workspace: Workspace): Promise<void> {
    return this.api.saveWorkspace(workspace);
  }

  async listProjects(): Promise<ProjectSummary[]> {
    return this.api.listProjects();
  }

  async createProject(name: string, description?: string): Promise<Project> {
    return this.api.createProject(name, description);
  }

  async getProject(id: string): Promise<ProjectData | null> {
    return this.api.getProject(id);
  }

  async saveProject(project: Project): Promise<void> {
    const raw = serializeProjectFile(project);
    return this.api.saveProject(raw);
  }

  async deleteProject(id: string): Promise<void> {
    return this.api.deleteProject(id);
  }

  async saveEntity(projectId: string, entity: Entity): Promise<void> {
    const raw = serializeEntityFile(entity);
    return this.api.saveEntity(projectId, entity.id, raw);
  }

  async deleteEntity(projectId: string, entityId: string): Promise<void> {
    return this.api.deleteEntity(projectId, entityId);
  }

  async saveRelationship(projectId: string, rel: Relationship): Promise<void> {
    const raw = serializeRelationshipFile(rel);
    return this.api.saveRelationship(projectId, rel.id, raw);
  }

  async deleteRelationship(projectId: string, relId: string): Promise<void> {
    return this.api.deleteRelationship(projectId, relId);
  }

  async saveSource(projectId: string, source: Source): Promise<void> {
    const raw = serializeSourceFile(source);
    return this.api.saveSource(projectId, source.id, raw);
  }

  async deleteSource(projectId: string, sourceId: string): Promise<void> {
    return this.api.deleteSource(projectId, sourceId);
  }

  async saveNote(projectId: string, note: Note): Promise<void> {
    const raw = serializeNoteFile(note);
    return this.api.saveNote(projectId, note.id, raw);
  }

  async deleteNote(projectId: string, noteId: string): Promise<void> {
    return this.api.deleteNote(projectId, noteId);
  }

  async getGraphLayout(projectId: string): Promise<GraphLayout> {
    return this.api.getGraphLayout(projectId);
  }

  async saveGraphLayout(projectId: string, layout: GraphLayout): Promise<void> {
    return this.api.saveGraphLayout(projectId, layout);
  }

  async search(projectId: string, query: string): Promise<SearchResult[]> {
    return this.api.search(projectId, query);
  }

  async rebuildIndex(projectId: string): Promise<void> {
    return this.api.rebuildIndex(projectId);
  }

  async exportProjectZip(projectId: string): Promise<Blob> {
    const buffer = await this.api.exportProjectZip(projectId);
    return new Blob([buffer], { type: 'application/zip' });
  }

  async importProjectZip(file: File | ArrayBuffer): Promise<string> {
    const buffer = file instanceof File ? await file.arrayBuffer() : file;
    return this.api.importProjectZip(buffer);
  }

  async openInExplorer(projectId?: string): Promise<boolean> {
    return this.api.openInExplorer(projectId);
  }

  onStorageChange(listener: (event: StorageChangeEvent) => void): () => void {
    return this.api.onStorageChange(listener);
  }
}

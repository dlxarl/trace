import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let currentWorkspacePath = path.join(app.getPath('documents'), 'Trace-OSINT-Workspace');

function ensureDirSync(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function atomicWriteFileSync(filePath: string, data: string | Buffer) {
  ensureDirSync(path.dirname(filePath));
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, data);
  fs.renameSync(tempPath, filePath);
}

function sanitizeRelativePath(baseDir: string, targetPath: string): string {
  const resolved = path.resolve(baseDir, targetPath);
  if (!resolved.startsWith(path.resolve(baseDir))) {
    throw new Error('Access denied: path traversal detected');
  }
  return resolved;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1000,
    minHeight: 650,
    backgroundColor: '#141416',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Intercept external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  ensureDirSync(currentWorkspacePath);
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIpcHandlers() {
  // Dialog: Select directory
  ipcMain.handle('dialog:selectDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Trace OSINT Workspace Directory',
    });
    if (!result.canceled && result.filePaths.length > 0) {
      currentWorkspacePath = result.filePaths[0];
      return currentWorkspacePath;
    }
    return null;
  });

  // Workspace: Get
  ipcMain.handle('workspace:get', async () => {
    const wsFile = path.join(currentWorkspacePath, 'workspace.json');
    if (fs.existsSync(wsFile)) {
      try {
        const raw = fs.readFileSync(wsFile, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse workspace.json:', err);
      }
    }
    const now = new Date().toISOString();
    const defaultWs = {
      id: 'default-workspace',
      name: 'Local OSINT Workspace',
      workspacePath: currentWorkspacePath,
      created_at: now,
      updated_at: now,
    };
    atomicWriteFileSync(wsFile, JSON.stringify(defaultWs, null, 2));
    return defaultWs;
  });

  // Workspace: Save
  ipcMain.handle('workspace:save', async (_, ws) => {
    const wsFile = path.join(currentWorkspacePath, 'workspace.json');
    atomicWriteFileSync(wsFile, JSON.stringify(ws, null, 2));
  });

  // Projects: List
  ipcMain.handle('projects:list', async () => {
    const projectsDir = path.join(currentWorkspacePath, 'projects');
    ensureDirSync(projectsDir);

    const summaries: any[] = [];
    const entries = fs.readdirSync(projectsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projDir = path.join(projectsDir, entry.name);
        const projFile = path.join(projDir, 'project.md');
        if (fs.existsSync(projFile)) {
          const entitiesDir = path.join(projDir, 'entities');
          const relsDir = path.join(projDir, 'relationships');
          const sourcesDir = path.join(projDir, 'sources');
          const notesDir = path.join(projDir, 'notes');

          const entityCount = fs.existsSync(entitiesDir)
            ? fs.readdirSync(entitiesDir).filter((f) => f.endsWith('.md')).length
            : 0;
          const relationshipCount = fs.existsSync(relsDir)
            ? fs.readdirSync(relsDir).filter((f) => f.endsWith('.md')).length
            : 0;
          const sourceCount = fs.existsSync(sourcesDir)
            ? fs.readdirSync(sourcesDir).filter((f) => f.endsWith('.md')).length
            : 0;
          const noteCount = fs.existsSync(notesDir)
            ? fs.readdirSync(notesDir).filter((f) => f.endsWith('.md')).length
            : 0;

          const stats = fs.statSync(projFile);
          summaries.push({
            id: entry.name,
            name: entry.name,
            entityCount,
            relationshipCount,
            sourceCount,
            noteCount,
            updated_at: stats.mtime.toISOString(),
          });
        }
      }
    }

    return summaries;
  });

  // Projects: Get
  ipcMain.handle('projects:get', async (_, id: string) => {
    const projDir = sanitizeRelativePath(path.join(currentWorkspacePath, 'projects'), id);
    const projFile = path.join(projDir, 'project.md');
    if (!fs.existsSync(projFile)) return null;

    const projectRaw = fs.readFileSync(projFile, 'utf-8');

    const readDirFiles = (subdir: string) => {
      const fullPath = path.join(projDir, subdir);
      if (!fs.existsSync(fullPath)) return [];
      return fs
        .readdirSync(fullPath)
        .filter((f) => f.endsWith('.md'))
        .map((f) => ({
          id: f.replace('.md', ''),
          raw: fs.readFileSync(path.join(fullPath, f), 'utf-8'),
        }));
    };

    return {
      projectRaw,
      entities: readDirFiles('entities'),
      relationships: readDirFiles('relationships'),
      sources: readDirFiles('sources'),
      notes: readDirFiles('notes'),
    };
  });

  // Projects: Delete
  ipcMain.handle('projects:delete', async (_, id: string) => {
    const projDir = sanitizeRelativePath(path.join(currentWorkspacePath, 'projects'), id);
    if (fs.existsSync(projDir)) {
      fs.rmSync(projDir, { recursive: true, force: true });
    }
  });

  // Entities: Save
  ipcMain.handle('entities:save', async (_, { projectId, entityId, raw }) => {
    const filePath = sanitizeRelativePath(
      path.join(currentWorkspacePath, 'projects', projectId, 'entities'),
      `${entityId}.md`
    );
    atomicWriteFileSync(filePath, raw);
  });

  // Entities: Delete
  ipcMain.handle('entities:delete', async (_, { projectId, entityId }) => {
    const filePath = sanitizeRelativePath(
      path.join(currentWorkspacePath, 'projects', projectId, 'entities'),
      `${entityId}.md`
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  // Relationships: Save
  ipcMain.handle('relationships:save', async (_, { projectId, relId, raw }) => {
    const filePath = sanitizeRelativePath(
      path.join(currentWorkspacePath, 'projects', projectId, 'relationships'),
      `${relId}.md`
    );
    atomicWriteFileSync(filePath, raw);
  });

  // Relationships: Delete
  ipcMain.handle('relationships:delete', async (_, { projectId, relId }) => {
    const filePath = sanitizeRelativePath(
      path.join(currentWorkspacePath, 'projects', projectId, 'relationships'),
      `${relId}.md`
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  // Sources: Save
  ipcMain.handle('sources:save', async (_, { projectId, sourceId, raw }) => {
    const filePath = sanitizeRelativePath(
      path.join(currentWorkspacePath, 'projects', projectId, 'sources'),
      `${sourceId}.md`
    );
    atomicWriteFileSync(filePath, raw);
  });

  // Sources: Delete
  ipcMain.handle('sources:delete', async (_, { projectId, sourceId }) => {
    const filePath = sanitizeRelativePath(
      path.join(currentWorkspacePath, 'projects', projectId, 'sources'),
      `${sourceId}.md`
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  // Notes: Save
  ipcMain.handle('notes:save', async (_, { projectId, noteId, raw }) => {
    const filePath = sanitizeRelativePath(
      path.join(currentWorkspacePath, 'projects', projectId, 'notes'),
      `${noteId}.md`
    );
    atomicWriteFileSync(filePath, raw);
  });

  // Notes: Delete
  ipcMain.handle('notes:delete', async (_, { projectId, noteId }) => {
    const filePath = sanitizeRelativePath(
      path.join(currentWorkspacePath, 'projects', projectId, 'notes'),
      `${noteId}.md`
    );
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  // Graph Layout: Get & Save
  ipcMain.handle('graph:getLayout', async (_, projectId: string) => {
    const filePath = sanitizeRelativePath(
      path.join(currentWorkspacePath, 'projects', projectId),
      'graph-layout.json'
    );
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } catch {}
    }
    return { positions: {} };
  });

  ipcMain.handle('graph:saveLayout', async (_, { projectId, layout }) => {
    const filePath = sanitizeRelativePath(
      path.join(currentWorkspacePath, 'projects', projectId),
      'graph-layout.json'
    );
    atomicWriteFileSync(filePath, JSON.stringify(layout, null, 2));
  });

  // Open Project / Workspace in Finder / File Explorer
  ipcMain.handle('workspace:openInExplorer', async (_, projectId?: string) => {
    let targetPath = currentWorkspacePath;
    if (projectId) {
      const projDir = path.join(currentWorkspacePath, 'projects', projectId);
      if (fs.existsSync(projDir)) {
        targetPath = projDir;
      }
    }
    await shell.openPath(targetPath);
    return true;
  });
}

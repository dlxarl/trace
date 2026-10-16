import { BrowserStorageAdapter } from './BrowserStorageAdapter';
import { ElectronStorageAdapter } from './ElectronStorageAdapter';
import { IStorageService } from './IStorageService';

let storageInstance: IStorageService | null = null;

export function getStorageService(): IStorageService {
  if (!storageInstance) {
    if (typeof window !== 'undefined' && window.electronAPI) {
      storageInstance = new ElectronStorageAdapter();
    } else {
      storageInstance = new BrowserStorageAdapter();
    }
  }
  return storageInstance;
}

export * from './IStorageService';
export * from './BrowserStorageAdapter';
export * from './ElectronStorageAdapter';

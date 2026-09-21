import { exportAllDataAsJSON } from './storage';

export interface AutoBackupMeta {
  enabled: boolean;
  folderName: string;
  lastSavedAt: string | null;
  status: 'idle' | 'saving' | 'synced' | 'error' | 'needs_permission';
  errorMessage?: string;
}

const META_STORAGE_KEY = 'dayplanner_autobackup_meta';
const DB_NAME = 'dayplanner_autobackup_db';
const DB_VERSION = 1;
const STORE_NAME = 'handles';
const HANDLE_KEY = 'backup_directory';
export const BACKUP_FILE_NAME = 'dayplanner-backup.json';

// In-memory cache of the handle once loaded
let cachedHandle: FileSystemDirectoryHandle | null = null;

// Helper to check File System Access API support
export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showDirectoryPicker' in window &&
    typeof (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker === 'function'
  );
}

// Open IndexedDB
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB is not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save handle to IndexedDB
async function saveDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(handle, HANDLE_KEY);
    tx.oncomplete = () => {
      cachedHandle = handle;
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

// Retrieve handle from IndexedDB
export async function getSavedDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (cachedHandle) return cachedHandle;
  if (typeof window === 'undefined' || !('indexedDB' in window)) return null;

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(HANDLE_KEY);
      req.onsuccess = () => {
        if (req.result) {
          cachedHandle = req.result as FileSystemDirectoryHandle;
          resolve(cachedHandle);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to get directory handle from IndexedDB:', err);
    return null;
  }
}

// Delete handle from IndexedDB
export async function removeSavedDirectoryHandle(): Promise<void> {
  cachedHandle = null;
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(HANDLE_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore error
  }
}

// Read current auto-backup metadata from localStorage
export function getAutoBackupMeta(): AutoBackupMeta {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      folderName: '',
      lastSavedAt: null,
      status: 'idle',
    };
  }

  try {
    const raw = localStorage.getItem(META_STORAGE_KEY);
    if (!raw) {
      return {
        enabled: false,
        folderName: '',
        lastSavedAt: null,
        status: 'idle',
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      enabled: false,
      folderName: '',
      lastSavedAt: null,
      status: 'idle',
    };
  }
}

// Update auto-backup metadata and notify listeners
export function setAutoBackupMeta(patch: Partial<AutoBackupMeta>): AutoBackupMeta {
  const current = getAutoBackupMeta();
  const updated: AutoBackupMeta = {
    ...current,
    ...patch,
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(META_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('dayplanner_autobackup_change', { detail: updated })
      );
    } catch (e) {
      console.error('Failed to save auto-backup metadata:', e);
    }
  }
  return updated;
}

// Check or request permission on the directory handle
export async function verifyDirectoryPermission(
  handle: FileSystemDirectoryHandle,
  promptUser: boolean = false
): Promise<boolean> {
  const descriptor = { mode: 'readwrite' as const };
  try {
    // Query existing permission status
    const status = await (handle as unknown as {
      queryPermission: (d: typeof descriptor) => Promise<PermissionState>;
    }).queryPermission(descriptor);

    if (status === 'granted') {
      return true;
    }

    if (promptUser && status === 'prompt') {
      const requestStatus = await (handle as unknown as {
        requestPermission: (d: typeof descriptor) => Promise<PermissionState>;
      }).requestPermission(descriptor);
      return requestStatus === 'granted';
    }

    return false;
  } catch (err) {
    console.warn('Permission query/request error:', err);
    return false;
  }
}

// Connect a new directory using the folder picker
export async function connectBackupDirectory(): Promise<{
  success: boolean;
  folderName?: string;
  error?: string;
}> {
  if (!isFileSystemAccessSupported()) {
    return {
      success: false,
      error: 'File System Access API is not supported in this browser.',
    };
  }

  try {
    const windowWithPicker = window as unknown as {
      showDirectoryPicker: (options?: { mode?: 'read' | 'readwrite' }) => Promise<FileSystemDirectoryHandle>;
    };

    const handle = await windowWithPicker.showDirectoryPicker({ mode: 'readwrite' });
    if (!handle) {
      return { success: false, error: 'No directory selected' };
    }

    // Verify readwrite permission
    const hasPermission = await verifyDirectoryPermission(handle, true);
    if (!hasPermission) {
      return { success: false, error: 'Write permission was not granted for the chosen directory.' };
    }

    // Save to IndexedDB
    await saveDirectoryHandle(handle);

    // Initial write
    const writeOk = await writeBackupToDirectory(handle);

    if (writeOk) {
      setAutoBackupMeta({
        enabled: true,
        folderName: handle.name,
        lastSavedAt: new Date().toISOString(),
        status: 'synced',
        errorMessage: undefined,
      });
      return { success: true, folderName: handle.name };
    } else {
      setAutoBackupMeta({
        enabled: true,
        folderName: handle.name,
        status: 'error',
        errorMessage: 'Failed to write initial backup file.',
      });
      return { success: false, error: 'Failed to write initial backup file.' };
    }
  } catch (err: unknown) {
    // If user cancelled the picker dialog
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Directory selection cancelled.' };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// Disconnect the backup directory
export async function disconnectBackupDirectory(): Promise<void> {
  await removeSavedDirectoryHandle();
  setAutoBackupMeta({
    enabled: false,
    folderName: '',
    lastSavedAt: null,
    status: 'idle',
    errorMessage: undefined,
  });
}

// Write the backup JSON to the directory handle
async function writeBackupToDirectory(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    const jsonContent = exportAllDataAsJSON();
    const fileHandle = await handle.getFileHandle(BACKUP_FILE_NAME, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(jsonContent);
    await writable.close();
    return true;
  } catch (err) {
    console.error('writeBackupToDirectory failed:', err);
    return false;
  }
}

// Perform an auto-backup cycle
export async function performAutoBackup(
  userInitiated: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const meta = getAutoBackupMeta();
  if (!meta.enabled) {
    return { success: false, error: 'Auto-backup is not enabled' };
  }

  const handle = await getSavedDirectoryHandle();
  if (!handle) {
    setAutoBackupMeta({
      status: 'error',
      errorMessage: 'Saved directory handle is no longer available. Please re-select the folder.',
    });
    return { success: false, error: 'Directory handle missing' };
  }

  const hasPermission = await verifyDirectoryPermission(handle, userInitiated);
  if (!hasPermission) {
    setAutoBackupMeta({
      status: 'needs_permission',
      errorMessage: `Permission required to write to folder "${meta.folderName}". Click Reconnect to authorize.`,
    });
    return { success: false, error: 'Permission required' };
  }

  setAutoBackupMeta({ status: 'saving' });

  const success = await writeBackupToDirectory(handle);
  if (success) {
    setAutoBackupMeta({
      status: 'synced',
      lastSavedAt: new Date().toISOString(),
      errorMessage: undefined,
    });
    return { success: true };
  } else {
    setAutoBackupMeta({
      status: 'error',
      errorMessage: 'Failed to write backup file to disk.',
    });
    return { success: false, error: 'Failed to write file' };
  }
}

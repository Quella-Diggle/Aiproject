import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '@shared/ipc';
import type {
  Note,
  NoteUpdatePayload,
  Settings
} from '@shared/types';

function readNoteIdFromUrl(): string | null {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('id');
  } catch {
    return null;
  }
}

const noteId = readNoteIdFromUrl();

const api = {
  noteId,
  getNoteId: (): Promise<string | null> =>
    ipcRenderer.invoke(IPC.windowGetNoteId),
  notes: {
    get: (id: string): Promise<Note | null> =>
      ipcRenderer.invoke(IPC.notesGet, id),
    update: (id: string, payload: NoteUpdatePayload): Promise<Note | null> =>
      ipcRenderer.invoke(IPC.notesUpdate, id, payload),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC.notesDelete, id),
    create: (type: import('@shared/types').NoteType): Promise<Note> =>
      ipcRenderer.invoke(IPC.notesCreate, type)
  },
  window: {
    openList: (): Promise<void> => ipcRenderer.invoke(IPC.windowOpenList),
    openNote: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC.windowOpenNote, id),
    hide: (): Promise<void> => ipcRenderer.invoke(IPC.windowHideNote),
    togglePin: (pinned: boolean): Promise<boolean> =>
      ipcRenderer.invoke(IPC.windowTogglePin, undefined, pinned),
    getPin: (): Promise<boolean> => ipcRenderer.invoke(IPC.windowGetPin),
    minimize: (): Promise<void> => ipcRenderer.invoke(IPC.windowMinimize)
  },
  settings: {
    get: (): Promise<Settings> => ipcRenderer.invoke(IPC.settingsGet)
  },
  on: {
    noteUpdated: (cb: (note: Note) => void) => {
      const listener = (_: unknown, n: Note) => cb(n);
      ipcRenderer.on(IPC.noteUpdated, listener);
      return () => ipcRenderer.off(IPC.noteUpdated, listener);
    },
    noteDeleted: (cb: (id: string) => void) => {
      const listener = (_: unknown, id: string) => cb(id);
      ipcRenderer.on(IPC.noteDeleted, listener);
      return () => ipcRenderer.off(IPC.noteDeleted, listener);
    },
    focusChange: (cb: (focused: boolean) => void) => {
      const listener = (_: unknown, focused: boolean) => cb(focused);
      ipcRenderer.on(IPC.noteFocusChange, listener);
      return () => ipcRenderer.off(IPC.noteFocusChange, listener);
    },
    themeChanged: (cb: (theme: Settings['theme']) => void) => {
      const listener = (_: unknown, t: Settings['theme']) => cb(t);
      ipcRenderer.on(IPC.themeChanged, listener);
      return () => ipcRenderer.off(IPC.themeChanged, listener);
    }
  }
};

contextBridge.exposeInMainWorld('noteApi', api);

export type NoteApi = typeof api;

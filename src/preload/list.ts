import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '@shared/ipc';
import type {
  Note,
  NoteMeta,
  NoteType,
  NoteUpdatePayload,
  Settings
} from '@shared/types';

const api = {
  notes: {
    list: (): Promise<NoteMeta[]> => ipcRenderer.invoke(IPC.notesList),
    create: (type: NoteType): Promise<Note> =>
      ipcRenderer.invoke(IPC.notesCreate, type),
    get: (id: string): Promise<Note | null> =>
      ipcRenderer.invoke(IPC.notesGet, id),
    update: (id: string, payload: NoteUpdatePayload): Promise<Note | null> =>
      ipcRenderer.invoke(IPC.notesUpdate, id, payload),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC.notesDelete, id)
  },
  settings: {
    get: (): Promise<Settings> => ipcRenderer.invoke(IPC.settingsGet),
    update: (patch: Partial<Settings>): Promise<Settings> =>
      ipcRenderer.invoke(IPC.settingsUpdate, patch)
  },
  window: {
    openNote: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC.windowOpenNote, id),
    hideList: (): Promise<void> => ipcRenderer.invoke(IPC.windowHideList),
    minimize: (): Promise<void> => ipcRenderer.invoke(IPC.windowMinimize)
  },
  app: {
    quit: (): Promise<void> => ipcRenderer.invoke(IPC.appQuit)
  },
  on: {
    noteUpdated: (cb: (note: Note) => void) => {
      const listener = (_: unknown, n: Note) => cb(n);
      ipcRenderer.on(IPC.noteUpdated, listener);
      return () => ipcRenderer.off(IPC.noteUpdated, listener);
    },
    noteCreated: (cb: (note: Note) => void) => {
      const listener = (_: unknown, n: Note) => cb(n);
      ipcRenderer.on(IPC.noteCreated, listener);
      return () => ipcRenderer.off(IPC.noteCreated, listener);
    },
    noteDeleted: (cb: (id: string) => void) => {
      const listener = (_: unknown, id: string) => cb(id);
      ipcRenderer.on(IPC.noteDeleted, listener);
      return () => ipcRenderer.off(IPC.noteDeleted, listener);
    },
    themeChanged: (cb: (theme: Settings['theme']) => void) => {
      const listener = (_: unknown, t: Settings['theme']) => cb(t);
      ipcRenderer.on(IPC.themeChanged, listener);
      return () => ipcRenderer.off(IPC.themeChanged, listener);
    }
  }
};

contextBridge.exposeInMainWorld('listApi', api);

export type ListApi = typeof api;

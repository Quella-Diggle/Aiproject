import { BrowserWindow, ipcMain } from 'electron';
import { IPC } from '@shared/ipc';
import { noteManager } from '../services/noteManager';
import type { NoteType, NoteUpdatePayload } from '@shared/types';
import { getNoteWindowMap } from '../windows/noteWindow';
import { getListWindow } from '../windows/listWindow';

function broadcast(channel: string, ...args: unknown[]): void {
  const list = getListWindow();
  if (list && !list.isDestroyed()) list.webContents.send(channel, ...args);
  for (const [, w] of getNoteWindowMap()) {
    if (!w.isDestroyed()) w.webContents.send(channel, ...args);
  }
}

export function registerNoteIpc(): void {
  ipcMain.handle(IPC.notesList, async () => {
    return noteManager.listMeta();
  });

  ipcMain.handle(IPC.notesGet, async (_e, id: string) => {
    return noteManager.getNote(id);
  });

  ipcMain.handle(IPC.notesCreate, async (_e, type: NoteType) => {
    const note = await noteManager.createNote(type);
    broadcast(IPC.noteCreated, note);
    return note;
  });

  ipcMain.handle(
    IPC.notesUpdate,
    async (e, id: string, payload: NoteUpdatePayload) => {
      const updated = await noteManager.updateNote(id, payload);
      if (updated) {
        const senderId = e.sender.id;
        const list = getListWindow();
        if (list && !list.isDestroyed() && list.webContents.id !== senderId) {
          list.webContents.send(IPC.noteUpdated, updated);
        }
        for (const [, w] of getNoteWindowMap()) {
          if (!w.isDestroyed() && w.webContents.id !== senderId) {
            w.webContents.send(IPC.noteUpdated, updated);
          }
        }
      }
      return updated;
    }
  );

  ipcMain.handle(IPC.notesDelete, async (_e, id: string) => {
    const result = await noteManager.deleteNote(id);
    if (result) {
      broadcast(IPC.noteDeleted, id);
      const w = getNoteWindowMap().get(id);
      if (w && !w.isDestroyed()) {
        w.destroy();
      }
      getNoteWindowMap().delete(id);
    }
    return result;
  });
}

void BrowserWindow;

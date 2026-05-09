import { app, BrowserWindow, ipcMain } from 'electron';
import { IPC } from '@shared/ipc';
import {
  showListWindow,
  hideListWindow
} from '../windows/listWindow';
import {
  openNoteWindow,
  hideNoteWindow,
  setNotePin,
  getNotePin,
  getNoteWindowMap
} from '../windows/noteWindow';

function getNoteIdFromWebContents(
  e: Electron.IpcMainInvokeEvent
): string | null {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win) return null;
  for (const [id, w] of getNoteWindowMap()) {
    if (w === win) return id;
  }
  return null;
}

export function registerWindowIpc(): void {
  ipcMain.handle(IPC.windowOpenList, async () => {
    showListWindow();
  });

  ipcMain.handle(IPC.windowOpenNote, async (_e, id: string) => {
    openNoteWindow(id);
  });

  ipcMain.handle(IPC.windowHideNote, async (e, idArg?: string) => {
    const id = idArg ?? getNoteIdFromWebContents(e);
    if (id) hideNoteWindow(id);
  });

  ipcMain.handle(IPC.windowHideList, async () => {
    hideListWindow();
  });

  ipcMain.handle(
    IPC.windowTogglePin,
    async (e, idArg: string | undefined, pinned: boolean) => {
      const id = idArg ?? getNoteIdFromWebContents(e);
      if (!id) return false;
      return setNotePin(id, pinned);
    }
  );

  ipcMain.handle(IPC.windowGetPin, async (e, idArg?: string) => {
    const id = idArg ?? getNoteIdFromWebContents(e);
    if (!id) return false;
    return getNotePin(id);
  });

  ipcMain.handle(IPC.windowGetNoteId, async (e) => {
    return getNoteIdFromWebContents(e);
  });

  ipcMain.handle(IPC.windowMinimize, async (e) => {
    const win = BrowserWindow.fromWebContents(e.sender);
    if (win && !win.isDestroyed()) win.minimize();
  });

  ipcMain.handle(IPC.appQuit, async () => {
    (globalThis as { __isQuitting?: boolean }).__isQuitting = true;
    app.quit();
  });
}

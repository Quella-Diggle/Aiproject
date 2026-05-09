import { BrowserWindow } from 'electron';
import path from 'node:path';
import { NOTE_WINDOW_SIZE } from '@shared/constants';
import { IPC } from '@shared/ipc';

const noteWindows = new Map<string, BrowserWindow>();

export function getNoteWindowMap(): Map<string, BrowserWindow> {
  return noteWindows;
}

export function getNoteWindow(noteId: string): BrowserWindow | undefined {
  return noteWindows.get(noteId);
}

export function openNoteWindow(noteId: string): BrowserWindow {
  const defaultWidth = NOTE_WINDOW_SIZE.width;
  const defaultHeight = NOTE_WINDOW_SIZE.height;
  const existing = noteWindows.get(noteId);
  if (existing && !existing.isDestroyed()) {
    const [w, h] = existing.getSize();
    const isLegacy400 = w >= 398 && w <= 402 && h >= 398 && h <= 402;
    const isLegacy267 = w >= 265 && w <= 269 && h >= 265 && h <= 269;
    if (isLegacy400 || isLegacy267) {
      existing.setSize(defaultWidth, defaultHeight);
    }
    if (existing.isMinimized()) existing.restore();
    existing.show();
    existing.focus();
    return existing;
  }

  const win = new BrowserWindow({
    width: defaultWidth,
    height: defaultHeight,
    minWidth: 180,
    minHeight: 180,
    frame: false,
    resizable: true,
    skipTaskbar: false,
    backgroundColor: '#ffffff',
    title: 'StickyNote',
    webPreferences: {
      preload: path.join(__dirname, '../preload/note.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      additionalArguments: [`--note-id=${noteId}`]
    },
    show: false
  });

  win.setSize(defaultWidth, defaultHeight);
  win.on('ready-to-show', () => {
    win.setSize(defaultWidth, defaultHeight);
    win.show();
  });

  win.on('focus', () => {
    if (!win.isDestroyed()) win.webContents.send(IPC.noteFocusChange, true);
  });
  win.on('blur', () => {
    if (!win.isDestroyed()) win.webContents.send(IPC.noteFocusChange, false);
  });

  win.on('close', (e) => {
    if (!(globalThis as { __isQuitting?: boolean }).__isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  win.on('closed', () => {
    noteWindows.delete(noteId);
  });

  const url = process.env.ELECTRON_RENDERER_URL
    ? `${process.env.ELECTRON_RENDERER_URL}/note/index.html?id=${encodeURIComponent(noteId)}`
    : null;

  if (url) {
    win.loadURL(url);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/note/index.html'), {
      query: { id: noteId }
    });
  }

  noteWindows.set(noteId, win);
  return win;
}

export function hideNoteWindow(noteId: string): void {
  const w = noteWindows.get(noteId);
  if (w && !w.isDestroyed()) w.hide();
}

export function destroyNoteWindow(noteId: string): void {
  const w = noteWindows.get(noteId);
  if (w && !w.isDestroyed()) {
    w.destroy();
  }
  noteWindows.delete(noteId);
}

export function destroyAllNoteWindows(): void {
  for (const [, w] of noteWindows) {
    if (!w.isDestroyed()) w.destroy();
  }
  noteWindows.clear();
}

export function setNotePin(noteId: string, pinned: boolean): boolean {
  const w = noteWindows.get(noteId);
  if (!w || w.isDestroyed()) return false;
  w.setAlwaysOnTop(pinned);
  return pinned;
}

export function getNotePin(noteId: string): boolean {
  const w = noteWindows.get(noteId);
  if (!w || w.isDestroyed()) return false;
  return w.isAlwaysOnTop();
}

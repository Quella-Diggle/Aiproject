import { BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { LIST_WINDOW_SIZE, APP_NAME } from '@shared/constants';

let listWindow: BrowserWindow | null = null;

export function getListWindow(): BrowserWindow | null {
  return listWindow;
}

export function createListWindow(): BrowserWindow {
  if (listWindow && !listWindow.isDestroyed()) {
    listWindow.show();
    listWindow.focus();
    return listWindow;
  }

  const win = new BrowserWindow({
    width: LIST_WINDOW_SIZE.width,
    height: LIST_WINDOW_SIZE.height,
    minWidth: 280,
    minHeight: 360,
    frame: false,
    resizable: true,
    skipTaskbar: false,
    title: APP_NAME,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, '../preload/list.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false
  });

  win.on('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  win.on('close', (e) => {
    if (!(globalThis as { __isQuitting?: boolean }).__isQuitting) {
      e.preventDefault();
      win.hide();
    }
  });

  win.on('closed', () => {
    if (listWindow === win) listWindow = null;
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}/list/index.html`);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/list/index.html'));
  }

  listWindow = win;
  return win;
}

export function showListWindow(): void {
  const win = listWindow ?? createListWindow();
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

export function hideListWindow(): void {
  if (listWindow && !listWindow.isDestroyed()) {
    listWindow.hide();
  }
}

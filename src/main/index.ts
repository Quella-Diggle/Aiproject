import { app, BrowserWindow } from 'electron';
import { noteManager } from './services/noteManager';
import { settingsManager } from './services/settingsManager';
import { syncAutoStart } from './services/autoLauncher';
import { registerNoteIpc } from './ipc/notes';
import { registerSettingsIpc } from './ipc/settings';
import { registerWindowIpc } from './ipc/window';
import {
  createListWindow,
  showListWindow
} from './windows/listWindow';
import { destroyAllNoteWindows } from './windows/noteWindow';

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

(globalThis as { __isQuitting?: boolean }).__isQuitting = false;

async function bootstrap(): Promise<void> {
  await noteManager.init();
  await settingsManager.init();
  await syncAutoStart(settingsManager.get().autoStart).catch((err) => {
    console.error('[main] autostart sync failed:', err);
  });

  registerNoteIpc();
  registerSettingsIpc();
  registerWindowIpc();

  createListWindow();
}

app.on('second-instance', () => {
  showListWindow();
});

app.whenReady().then(() => {
  bootstrap().catch((err) => {
    console.error('[main] bootstrap failed:', err);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      showListWindow();
    } else {
      showListWindow();
    }
  });
});

app.on('before-quit', () => {
  (globalThis as { __isQuitting?: boolean }).__isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    destroyAllNoteWindows();
    app.quit();
  }
});

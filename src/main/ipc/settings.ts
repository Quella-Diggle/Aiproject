import { ipcMain } from 'electron';
import { IPC } from '@shared/ipc';
import { settingsManager } from '../services/settingsManager';
import { syncAutoStart } from '../services/autoLauncher';
import { getListWindow } from '../windows/listWindow';
import { getNoteWindowMap } from '../windows/noteWindow';
import type { Settings } from '@shared/types';

function broadcastTheme(theme: Settings['theme']): void {
  const list = getListWindow();
  if (list && !list.isDestroyed()) {
    list.webContents.send(IPC.themeChanged, theme);
  }
  for (const [, w] of getNoteWindowMap()) {
    if (!w.isDestroyed()) w.webContents.send(IPC.themeChanged, theme);
  }
}

export function registerSettingsIpc(): void {
  ipcMain.handle(IPC.settingsGet, async () => settingsManager.get());

  ipcMain.handle(
    IPC.settingsUpdate,
    async (_e, patch: Partial<Settings>) => {
      const before = settingsManager.get();
      const next = await settingsManager.update(patch);
      if (
        typeof patch.autoStart === 'boolean' &&
        patch.autoStart !== before.autoStart
      ) {
        await syncAutoStart(patch.autoStart);
      }
      if (patch.theme && patch.theme !== before.theme) {
        broadcastTheme(next.theme);
      }
      return next;
    }
  );
}

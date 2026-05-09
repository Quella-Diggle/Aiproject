import { getSettingsFilePath } from '../paths';
import { readJson, writeJsonAtomic } from './storage';
import type { Settings } from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/constants';

export class SettingsManager {
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    const data = await readJson<Settings>(getSettingsFilePath());
    if (data) {
      this.settings = { ...DEFAULT_SETTINGS, ...data };
    } else {
      await writeJsonAtomic(getSettingsFilePath(), this.settings);
    }
    this.initialized = true;
  }

  get(): Settings {
    return { ...this.settings };
  }

  async update(patch: Partial<Settings>): Promise<Settings> {
    this.settings = { ...this.settings, ...patch };
    await writeJsonAtomic(getSettingsFilePath(), this.settings);
    return { ...this.settings };
  }
}

export const settingsManager = new SettingsManager();

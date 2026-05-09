import { app } from 'electron';
import path from 'node:path';
import { APP_NAME } from '@shared/constants';

export function getDataRoot(): string {
  const userData = app.getPath('userData');
  return userData;
}

export function getNotesDir(): string {
  return path.join(getDataRoot(), 'notes');
}

export function getIndexFilePath(): string {
  return path.join(getDataRoot(), 'index.json');
}

export function getSettingsFilePath(): string {
  return path.join(getDataRoot(), 'settings.json');
}

export function getNoteFilePath(noteId: string): string {
  return path.join(getNotesDir(), `${noteId}.json`);
}

export function getRelativeNotePath(noteId: string): string {
  return `notes/${noteId}.json`;
}

export function getAppName(): string {
  return APP_NAME;
}

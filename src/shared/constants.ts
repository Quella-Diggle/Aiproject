import type { NoteType, Settings } from './types';

export const NOTE_TYPES: NoteType[] = ['annual', 'weekly', 'daily', 'temp'];

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  annual: '年度',
  weekly: '周',
  daily: '日',
  temp: '临时'
};

export const NOTE_TYPE_COLORS: Record<NoteType, string> = {
  annual: '#fde2e4',
  weekly: '#fff1c1',
  daily: '#cfe8ff',
  temp: '#e5e5e5'
};

export const NOTE_TYPE_ORDER: Record<NoteType, number> = {
  annual: 0,
  weekly: 1,
  daily: 2,
  temp: 3
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  autoStart: false
};

export const LIST_WINDOW_SIZE = { width: 360, height: 600 };
export const NOTE_WINDOW_SIZE = { width: 267, height: 350 };

export const APP_NAME = 'StickyNotes';

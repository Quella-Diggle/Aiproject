export type NoteType = 'annual' | 'weekly' | 'daily' | 'temp';

export type Theme = 'light' | 'dark';

export interface NoteMeta {
  id: string;
  type: NoteType;
  title: string;
  createdAt: string;
  updatedAt: string;
  filePath: string;
}

export type ReminderType =
  | 'days_before'
  | 'repeat_interval'
  | 'daily_until_deadline';

export interface Reminder {
  type: ReminderType;
  value?: number;
  startDate?: string;
  endDate?: string;
  times: string[];
}

export interface EventItem {
  id: string;
  content: string;
  completed: boolean;
  completedAt: string | null;
  deadline: string | null;
  reminders: Reminder[];
  parentEventId: string | null;
  indentLevel: 0 | 1;
}

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  color: string;
  events: EventItem[];
  createdAt: string;
  updatedAt: string;
}

export interface IndexFile {
  notes: NoteMeta[];
}

export interface Settings {
  theme: Theme;
  autoStart: boolean;
}

export type NoteUpdatePayload = Partial<
  Pick<Note, 'title' | 'type' | 'color' | 'events'>
>;

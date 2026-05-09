import { nanoid } from 'nanoid';
import {
  getIndexFilePath,
  getNoteFilePath,
  getNotesDir,
  getRelativeNotePath
} from '../paths';
import {
  ensureDir,
  readJson,
  writeJsonAtomic,
  deleteFile
} from './storage';
import type {
  IndexFile,
  EventItem,
  Note,
  NoteMeta,
  NoteType,
  NoteUpdatePayload
} from '@shared/types';
import { NOTE_TYPE_COLORS } from '@shared/constants';

function nowIso(): string {
  return new Date().toISOString();
}

function shortId(): string {
  return nanoid(10);
}

function normalizeEvent(raw: unknown): EventItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Partial<EventItem> & {
    indent?: number;
    text?: string;
  };
  const id = typeof obj.id === 'string' && obj.id ? obj.id : shortId();
  const content =
    typeof obj.content === 'string'
      ? obj.content
      : typeof obj.text === 'string'
        ? obj.text
        : '';
  return {
    id,
    content,
    completed: !!obj.completed,
    completedAt:
      typeof obj.completedAt === 'string' ? obj.completedAt : null,
    deadline: typeof obj.deadline === 'string' ? obj.deadline : null,
    reminders: Array.isArray(obj.reminders) ? obj.reminders : [],
    parentEventId:
      typeof obj.parentEventId === 'string' ? obj.parentEventId : null,
    indentLevel: obj.indentLevel === 1 || obj.indent === 1 ? 1 : 0
  };
}

function normalizeNote(raw: unknown, id: string, meta: NoteMeta): Note {
  const obj = raw && typeof raw === 'object' ? (raw as Partial<Note>) : {};
  const events: EventItem[] = [];
  if (Array.isArray((obj as { events?: unknown[] }).events)) {
    for (const item of (obj as { events: unknown[] }).events) {
      const normalized = normalizeEvent(item);
      if (normalized) events.push(normalized);
    }
  } else if (typeof (obj as { content?: unknown }).content === 'string') {
    const legacyContent = (obj as { content: string }).content.trim();
    if (legacyContent) {
      events.push({
        id: shortId(),
        content: legacyContent,
        completed: false,
        completedAt: null,
        deadline: null,
        reminders: [],
        parentEventId: null,
        indentLevel: 0
      });
    }
  }
  return {
    id,
    type:
      obj.type === 'annual' ||
      obj.type === 'weekly' ||
      obj.type === 'daily' ||
      obj.type === 'temp'
        ? obj.type
        : meta.type,
    title: typeof obj.title === 'string' ? obj.title : meta.title,
    color:
      typeof obj.color === 'string' && obj.color
        ? obj.color
        : NOTE_TYPE_COLORS[
            obj.type === 'annual' ||
            obj.type === 'weekly' ||
            obj.type === 'daily' ||
            obj.type === 'temp'
              ? obj.type
              : meta.type
          ],
    events,
    createdAt:
      typeof obj.createdAt === 'string' ? obj.createdAt : meta.createdAt,
    updatedAt:
      typeof obj.updatedAt === 'string' ? obj.updatedAt : meta.updatedAt
  };
}

export class NoteManager {
  private index: IndexFile = { notes: [] };
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;
    await ensureDir(getNotesDir());
    const data = await readJson<IndexFile>(getIndexFilePath());
    if (data && Array.isArray(data.notes)) {
      this.index = data;
    } else {
      this.index = { notes: [] };
      await this.saveIndex();
    }
    this.initialized = true;
  }

  private async saveIndex(): Promise<void> {
    await writeJsonAtomic(getIndexFilePath(), this.index);
  }

  listMeta(): NoteMeta[] {
    return [...this.index.notes];
  }

  hasNote(id: string): boolean {
    return this.index.notes.some((n) => n.id === id);
  }

  async getNote(id: string): Promise<Note | null> {
    const meta = this.index.notes.find((n) => n.id === id);
    if (!meta) return null;
    const note = await readJson<unknown>(getNoteFilePath(id));
    if (!note) return null;
    return normalizeNote(note, id, meta);
  }

  async createNote(type: NoteType): Promise<Note> {
    const id = shortId();
    const now = nowIso();
    const note: Note = {
      id,
      type,
      title: '',
      color: NOTE_TYPE_COLORS[type],
      events: [],
      createdAt: now,
      updatedAt: now
    };
    const meta: NoteMeta = {
      id,
      type,
      title: note.title,
      createdAt: now,
      updatedAt: now,
      filePath: getRelativeNotePath(id)
    };
    await writeJsonAtomic(getNoteFilePath(id), note);
    this.index.notes.push(meta);
    await this.saveIndex();
    return note;
  }

  async updateNote(
    id: string,
    payload: NoteUpdatePayload
  ): Promise<Note | null> {
    const meta = this.index.notes.find((n) => n.id === id);
    if (!meta) return null;
    const existing = await readJson<Note>(getNoteFilePath(id));
    if (!existing) return null;

    const updated: Note = {
      ...existing,
      ...payload,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: nowIso()
    };

    if (payload.type && !payload.color) {
      updated.color = NOTE_TYPE_COLORS[payload.type];
    }

    await writeJsonAtomic(getNoteFilePath(id), updated);

    meta.title = updated.title;
    meta.type = updated.type;
    meta.updatedAt = updated.updatedAt;
    await this.saveIndex();

    return updated;
  }

  async deleteNote(id: string): Promise<boolean> {
    const idx = this.index.notes.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    this.index.notes.splice(idx, 1);
    await this.saveIndex();
    await deleteFile(getNoteFilePath(id));
    return true;
  }
}

export const noteManager = new NoteManager();

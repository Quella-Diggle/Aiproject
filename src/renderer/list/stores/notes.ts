import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Note, NoteMeta, NoteType, Settings } from '@shared/types';
import { NOTE_TYPE_ORDER } from '@shared/constants';

export const useNotesStore = defineStore('notes', () => {
  const metas = ref<NoteMeta[]>([]);
  const previews = ref<Record<string, string>>({});
  const search = ref('');
  const settings = ref<Settings>({ theme: 'light', autoStart: false });

  const filteredGrouped = computed(() => {
    const q = search.value.trim().toLowerCase();
    const arr = metas.value.filter((m) => {
      if (!q) return true;
      if (m.title.toLowerCase().includes(q)) return true;
      const preview = previews.value[m.id]?.toLowerCase() ?? '';
      return preview.includes(q);
    });
    arr.sort((a, b) => {
      const oa = NOTE_TYPE_ORDER[a.type];
      const ob = NOTE_TYPE_ORDER[b.type];
      if (oa !== ob) return oa - ob;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return arr;
  });

  function noteTextPreview(note: Note): string {
    const tmp = document.createElement('div');
    const html = note.events.map((e) => e.content).join(' ');
    tmp.innerHTML = html;
    return (tmp.textContent || '').replace(/\s+/g, ' ').trim();
  }

  async function reload(): Promise<void> {
    metas.value = await window.listApi.notes.list();
    const result: Record<string, string> = {};
    for (const m of metas.value) {
      const note = await window.listApi.notes.get(m.id);
      if (note) result[m.id] = noteTextPreview(note);
    }
    previews.value = result;
  }

  async function createNote(type: NoteType): Promise<Note> {
    const note = await window.listApi.notes.create(type);
    return note;
  }

  async function deleteNote(id: string): Promise<void> {
    await window.listApi.notes.delete(id);
  }

  async function loadSettings(): Promise<void> {
    settings.value = await window.listApi.settings.get();
  }

  async function updateSettings(patch: Partial<Settings>): Promise<void> {
    settings.value = await window.listApi.settings.update(patch);
  }

  function applyNoteUpdated(n: Note): void {
    const m = metas.value.find((x) => x.id === n.id);
    if (m) {
      m.title = n.title;
      m.type = n.type;
      m.updatedAt = n.updatedAt;
    }
    previews.value[n.id] = noteTextPreview(n);
  }

  function applyNoteCreated(n: Note): void {
    if (metas.value.find((x) => x.id === n.id)) return;
    metas.value.push({
      id: n.id,
      type: n.type,
      title: n.title,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      filePath: `notes/${n.id}.json`
    });
    previews.value[n.id] = noteTextPreview(n);
  }

  function applyNoteDeleted(id: string): void {
    metas.value = metas.value.filter((m) => m.id !== id);
    delete previews.value[id];
  }

  return {
    metas,
    previews,
    search,
    settings,
    filteredGrouped,
    reload,
    createNote,
    deleteNote,
    loadSettings,
    updateSettings,
    applyNoteUpdated,
    applyNoteCreated,
    applyNoteDeleted
  };
});

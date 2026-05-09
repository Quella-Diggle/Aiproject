import { defineStore } from 'pinia';
import { computed, ref, toRaw } from 'vue';
import type { EventItem, Note, NoteType, Theme } from '@shared/types';
import { NOTE_TYPE_COLORS } from '@shared/constants';

export const useNoteStore = defineStore('note', () => {
  const note = ref<Note | null>(null);
  const loaded = ref<boolean>(false);
  const focused = ref<boolean>(true);
  const pinned = ref<boolean>(false);
  const theme = ref<Theme>('light');

  const noteId = computed(() => note.value?.id ?? null);
  const color = computed<string>(() => {
    if (!note.value) return NOTE_TYPE_COLORS.temp;
    return note.value.color || NOTE_TYPE_COLORS[note.value.type];
  });

  function serializeEvents(events: EventItem[]): EventItem[] {
    return toRaw(events).map((evt) => ({
      id: evt.id,
      content: evt.content,
      completed: evt.completed,
      completedAt: evt.completedAt,
      deadline: evt.deadline,
      reminders: (evt.reminders ?? []).map((r) => ({
        type: r.type,
        value: r.value,
        startDate: r.startDate,
        endDate: r.endDate,
        times: [...(r.times ?? [])]
      })),
      parentEventId: evt.parentEventId,
      indentLevel: evt.indentLevel
    }));
  }

  async function load(id: string): Promise<void> {
    loaded.value = false;
    const data = await window.noteApi.notes.get(id);
    note.value = data;
    pinned.value = await window.noteApi.window.getPin();
    loaded.value = true;
  }

  async function save(): Promise<void> {
    if (!note.value) return;
    await window.noteApi.notes.update(note.value.id, {
      title: note.value.title,
      type: note.value.type,
      color: note.value.color,
      events: serializeEvents(note.value.events)
    });
  }

  async function changeType(type: NoteType): Promise<void> {
    if (!note.value) return;
    note.value.type = type;
    note.value.color = NOTE_TYPE_COLORS[type];
    await save();
  }

  async function changeTitle(title: string): Promise<void> {
    if (!note.value) return;
    note.value.title = title;
    await save();
  }

  async function setEvents(events: EventItem[]): Promise<void> {
    if (!note.value) return;
    note.value.events = events;
    await save();
  }

  async function togglePin(): Promise<void> {
    pinned.value = await window.noteApi.window.togglePin(!pinned.value);
  }

  async function loadTheme(): Promise<void> {
    const s = await window.noteApi.settings.get();
    theme.value = s.theme;
    document.body.dataset.theme = s.theme;
  }

  function applyExternalUpdate(n: Note): void {
    if (note.value && n.id === note.value.id) {
      note.value = n;
    }
  }

  return {
    note,
    loaded,
    focused,
    pinned,
    theme,
    noteId,
    color,
    load,
    save,
    changeType,
    changeTitle,
    setEvents,
    togglePin,
    loadTheme,
    applyExternalUpdate
  };
});

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch
} from 'vue';
import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  darkTheme,
  lightTheme,
  zhCN,
  dateZhCN
} from 'naive-ui';
import type { Editor } from '@tiptap/vue-3';
import NoteTopBar from './components/NoteTopBar.vue';
import NoteBottomBar from './components/NoteBottomBar.vue';
import EventEditor from './components/EventEditor.vue';
import { useNoteStore } from './stores/note';
import type { EventItem } from '@shared/types';

const store = useNoteStore();
const focused = ref(true);
const editor = shallowRef<Editor | null>(null);
const cleanups: Array<() => void> = [];

const themeMode = computed(() =>
  store.theme === 'dark' ? darkTheme : lightTheme
);

const noteBg = computed(() => store.color);

const barsVisible = computed(() => focused.value);
const editingTitle = ref(false);
const titleDraft = ref('');
const titleInputRef = ref<HTMLInputElement | null>(null);
const titleRaw = computed(() => (store.note?.title ?? '').trim());
const titleDisplay = computed(() => {
  if (titleRaw.value) return titleRaw.value;
  return focused.value ? '（点击编辑标题）' : '';
});

function readNoteId(): string | null {
  try {
    const url = new URL(window.location.href);
    return url.searchParams.get('id');
  } catch {
    return null;
  }
}

async function bootstrap(): Promise<void> {
  await store.loadTheme();
  const id = readNoteId() ?? (await window.noteApi.getNoteId());
  if (!id) return;
  await store.load(id);

  cleanups.push(
    window.noteApi.on.noteUpdated((n) => store.applyExternalUpdate(n))
  );
  cleanups.push(
    window.noteApi.on.noteDeleted(async (deletedId) => {
      if (deletedId === store.noteId) {
        await window.noteApi.window.hide();
      }
    })
  );
  cleanups.push(
    window.noteApi.on.focusChange((f) => {
      focused.value = f;
    })
  );
  cleanups.push(
    window.noteApi.on.themeChanged((t) => {
      store.theme = t;
      document.body.dataset.theme = t;
    })
  );
}

function handleEditorReady(ed: Editor): void {
  editor.value = ed;
}

async function handleEventsChange(events: EventItem[]): Promise<void> {
  await store.setEvents(events);
}

async function startEditTitle(): Promise<void> {
  if (!store.note) return;
  titleDraft.value = store.note.title;
  editingTitle.value = true;
  await nextTick();
  titleInputRef.value?.focus();
  titleInputRef.value?.select();
}

async function commitEditTitle(): Promise<void> {
  if (!editingTitle.value) return;
  editingTitle.value = false;
  const next = titleDraft.value.trim();
  if (store.note && next !== store.note.title.trim()) {
    await store.changeTitle(next);
  }
}

function cancelEditTitle(): void {
  editingTitle.value = false;
}

onMounted(() => {
  void bootstrap();
});

onBeforeUnmount(() => {
  for (const c of cleanups) c();
});

watch(
  () => store.note?.id,
  () => {
    editingTitle.value = false;
  }
);
</script>

<template>
  <NConfigProvider :theme="themeMode" :locale="zhCN" :date-locale="dateZhCN">
    <NMessageProvider>
      <NDialogProvider>
        <div
          class="note-root"
          :class="{ 'window-blur': !focused }"
          :style="{ '--note-bg': noteBg, background: noteBg }"
        >
          <NoteTopBar :visible="barsVisible" />
          <div class="content-area">
            <template v-if="store.note">
              <div class="title-row">
                <div
                  v-if="!editingTitle"
                  class="title-text"
                  title="点击编辑标题"
                  @click="startEditTitle"
                >
                  {{ titleDisplay }}
                </div>
                <input
                  v-else
                  ref="titleInputRef"
                  v-model="titleDraft"
                  class="title-input"
                  @blur="commitEditTitle"
                  @keydown.enter.prevent="commitEditTitle"
                  @keydown.esc.prevent="cancelEditTitle"
                />
              </div>
              <EventEditor
                :note="store.note"
                @change="handleEventsChange"
                @editor-ready="handleEditorReady"
              />
            </template>
            <div v-else class="loading">
              {{ store.loaded ? '便笺不存在或已损坏' : '加载中...' }}
            </div>
          </div>
          <NoteBottomBar :visible="barsVisible" :editor="editor" />
        </div>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>
.note-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  min-height: 0;
}

.content-area {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.title-row {
  height: 32px;
  display: flex;
  align-items: center;
  padding: 0 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  -webkit-app-region: drag;
}

.title-text {
  width: 100%;
  color: rgba(0, 0, 0, 0.72);
  font-size: 13px;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: text;
  -webkit-app-region: no-drag;
}

.title-text:empty::before {
  content: '';
}

.title-input {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.18);
  border-radius: 4px;
  padding: 3px 6px;
  outline: none;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.65);
  -webkit-app-region: no-drag;
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.5);
}

:deep(.n-config-provider),
:deep(.n-message-provider),
:deep(.n-dialog-provider) {
  height: 100%;
}
</style>

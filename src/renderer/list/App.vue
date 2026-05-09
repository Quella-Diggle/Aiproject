<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  NConfigProvider,
  NDialogProvider,
  NMessageProvider,
  darkTheme,
  lightTheme,
  zhCN,
  dateZhCN
} from 'naive-ui';
import TopBar from './components/TopBar.vue';
import SearchBox from './components/SearchBox.vue';
import NoteCard from './components/NoteCard.vue';
import { useNotesStore } from './stores/notes';
import { NOTE_TYPE_LABELS } from '@shared/constants';
import type { NoteMeta, NoteType } from '@shared/types';

const store = useNotesStore();
const themeMode = computed(() =>
  store.settings.theme === 'dark' ? darkTheme : lightTheme
);

const cleanups: Array<() => void> = [];

onMounted(async () => {
  await store.loadSettings();
  document.body.dataset.theme = store.settings.theme;
  await store.reload();

  cleanups.push(
    window.listApi.on.noteUpdated((n) => store.applyNoteUpdated(n))
  );
  cleanups.push(
    window.listApi.on.noteCreated((n) => store.applyNoteCreated(n))
  );
  cleanups.push(
    window.listApi.on.noteDeleted((id) => store.applyNoteDeleted(id))
  );
  cleanups.push(
    window.listApi.on.themeChanged((t) => {
      store.settings.theme = t;
      document.body.dataset.theme = t;
    })
  );
});

onBeforeUnmount(() => {
  for (const c of cleanups) c();
});

const groupedByType = computed(() => {
  const map = new Map<NoteType, NoteMeta[]>();
  for (const m of store.filteredGrouped) {
    const arr = map.get(m.type) ?? [];
    arr.push(m);
    map.set(m.type, arr);
  }
  return Array.from(map.entries());
});

const totalCount = computed(() => store.metas.length);

const containerRef = ref<HTMLElement | null>(null);
</script>

<template>
  <NConfigProvider :theme="themeMode" :locale="zhCN" :date-locale="dateZhCN">
    <NMessageProvider>
      <NDialogProvider>
        <div class="list-root" ref="containerRef">
          <TopBar />
          <SearchBox />
          <div class="list-body">
            <div v-if="totalCount === 0" class="empty">
              暂无便笺，点击 + 新建一条
            </div>
            <div v-else-if="store.filteredGrouped.length === 0" class="empty">
              没有匹配的便笺
            </div>
            <template v-else>
              <div
                v-for="[type, list] in groupedByType"
                :key="type"
                class="group"
              >
                <div class="group-title">
                  {{ NOTE_TYPE_LABELS[type as keyof typeof NOTE_TYPE_LABELS] }}
                  <span class="group-count">{{ list.length }}</span>
                </div>
                <NoteCard
                  v-for="meta in list"
                  :key="meta.id"
                  :meta="meta"
                  :preview="store.previews[meta.id] ?? ''"
                />
              </div>
            </template>
          </div>
        </div>
      </NDialogProvider>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>
.list-root {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--bg);
  color: var(--fg);
}

.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px 12px;
  user-select: none;
}

.group {
  margin-top: 8px;
}

.group-title {
  font-size: 12px;
  color: #888;
  margin: 6px 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.group-count {
  font-size: 11px;
  color: #aaa;
}

.empty {
  padding: 40px 12px;
  text-align: center;
  color: #999;
  font-size: 13px;
}
</style>

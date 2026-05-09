<script setup lang="ts">
import { computed, ref } from 'vue';
import { NDropdown, useDialog, useMessage } from 'naive-ui';
import { NOTE_TYPE_COLORS, NOTE_TYPE_LABELS } from '@shared/constants';
import type { NoteMeta } from '@shared/types';
import { useNotesStore } from '../stores/notes';

const props = defineProps<{
  meta: NoteMeta;
  preview: string;
}>();

const store = useNotesStore();
const dialog = useDialog();
const message = useMessage();

const bg = computed(() => NOTE_TYPE_COLORS[props.meta.type]);
const previewShort = computed(() => {
  const s = props.preview ?? '';
  return s.length > 50 ? s.slice(0, 50) + '…' : s;
});
const titleDisplay = computed(() => props.meta.title.trim() || '（无标题）');

async function open(): Promise<void> {
  await window.listApi.window.openNote(props.meta.id);
}

function confirmDelete(): void {
  const hasContent =
    !!props.meta.title.trim() || (props.preview ?? '').trim().length > 0;
  if (!hasContent) {
    void doDelete();
    return;
  }
  dialog.warning({
    title: '删除便笺',
    content: `确定要删除"${titleDisplay.value}"？此操作不可撤销。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => doDelete()
  });
}

async function doDelete(): Promise<void> {
  await store.deleteNote(props.meta.id);
  message.success('已删除');
}

const ctxOptions = [
  { label: '打开', key: 'open' },
  { label: '删除', key: 'delete' }
];

function onContextSelect(key: string): void {
  if (key === 'open') void open();
  else if (key === 'delete') confirmDelete();
}

const showCtx = ref(false);
const ctxX = ref(0);
const ctxY = ref(0);

function handleContextMenu(e: MouseEvent): void {
  e.preventDefault();
  ctxX.value = e.clientX;
  ctxY.value = e.clientY;
  showCtx.value = true;
}
</script>

<template>
  <div
    class="note-card"
    :style="{ background: bg }"
    @dblclick="open"
    @contextmenu="handleContextMenu"
  >
    <div class="card-row">
      <div class="title">{{ titleDisplay }}</div>
      <button
        class="close-x"
        title="删除"
        @click.stop="confirmDelete"
      >
        ×
      </button>
    </div>
    <div class="preview" v-if="previewShort">{{ previewShort }}</div>
    <div class="preview empty" v-else>（空便笺）</div>
    <NDropdown
      :options="ctxOptions"
      :show="showCtx"
      :x="ctxX"
      :y="ctxY"
      @clickoutside="showCtx = false"
      @select="(k) => { showCtx = false; onContextSelect(k as string); }"
      placement="bottom-start"
    />
  </div>
</template>

<style scoped>
.note-card {
  position: relative;
  border-radius: 6px;
  padding: 8px 10px;
  margin: 4px 0;
  border: 1px solid var(--card-border, rgba(0, 0, 0, 0.06));
  cursor: pointer;
  transition: transform 0.08s, box-shadow 0.08s;
  color: #222;
}

.note-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.card-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.title {
  font-weight: 600;
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-x {
  background: transparent;
  border: none;
  cursor: pointer;
  width: 18px;
  height: 18px;
  border-radius: 9px;
  font-size: 14px;
  line-height: 1;
  color: rgba(0, 0, 0, 0.5);
  flex-shrink: 0;
}

.close-x:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #c00;
}

.preview {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preview.empty {
  color: rgba(0, 0, 0, 0.35);
  font-style: italic;
}
</style>

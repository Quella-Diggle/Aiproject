<script setup lang="ts">
import { computed } from 'vue';
import { NDropdown, useDialog, useMessage } from 'naive-ui';
import { useNoteStore } from '../stores/note';

const props = defineProps<{
  visible: boolean;
}>();

const store = useNoteStore();
const dialog = useDialog();
const message = useMessage();

async function handleNew(): Promise<void> {
  if (!store.note) return;
  const next = await window.noteApi.notes.create(store.note.type);
  await window.noteApi.window.openNote(next.id);
}

async function handleClose(): Promise<void> {
  await window.noteApi.window.hide();
}

async function handlePin(): Promise<void> {
  await store.togglePin();
}

const moreOptions = computed(() => [
  { label: '打开便笺列表', key: 'list' },
  { label: '删除当前便笺', key: 'delete' },
  { type: 'divider', key: 'd1' },
  { label: '导出 JSON（开发中）', key: 'exportJson', disabled: true }
]);

async function onMoreSelect(key: string): Promise<void> {
  if (key === 'list') {
    await window.noteApi.window.openList();
  } else if (key === 'delete') {
    if (!store.note) return;
    const id = store.note.id;
    dialog.warning({
      title: '删除便笺',
      content: '确定要删除此便笺？此操作不可撤销。',
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        await window.noteApi.notes.delete(id);
        message.success('已删除');
      }
    });
  }
}

</script>

<template>
  <div class="top-bar" :class="{ visible }">
    <div class="left no-drag">
      <button class="icon-btn" title="新建便笺" @click="handleNew">+</button>
      <NDropdown
        :options="moreOptions as any"
        trigger="click"
        placement="bottom-start"
        @select="onMoreSelect"
      >
        <button class="icon-btn" title="更多">⋯</button>
      </NDropdown>
    </div>
    <div class="middle drag-area" />
    <div class="right no-drag">
      <button
        class="icon-btn pin"
        :class="{ active: store.pinned }"
        title="置顶"
        @click="handlePin"
      >
        📌
      </button>
      <button class="icon-btn close-btn" title="隐藏" @click="handleClose">
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  height: 30px;
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(2px);
  transition: opacity 0.16s ease, transform 0.16s ease;
  opacity: 0;
  transform: translateY(-4px);
  pointer-events: none;
  position: relative;
  z-index: 5;
}

.top-bar.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.left,
.right {
  display: flex;
  align-items: center;
  -webkit-app-region: no-drag;
}

.middle {
  flex: 1;
  height: 100%;
  -webkit-app-region: drag;
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  width: 28px;
  height: 30px;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.icon-btn.pin.active {
  background: rgba(0, 0, 0, 0.12);
}

.close-btn:hover {
  background: #e81123;
  color: #fff;
}
</style>

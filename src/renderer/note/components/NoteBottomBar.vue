<script setup lang="ts">
import { computed } from 'vue';
import { NPopover } from 'naive-ui';
import type { Editor } from '@tiptap/vue-3';
import { useNoteStore } from '../stores/note';
import {
  NOTE_TYPES,
  NOTE_TYPE_COLORS,
  NOTE_TYPE_LABELS
} from '@shared/constants';
import type { NoteType } from '@shared/types';

const props = defineProps<{
  visible: boolean;
  editor: Editor | null;
}>();

const store = useNoteStore();

const currentColor = computed(() => store.color);

async function pickType(t: NoteType): Promise<void> {
  await store.changeType(t);
}

function toggleBold(): void {
  if (!props.editor) return;
  props.editor.chain().focus().toggleBold().run();
}

function applyBullet(): void {
  if (!props.editor) return;
  const { state, view } = props.editor;
  const { $from } = state.selection;
  for (let depth = $from.depth; depth >= 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === 'eventNode') {
      const startPos = $from.start(depth);
      const text = node.textContent;
      if (text.trimStart().startsWith('· ')) return;
      const tr = state.tr.insertText('· ', startPos);
      view.dispatch(tr);
      return;
    }
  }
}

function applyNumber(): void {
  if (!props.editor) return;
  const { state, view } = props.editor;
  const doc = state.doc;
  const { $from } = state.selection;

  let currentNodePos = -1;
  let currentIndex = -1;
  let depthFound = -1;
  for (let depth = $from.depth; depth >= 0; depth--) {
    const n = $from.node(depth);
    if (n.type.name === 'eventNode') {
      currentNodePos = $from.before(depth);
      depthFound = depth;
      break;
    }
  }
  if (currentNodePos === -1 || depthFound === -1) return;

  let counter = 0;
  let found = false;
  doc.descendants((node, pos) => {
    if (node.type.name !== 'eventNode') return true;
    if (pos === currentNodePos) {
      found = true;
      currentIndex = counter;
      return false;
    }
    const text = node.textContent.trimStart();
    if (/^\d+\.\s/.test(text)) counter++;
    return true;
  });
  void found;
  void currentIndex;

  const startPos = $from.start(depthFound);
  const node = $from.node(depthFound);
  const text = node.textContent.trimStart();
  if (/^\d+\.\s/.test(text)) return;

  const seq = counter + 1;
  const tr = state.tr.insertText(`${seq}. `, startPos);
  view.dispatch(tr);
}

const typeOptions = NOTE_TYPES;
</script>

<template>
  <div class="bottom-bar" :class="{ visible }">
    <NPopover trigger="click" placement="top-start">
      <template #trigger>
        <button
          class="type-circle"
          :style="{ background: currentColor }"
          title="切换类型"
        />
      </template>
      <div class="type-picker">
        <button
          v-for="t in typeOptions"
          :key="t"
          class="type-item"
          @click="pickType(t)"
        >
          <span
            class="dot"
            :style="{ background: NOTE_TYPE_COLORS[t] }"
          />
          {{ NOTE_TYPE_LABELS[t] }}
        </button>
      </div>
    </NPopover>

    <button class="bar-btn bold-btn" title="加粗（B）" @click="toggleBold">
      <strong>B</strong>
    </button>
    <button class="bar-btn" title="项目符号" @click="applyBullet">·</button>
    <button class="bar-btn" title="编号" @click="applyNumber">123</button>
    <div class="spacer" />
  </div>
</template>

<style scoped>
.bottom-bar {
  height: 32px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 6px;
  background: rgba(0, 0, 0, 0.05);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  transition: opacity 0.16s ease, transform 0.16s ease;
  opacity: 0;
  transform: translateY(4px);
  pointer-events: none;
}

.bottom-bar.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.type-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.bar-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  height: 24px;
  min-width: 28px;
  padding: 0 6px;
  border-radius: 3px;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
}

.bar-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.bold-btn strong {
  font-weight: 800;
}

.type-picker {
  display: flex;
  flex-direction: column;
  min-width: 120px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
}

.type-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
}

.spacer {
  flex: 1;
}
</style>

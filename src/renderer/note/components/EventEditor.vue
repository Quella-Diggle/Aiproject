<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
  watch
} from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import History from '@tiptap/extension-history';
import type { Content, JSONContent } from '@tiptap/core';
import { useMessage } from 'naive-ui';
import { nanoid } from 'nanoid';
import { EventNode } from '../tiptap/EventNode';
import type { EventItem, Note } from '@shared/types';

const props = defineProps<{
  note: Note;
}>();

const emit = defineEmits<{
  (e: 'change', events: EventItem[]): void;
  (e: 'editor-ready', editor: Editor): void;
}>();

const message = useMessage();

const editor = shallowRef<Editor | null>(null);
const hostRef = ref<HTMLElement | null>(null);

const docContent = computed<Content>(() =>
  buildDocFromEvents(props.note.events)
);

function buildDocFromEvents(events: EventItem[]): Content {
  const nodes: JSONContent[] = events.length
    ? events.map((evt) => buildNode(evt))
    : [
        {
          type: 'eventNode',
          attrs: {
            eventId: nanoid(10),
            completed: false,
            completedAt: null,
            deadline: null,
            indent: 0,
            parentEventId: null
          },
          content: []
        }
      ];
  return {
    type: 'doc',
    content: nodes
  };
}

function buildNode(evt: EventItem): JSONContent {
  const inline = htmlToInline(evt.content || '');
  return {
    type: 'eventNode',
    attrs: {
      eventId: evt.id,
      completed: evt.completed,
      completedAt: evt.completedAt,
      deadline: evt.deadline,
      indent: evt.indentLevel,
      parentEventId: evt.parentEventId
    },
    content: inline
  };
}

function htmlToInline(html: string): JSONContent[] {
  if (!html) return [];
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  const result: JSONContent[] = [];
  walk(tmp, [], result);
  return result;
}

function walk(
  node: Node,
  marks: { type: string }[],
  out: JSONContent[]
): void {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.nodeValue ?? '';
      if (text) {
        out.push(
          marks.length
            ? { type: 'text', text, marks: [...marks] }
            : { type: 'text', text }
        );
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      const newMarks =
        tag === 'strong' || tag === 'b'
          ? [...marks, { type: 'bold' }]
          : marks;
      if (tag === 'br') {
        out.push({ type: 'text', text: '\n' });
      } else {
        walk(el, newMarks, out);
      }
    }
  }
}

function readEventsFromEditor(ed: Editor): EventItem[] {
  const json = ed.getJSON();
  const result: EventItem[] = [];
  const tops = (json.content ?? []) as JSONContent[];
  let lastTopId: string | null = null;
  for (const node of tops) {
    if (node.type !== 'eventNode') continue;
    const attrs = node.attrs ?? {};
    const id = (attrs.eventId as string) || nanoid(10);
    const indent: 0 | 1 =
      ((attrs.indent as number) ?? 0) === 1 ? 1 : 0;
    const html = inlineToHtml((node.content ?? []) as JSONContent[]);
    const evt: EventItem = {
      id,
      content: html,
      completed: !!attrs.completed,
      completedAt: (attrs.completedAt as string | null) ?? null,
      deadline: (attrs.deadline as string | null) ?? null,
      reminders: [],
      parentEventId:
        indent === 1
          ? ((attrs.parentEventId as string | null) ?? lastTopId)
          : null,
      indentLevel: indent
    };
    if (indent === 0) lastTopId = id;
    const existing = props.note.events.find((e) => e.id === id);
    if (existing) {
      evt.reminders = existing.reminders;
      if (!evt.deadline) evt.deadline = existing.deadline;
    }
    result.push(evt);
  }
  return result;
}

function inlineToHtml(nodes: JSONContent[]): string {
  let html = '';
  for (const node of nodes) {
    if (node.type === 'text') {
      const text = escapeHtml(node.text ?? '');
      const hasBold = (node.marks ?? []).some(
        (m) => (m as { type: string }).type === 'bold'
      );
      html += hasBold ? `<strong>${text}</strong>` : text;
    }
  }
  return html;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let saveTimer: number | null = null;
function scheduleSave(events: EventItem[]): void {
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;
    emit('change', events);
  }, 300);
}

function findEventNodeFromTarget(
  target: EventTarget | null
): HTMLElement | null {
  let el = target as HTMLElement | null;
  while (el) {
    if (
      el.nodeType === Node.ELEMENT_NODE &&
      el.classList?.contains('event-node')
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return null;
}

function handleContextMenu(e: MouseEvent): void {
  const node = findEventNodeFromTarget(e.target);
  if (!node) return;
  e.preventDefault();
  const eventId = node.getAttribute('data-event-id');
  if (!eventId || !editor.value) return;
  editor.value.commands.toggleEventCompleted(eventId);
}

function handleDoubleClick(e: MouseEvent): void {
  const node = findEventNodeFromTarget(e.target);
  if (!node) return;
  message.info('提醒/截止设置（开发中）');
}

function handleEditorClickEmpty(e: MouseEvent): void {
  if (!editor.value) return;
  if (findEventNodeFromTarget(e.target)) return;
  const view = editor.value.view;
  const docNode = view.state.doc;
  if (docNode.lastChild && docNode.lastChild.type.name === 'eventNode') {
    const lastChild = docNode.lastChild;
    if (lastChild.content.size === 0) {
      editor.value.commands.focus('end');
      return;
    }
  }
  editor.value.chain().focus('end').insertEvent().run();
}

function handleWheel(e: WheelEvent): void {
  const scrollEl = hostRef.value;
  if (!scrollEl) return;
  if (scrollEl.scrollHeight <= scrollEl.clientHeight) return;
  scrollEl.scrollTop += e.deltaY;
  e.preventDefault();
}

onMounted(() => {
  const ed = new Editor({
    extensions: [
      Document,
      Text,
      Bold,
      History,
      EventNode
    ],
    content: docContent.value,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        spellcheck: 'false'
      }
    },
    onUpdate({ editor: e }) {
      const events = readEventsFromEditor(e as Editor);
      scheduleSave(events);
    }
  });
  editor.value = ed;
  emit('editor-ready', ed);
});

onBeforeUnmount(() => {
  if (saveTimer !== null) window.clearTimeout(saveTimer);
  editor.value?.destroy();
});

watch(
  () => props.note.id,
  () => {
    if (editor.value) {
      editor.value.commands.setContent(docContent.value, false);
    }
  }
);

defineExpose({
  getEditor: () => editor.value
});
</script>

<template>
  <div
    ref="hostRef"
    class="editor-host"
    @contextmenu="handleContextMenu"
    @dblclick="handleDoubleClick"
    @click="handleEditorClickEmpty"
    @wheel="handleWheel"
  >
    <EditorContent v-if="editor" :editor="editor" />
  </div>
</template>

<style scoped>
.editor-host {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>

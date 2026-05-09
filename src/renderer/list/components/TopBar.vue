<script setup lang="ts">
import {
  NButton,
  NIcon,
  NPopover,
  NDropdown,
  NSwitch,
  useMessage
} from 'naive-ui';
import { computed, h, ref } from 'vue';
import { useNotesStore } from '../stores/notes';
import { NOTE_TYPE_LABELS, NOTE_TYPES } from '@shared/constants';
import type { NoteType, Theme } from '@shared/types';

const store = useNotesStore();
const message = useMessage();

const showTypePicker = ref(false);

async function handleCreate(type: NoteType): Promise<void> {
  showTypePicker.value = false;
  const note = await store.createNote(type);
  await window.listApi.window.openNote(note.id);
}

async function handleClose(): Promise<void> {
  await window.listApi.window.hideList();
}

async function handleMinimize(): Promise<void> {
  await window.listApi.window.minimize();
}

const settingsOptions = computed(() => [
  {
    key: 'theme',
    type: 'render',
    render: () =>
      h(
        'div',
        {
          class: 'menu-row'
        },
        [
          h('span', null, '深色主题'),
          h(NSwitch, {
            value: store.settings.theme === 'dark',
            'onUpdate:value': async (v: boolean) => {
              const theme: Theme = v ? 'dark' : 'light';
              await store.updateSettings({ theme });
              document.body.dataset.theme = theme;
            }
          })
        ]
      )
  },
  {
    key: 'autoStart',
    type: 'render',
    render: () =>
      h(
        'div',
        {
          class: 'menu-row'
        },
        [
          h('span', null, '开机自启动'),
          h(NSwitch, {
            value: store.settings.autoStart,
            'onUpdate:value': async (v: boolean) => {
              await store.updateSettings({ autoStart: v });
              message.success(v ? '已启用开机自启动' : '已关闭开机自启动');
            }
          })
        ]
      )
  },
  {
    type: 'divider',
    key: 'd1'
  },
  {
    label: '导入便笺（开发中）',
    key: 'import',
    disabled: true
  },
  {
    label: '导出全部为 MD（开发中）',
    key: 'exportMd',
    disabled: true
  },
  {
    label: '导出全部为 JSON（开发中）',
    key: 'exportJson',
    disabled: true
  },
  {
    type: 'divider',
    key: 'd2'
  },
  {
    label: '退出应用',
    key: 'quit'
  }
]);

async function onSettingsSelect(key: string): Promise<void> {
  if (key === 'quit') {
    await window.listApi.app.quit();
  }
}
</script>

<template>
  <div class="top-bar">
    <div class="drag-area">
      <span class="brand">便笺</span>
    </div>
    <div class="actions">
      <NPopover
        v-model:show="showTypePicker"
        trigger="click"
        placement="bottom-end"
      >
        <template #trigger>
          <button class="icon-btn" title="新建便笺">
            <span class="icon-plus">+</span>
          </button>
        </template>
        <div class="type-picker">
          <button
            v-for="t in NOTE_TYPES"
            :key="t"
            class="type-item"
            @click="handleCreate(t)"
          >
            <span class="dot" :data-type="t" />
            {{ NOTE_TYPE_LABELS[t] }}
          </button>
        </div>
      </NPopover>

      <NDropdown
        :options="settingsOptions as any"
        trigger="click"
        placement="bottom-end"
        @select="onSettingsSelect"
      >
        <button class="icon-btn" title="设置">⚙</button>
      </NDropdown>

      <button class="icon-btn" title="最小化" @click="handleMinimize">−</button>
      <button class="icon-btn close-btn" title="关闭" @click="handleClose">
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.top-bar {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bar-bg, #fff);
  border-bottom: 1px solid var(--card-border, rgba(0, 0, 0, 0.06));
  padding-left: 10px;
}

.drag-area {
  flex: 1;
  height: 100%;
  -webkit-app-region: drag;
  display: flex;
  align-items: center;
}

.brand {
  font-weight: 600;
  font-size: 13px;
  color: inherit;
}

.actions {
  display: flex;
  height: 100%;
  -webkit-app-region: no-drag;
}

.icon-btn {
  width: 32px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--hover, rgba(0, 0, 0, 0.06));
}

.close-btn:hover {
  background: #e81123;
  color: #fff;
}

.icon-plus {
  font-size: 18px;
  font-weight: 300;
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
  background: var(--hover, rgba(0, 0, 0, 0.05));
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.dot[data-type='annual'] {
  background: #fde2e4;
  border: 1px solid #f3a8ac;
}
.dot[data-type='weekly'] {
  background: #fff1c1;
  border: 1px solid #e6c878;
}
.dot[data-type='daily'] {
  background: #cfe8ff;
  border: 1px solid #8ab8e6;
}
.dot[data-type='temp'] {
  background: #e5e5e5;
  border: 1px solid #bdbdbd;
}
</style>

<style>
.menu-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 12px;
  font-size: 13px;
  min-width: 180px;
}
</style>

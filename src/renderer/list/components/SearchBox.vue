<script setup lang="ts">
import { NInput } from 'naive-ui';
import { useNotesStore } from '../stores/notes';

const store = useNotesStore();
</script>

<template>
  <div class="search-box">
    <NInput
      v-model:value="store.search"
      size="small"
      placeholder="搜索便笺标题或内容..."
      clearable
    />
  </div>
</template>

<style scoped>
.search-box {
  padding: 6px 8px;
  background: var(--bar-bg, #fff);
  border-bottom: 1px solid var(--card-border, rgba(0, 0, 0, 0.05));
}
</style>

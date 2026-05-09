import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ['nanoid'] })],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@main': resolve('src/main')
      }
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/main/index.ts')
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: ['nanoid'] })],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    build: {
      rollupOptions: {
        input: {
          list: resolve('src/preload/list.ts'),
          note: resolve('src/preload/note.ts')
        }
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@renderer': resolve('src/renderer')
      }
    },
    plugins: [vue()],
    build: {
      rollupOptions: {
        input: {
          list: resolve('src/renderer/list/index.html'),
          note: resolve('src/renderer/note/index.html')
        }
      }
    }
  }
});

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './styles.css';

function renderFatal(message: string): void {
  const root = document.getElementById('app') ?? document.body;
  root.innerHTML = `<pre style="white-space:pre-wrap;padding:16px;margin:0;font:12px/1.5 Consolas,monospace;color:#b00020;background:#fff;">${message}</pre>`;
}

window.addEventListener('error', (e) => {
  const msg = `Renderer error:\n${e.message || 'unknown error'}`;
  console.error('[note] window error', e.error ?? e.message);
  renderFatal(msg);
});

window.addEventListener('unhandledrejection', (e) => {
  const reason =
    e.reason instanceof Error ? e.reason.stack || e.reason.message : String(e.reason);
  const msg = `Unhandled rejection:\n${reason}`;
  console.error('[note] unhandled rejection', e.reason);
  renderFatal(msg);
});

try {
  const app = createApp(App);
  app.config.errorHandler = (err, _instance, info) => {
    const detail = err instanceof Error ? err.stack || err.message : String(err);
    const msg = `Vue error (${info}):\n${detail}`;
    console.error('[note] vue error', err, info);
    renderFatal(msg);
  };
  app.use(createPinia());
  app.mount('#app');
} catch (err) {
  const detail = err instanceof Error ? err.stack || err.message : String(err);
  console.error('[note] bootstrap failed', err);
  renderFatal(`App bootstrap failed:\n${detail}`);
}

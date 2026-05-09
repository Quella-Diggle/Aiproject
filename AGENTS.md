# StickyNotes Agent Notes

## Project Snapshot
- Stack: Electron + Vue 3 + Pinia + Naive UI + Tiptap.
- Windows desktop app with two renderer entries: `list` and `note`.
- Persistence path: `%APPDATA%/StickyNotes/`.

## Runtime Entrypoints
- Main process: `src/main/index.ts`.
- List window renderer: `src/renderer/list`.
- Note window renderer: `src/renderer/note`.

## Current Interaction Rules (Important)
- Note window default size: `267 x 350`, still user-resizable.
- Note title is in note content area top row (not in top bar).
- `Tab`: insert a child event below current event.
- `Enter`: insert sibling event; for a parent event it inserts after its child block.
- Right-click on event: toggle complete state directly.

## Guardrails
- Keep IPC payloads serializable (avoid passing Vue reactive proxies).
- Do not regress list/topbar fixed layout: only note list area should scroll.
- Preserve data compatibility in `noteManager.getNote()` normalization.

## Quick Verify Commands
- `npm run dev`
- `npm run typecheck`
- `npm run build`

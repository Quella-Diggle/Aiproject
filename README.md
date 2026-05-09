# StickyNotes (MVP)

基于 Electron + Vue 3 + Pinia + Naive UI + Tiptap 的 Windows 桌面便笺应用，本仓库目前实现 MVP（第一阶段全部 + 第二阶段核心 + 第三阶段核心），覆盖主流程：新建便笺 → 列表查看 → 编辑事件 → 重启恢复。

## 功能范围（MVP）

- 便笺列表窗口：分组排序（年度→周→日→临时）、搜索、删除（含二次确认）、双击打开。
- 设置：浅/深色主题、开机自启动开关、占位的导入/导出菜单（开发中）。
- 便笺悬浮窗：每便笺独立窗口、置顶、隐藏、默认尺寸 `267×350`、可拖拽缩放。
- 标题位于中间内容区顶部独立一行，点击可编辑；失焦时空标题占位文本自动隐藏。
- 类型圆圈一键切换便笺类型与颜色，B/·/123 三类内联格式化按钮。
- 基于 Tiptap 的事件编辑器：每个事件是带 `data-event-id` 的块级节点。
  - Enter 在同级新建事件（若当前为母事件，会跳过其子事件后再创建同级事件）
  - Tab 在当前事件下方新建子事件（`indentLevel=1`，自动绑定 `parentEventId`）
  - Shift+Tab 取消缩进回到同级
  - 空事件 Backspace 删除
  - 右键事件直接切换完成 / 未完成（中划线样式联动）
  - 双击事件 → 占位提醒设置（待 Phase 4）
  - 内容变更防抖 300ms 自动保存
- 上下功能区按窗口焦点自动显隐；滚动条默认极简，悬停增强，失焦隐藏。
- 数据持久化：原子写入 `%APPDATA%/StickyNotes/`（`index.json`、`settings.json`、`notes/{uuid}.json`）。

## 不在 MVP 范围

- 提醒调度器、提醒弹窗、稍后提醒（Phase 4）
- 系统托盘菜单、跨窗口快速切换（Phase 5）
- 导入/导出 MD/JSON、跨设备恢复（Phase 6 部分）
- 完成事件折叠 `…`、截止日期渲染、提醒规则编辑 UI
- 自动化测试

## 快速开始

```bash
npm install
npm run dev          # 启动开发模式
npm run build        # 构建生产代码到 out/
npm run build:win    # 同时打包 Windows NSIS 安装包到 dist/
npm run typecheck    # TypeScript 检查（main + preload + renderer）
```

## 目录结构

- `src/main` — Electron 主进程（窗口、IPC、文件存储、自启动）
- `src/preload` — list / note 两套 contextBridge API
- `src/shared` — 类型与常量、IPC channel 定义
- `src/renderer/list` — 便笺列表窗 SPA
- `src/renderer/note` — 便笺悬浮窗 SPA（Tiptap 编辑器）

## 数据落盘位置

- 索引：`%APPDATA%\StickyNotes\index.json`
- 设置：`%APPDATA%\StickyNotes\settings.json`
- 便笺：`%APPDATA%\StickyNotes\notes\{uuid}.json`

所有写入均经过 `tmp + rename` 原子替换，避免半写文件。

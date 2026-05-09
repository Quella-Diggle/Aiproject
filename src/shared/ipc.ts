export const IPC = {
  notesList: 'notes:list',
  notesCreate: 'notes:create',
  notesGet: 'notes:get',
  notesUpdate: 'notes:update',
  notesDelete: 'notes:delete',

  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',

  windowOpenList: 'window:openList',
  windowOpenNote: 'window:openNote',
  windowHideNote: 'window:hideNote',
  windowHideList: 'window:hideList',
  windowTogglePin: 'window:togglePin',
  windowGetPin: 'window:getPin',
  windowGetNoteId: 'window:getNoteId',
  windowMinimize: 'window:minimize',
  appQuit: 'app:quit',

  noteUpdated: 'note:updated',
  noteDeleted: 'note:deleted',
  noteCreated: 'note:created',
  noteFocusChange: 'note:focusChange',
  themeChanged: 'theme:changed'
} as const;

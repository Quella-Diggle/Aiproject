import type { ListApi } from './list';
import type { NoteApi } from './note';

declare global {
  interface Window {
    listApi: ListApi;
    noteApi: NoteApi;
  }
}

export {};

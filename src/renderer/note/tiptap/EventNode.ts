import { Node, mergeAttributes } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import { nanoid } from 'nanoid';

export interface EventNodeAttrs {
  eventId: string;
  completed: boolean;
  completedAt: string | null;
  deadline: string | null;
  indent: 0 | 1;
  parentEventId: string | null;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    eventNode: {
      insertEvent: (attrs?: Partial<EventNodeAttrs>) => ReturnType;
      insertChildEvent: () => ReturnType;
      insertSiblingEvent: () => ReturnType;
      toggleEventCompleted: (eventId: string) => ReturnType;
      deleteEvent: (eventId: string) => ReturnType;
      indentEvent: () => ReturnType;
      outdentEvent: () => ReturnType;
    };
  }
}

export const EventNode = Node.create({
  name: 'eventNode',
  group: 'block',
  content: 'inline*',
  defining: true,
  selectable: true,

  addAttributes() {
    return {
      eventId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-event-id') ?? nanoid(10),
        renderHTML: (attrs) => ({ 'data-event-id': attrs.eventId })
      },
      completed: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-completed') === 'true',
        renderHTML: (attrs) => ({
          'data-completed': attrs.completed ? 'true' : 'false'
        })
      },
      completedAt: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-completed-at') ?? null,
        renderHTML: (attrs) =>
          attrs.completedAt
            ? { 'data-completed-at': attrs.completedAt }
            : {}
      },
      deadline: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-deadline') ?? null,
        renderHTML: (attrs) =>
          attrs.deadline ? { 'data-deadline': attrs.deadline } : {}
      },
      indent: {
        default: 0,
        parseHTML: (el) => Number(el.getAttribute('data-indent') ?? '0'),
        renderHTML: (attrs) => ({ 'data-indent': String(attrs.indent ?? 0) })
      },
      parentEventId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-parent-event-id') ?? null,
        renderHTML: (attrs) =>
          attrs.parentEventId
            ? { 'data-parent-event-id': attrs.parentEventId }
            : {}
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-event-id]'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'event-node' }),
      0
    ];
  },

  addCommands() {
    return {
      insertEvent:
        (attrs = {}) =>
        ({ chain }) => {
          const id = attrs.eventId ?? nanoid(10);
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                eventId: id,
                completed: attrs.completed ?? false,
                completedAt: attrs.completedAt ?? null,
                deadline: attrs.deadline ?? null,
                indent: attrs.indent ?? 0,
                parentEventId: attrs.parentEventId ?? null
              },
              content: []
            })
            .focus()
            .run();
        },

      insertChildEvent:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth >= 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name !== 'eventNode') continue;
            const pos = $from.before(depth);
            const childId = nanoid(10);
            const parentEventId =
              typeof node.attrs.eventId === 'string' && node.attrs.eventId
                ? node.attrs.eventId
                : null;
            const insertPos = pos + node.nodeSize;
            const childNode = state.schema.nodes.eventNode.create({
              eventId: childId,
              completed: false,
              completedAt: null,
              deadline: null,
              indent: 1,
              parentEventId
            });
            tr.insert(insertPos, childNode);
            tr.setSelection(
              TextSelection.near(tr.doc.resolve(insertPos + 1))
            );
            if (dispatch) dispatch(tr.scrollIntoView());
            return true;
          }
          return false;
        },

      insertSiblingEvent:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth >= 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name !== 'eventNode') continue;
            const currentPos = $from.before(depth);
            const currentIndent = node.attrs.indent === 1 ? 1 : 0;
            const currentEventId =
              typeof node.attrs.eventId === 'string' ? node.attrs.eventId : '';
            const currentParentId =
              typeof node.attrs.parentEventId === 'string'
                ? node.attrs.parentEventId
                : null;

            let insertPos = currentPos + node.nodeSize;
            if (currentIndent === 0 && currentEventId) {
              let offset = 0;
              let currentIndex = -1;
              for (let i = 0; i < state.doc.childCount; i++) {
                const pos = 1 + offset;
                if (pos === currentPos) {
                  currentIndex = i;
                  break;
                }
                offset += state.doc.child(i).nodeSize;
              }
              if (currentIndex >= 0) {
                let branchEnd = insertPos;
                offset = 0;
                for (let i = 0; i < state.doc.childCount; i++) {
                  const pos = 1 + offset;
                  const child = state.doc.child(i);
                  if (i > currentIndex) {
                    const isDirectChild =
                      child.type.name === 'eventNode' &&
                      child.attrs.indent === 1 &&
                      child.attrs.parentEventId === currentEventId;
                    if (!isDirectChild) break;
                    branchEnd = pos + child.nodeSize;
                  }
                  offset += child.nodeSize;
                }
                insertPos = branchEnd;
              }
            }

            const siblingNode = state.schema.nodes.eventNode.create({
              eventId: nanoid(10),
              completed: false,
              completedAt: null,
              deadline: null,
              indent: currentIndent,
              parentEventId: currentIndent === 1 ? currentParentId : null
            });

            tr.insert(insertPos, siblingNode);
            tr.setSelection(TextSelection.near(tr.doc.resolve(insertPos + 1)));
            if (dispatch) dispatch(tr.scrollIntoView());
            return true;
          }
          return false;
        },

      toggleEventCompleted:
        (eventId: string) =>
        ({ tr, state, dispatch }) => {
          let changed = false;
          state.doc.descendants((node, pos) => {
            if (
              node.type.name === 'eventNode' &&
              node.attrs.eventId === eventId
            ) {
              const completed = !node.attrs.completed;
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                completed,
                completedAt: completed ? new Date().toISOString() : null
              });
              changed = true;
              return false;
            }
            return true;
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },

      deleteEvent:
        (eventId: string) =>
        ({ tr, state, dispatch }) => {
          let changed = false;
          state.doc.descendants((node, pos) => {
            if (
              node.type.name === 'eventNode' &&
              node.attrs.eventId === eventId
            ) {
              tr.delete(pos, pos + node.nodeSize);
              changed = true;
              return false;
            }
            return true;
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },

      indentEvent:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth >= 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'eventNode') {
              if (node.attrs.indent === 1) return false;
              const pos = $from.before(depth);
              const indexInDoc = $from.index(0);
              let parentEventId: string | null = null;
              for (let i = indexInDoc - 1; i >= 0; i--) {
                const sibling = state.doc.child(i);
                if (
                  sibling.type.name === 'eventNode' &&
                  sibling.attrs.indent === 0
                ) {
                  parentEventId = sibling.attrs.eventId;
                  break;
                }
              }
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: 1,
                parentEventId
              });
              if (dispatch) dispatch(tr);
              return true;
            }
          }
          return false;
        },

      outdentEvent:
        () =>
        ({ tr, state, dispatch }) => {
          const { $from } = state.selection;
          for (let depth = $from.depth; depth >= 0; depth--) {
            const node = $from.node(depth);
            if (node.type.name === 'eventNode') {
              if (node.attrs.indent === 0) return false;
              const pos = $from.before(depth);
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent: 0,
                parentEventId: null
              });
              if (dispatch) dispatch(tr);
              return true;
            }
          }
          return false;
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.insertChildEvent(),
      'Shift-Tab': () => this.editor.commands.outdentEvent(),
      Enter: () => this.editor.commands.insertSiblingEvent(),
      Backspace: () => {
        const { state } = this.editor;
        const { $from, empty } = state.selection;
        if (!empty) return false;
        for (let depth = $from.depth; depth >= 0; depth--) {
          const node = $from.node(depth);
          if (node.type.name === 'eventNode') {
            const isAtStart = $from.parentOffset === 0;
            if (isAtStart && node.content.size === 0) {
              const pos = $from.before(depth);
              const tr = state.tr.delete(pos, pos + node.nodeSize);
              this.editor.view.dispatch(tr);
              return true;
            }
          }
        }
        return false;
      }
    };
  }
});

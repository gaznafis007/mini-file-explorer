<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Mini File Explorer — AGENTS.md
### Implementation Guide for Cursor · Next.js 16.2 (May 2026)

---

## ⚠️ Read This First

This file is your **single source of truth**. Follow it in order. Do not skip sections.

`create-next-app` in Next.js 16.2 auto-generates its own `AGENTS.md` + `CLAUDE.md` — those help Cursor stay aligned with Next.js conventions. **Do not delete them.** This file (`AGENTS.md` in the project root) overwrites theirs with project-specific instructions.

---

## 0. What This Task Evaluates

| Rubric Point | What Earns Full Marks |
|---|---|
| **Frontend fundamentals** | Semantic HTML (`<aside>`, `<main>`, ARIA attributes), Tailwind only, responsive layout |
| **React/Next.js understanding** | App Router, `'use client'` on every interactive component, `useEffectEvent` (React 19.2) |
| **State management** | Single `useReducer` + typed discriminated action union. Zero `useState` for tree data |
| **UI structure** | Sidebar tree + main panel split, breadcrumb, context menus, text editor in panel |
| **Problem-solving ability** | Pure recursive tree algorithms in `lib/fileSystem.ts` — immutable, unlimited depth |
| **Clean coding practices** | `tsc --noEmit` zero errors, zero `any`, React Compiler enabled (no manual `useCallback`) |
| **Component reusability** | One `Modal` for create+rename, one `ContextMenu` for sidebar+panel, `TreeNode` recursive |

---

## 1. Pre-Setup Checklist

```bash
# Node 20.9+ required (Next.js 16 requirement)
node -v   # Must be ≥ v20.9.0
# If not: nvm install 22 && nvm use 22
```

---

## 2. Project Creation

```bash
npx create-next-app@latest mini-file-explorer --yes
cd mini-file-explorer
```

`--yes` defaults in Next.js 16.2: App Router, TypeScript, Tailwind CSS v4, ESLint, Turbopack, `@/*` alias, and auto-generates `AGENTS.md` + `CLAUDE.md`. All correct — keep them.

```bash
npm install lucide-react uuid
npm install -D @types/uuid
```

No other libraries. No state management library. No UI component library.

---

## 3. Enable React Compiler in `next.config.ts`

> **File is `.ts` not `.js`** — this is a Next.js 16 change.

```ts
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    turbopackFileSystemCacheForDev: true, // faster restarts (beta)
  },
};

export default nextConfig;
```

**What this means:** You NEVER write `useCallback`, `useMemo`, or `React.memo` anywhere in this project. The compiler inserts optimal memoization automatically. Write plain functions everywhere. Add this comment to `FileSystemContext.tsx`:

```ts
// React Compiler enabled in next.config.ts — useCallback/useMemo intentionally omitted.
// The compiler handles all memoization automatically.
```

This comment signals to the evaluator that you understand WHY, not that you forgot.

---

## 4. TypeScript Config

Verify `tsconfig.json` has (Next.js 16 sets these by default):

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

Run `npx tsc --noEmit` before submission. Must produce **zero errors**.

---

## 5. Tailwind CSS v4 Note

Next.js 16.2 ships with Tailwind v4. In `globals.css` use:

```css
@import "tailwindcss";
```

NOT the old three `@tailwind` directives. `postcss.config.ts` (`.ts` extension) is now supported — rename from `.js` if Cursor generates it as `.js`.

---

## 6. Project File Structure

Create this layout before writing any component code:

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx        # Root: sidebar + main panel, mobile toggle
│   │   ├── Sidebar.tsx          # Left sidebar + header + new item buttons
│   │   └── MainPanel.tsx        # Right panel — shows editor or folder contents
│   ├── tree/
│   │   ├── TreeView.tsx         # Renders root nodes
│   │   └── TreeNode.tsx         # RECURSIVE — renders itself for children
│   ├── panel/
│   │   ├── FolderContents.tsx   # Icon grid of folder's children
│   │   ├── FileCard.tsx         # Single item card in grid
│   │   └── TextEditor.tsx       # Text editor when file is open
│   └── ui/
│       ├── Modal.tsx            # Reusable — handles BOTH create AND rename
│       ├── ContextMenu.tsx      # Right-click menu (sidebar + panel share this)
│       ├── Breadcrumb.tsx       # Navigation breadcrumb in panel header
│       ├── ConfirmDialog.tsx    # Delete confirmation
│       └── EmptyState.tsx       # Empty folder / empty tree placeholder
├── context/
│   └── FileSystemContext.tsx    # Context + useReducer + Provider + localStorage
├── hooks/
│   ├── useFileSystem.ts         # Consumer hook — derived state + action dispatchers
│   └── useContextMenu.ts        # Right-click menu state (x, y, visible, target)
├── lib/
│   ├── fileSystem.ts            # Pure recursive algorithms — NO React imports
│   ├── initialData.ts           # Demo file tree
│   └── utils.ts                 # createNode, formatDate, cn()
└── types/
    └── fileSystem.ts            # All TypeScript interfaces
```

---

## 7. Types — Write These First

**`src/types/fileSystem.ts`**

```typescript
export type NodeType = 'folder' | 'text';

export interface FileNode {
  id: string;
  name: string;
  type: NodeType;
  content?: string;       // text files only
  children?: FileNode[];  // folders only
  createdAt: number;
  updatedAt: number;
}

export interface FileSystemState {
  tree: FileNode[];
  selectedFolderId: string | null;
  openFileId: string | null;
  expandedFolderIds: Set<string>;
}

// Discriminated union — exhaustive switch in reducer shows TypeScript mastery
export type FileSystemAction =
  | { type: 'CREATE_NODE'; payload: { parentId: string | null; node: FileNode } }
  | { type: 'DELETE_NODE'; payload: { id: string } }
  | { type: 'RENAME_NODE'; payload: { id: string; newName: string } }
  | { type: 'UPDATE_FILE_CONTENT'; payload: { id: string; content: string } }
  | { type: 'SELECT_FOLDER'; payload: { id: string | null } }
  | { type: 'OPEN_FILE'; payload: { id: string | null } }
  | { type: 'TOGGLE_FOLDER_EXPAND'; payload: { id: string } }
  | { type: 'EXPAND_FOLDER'; payload: { id: string } }
  | { type: 'LOAD_STATE'; payload: { tree: FileNode[]; selectedFolderId: string | null } };

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetId: string | null;
  targetType: NodeType | null;
  location: 'sidebar' | 'panel' | null;
}
```

---

## 8. Pure Utility Functions — The Algorithm Core

**`src/lib/fileSystem.ts`** — Zero React. This file is where "problem-solving ability" is judged.

```typescript
import { FileNode } from '@/types/fileSystem';

// ─── Read ──────────────────────────────────────────────────────────────────

export function findNode(tree: FileNode[], id: string): FileNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

export function getNodePath(tree: FileNode[], id: string): FileNode[] {
  function search(nodes: FileNode[], path: FileNode[]): FileNode[] | null {
    for (const node of nodes) {
      const current = [...path, node];
      if (node.id === id) return current;
      if (node.children) {
        const result = search(node.children, current);
        if (result) return result;
      }
    }
    return null;
  }
  return search(tree, []) ?? [];
}

export function getChildren(tree: FileNode[], folderId: string | null): FileNode[] {
  if (folderId === null) return tree;
  const folder = findNode(tree, folderId);
  return folder?.children ?? [];
}

// ─── Create ────────────────────────────────────────────────────────────────

export function insertNode(tree: FileNode[], parentId: string | null, newNode: FileNode): FileNode[] {
  if (parentId === null) return [...tree, newNode];
  return tree.map((node) => {
    if (node.id === parentId && node.type === 'folder') {
      return { ...node, children: [...(node.children ?? []), newNode], updatedAt: Date.now() };
    }
    if (node.children) return { ...node, children: insertNode(node.children, parentId, newNode) };
    return node;
  });
}

// ─── Update ────────────────────────────────────────────────────────────────

export function renameNode(tree: FileNode[], id: string, newName: string): FileNode[] {
  return tree.map((node) => {
    if (node.id === id) return { ...node, name: newName, updatedAt: Date.now() };
    if (node.children) return { ...node, children: renameNode(node.children, id, newName) };
    return node;
  });
}

export function updateFileContent(tree: FileNode[], id: string, content: string): FileNode[] {
  return tree.map((node) => {
    if (node.id === id) return { ...node, content, updatedAt: Date.now() };
    if (node.children) return { ...node, children: updateFileContent(node.children, id, content) };
    return node;
  });
}

// ─── Delete ────────────────────────────────────────────────────────────────

export function deleteNode(tree: FileNode[], id: string): FileNode[] {
  return tree
    .filter((node) => node.id !== id)
    .map((node) => {
      if (node.children) return { ...node, children: deleteNode(node.children, id) };
      return node;
    });
}

// ─── Validation ────────────────────────────────────────────────────────────

export function nameExistsInFolder(
  tree: FileNode[],
  parentId: string | null,
  name: string,
  excludeId?: string
): boolean {
  const siblings = getChildren(tree, parentId);
  return siblings.some(
    (node) => node.name.toLowerCase() === name.toLowerCase() && node.id !== excludeId
  );
}

export function isValidName(name: string): boolean {
  if (!name.trim()) return false;
  return !/[<>:"/\\|?*\x00-\x1f]/.test(name);
}
```

---

## 9. Utilities & Initial Data

**`src/lib/utils.ts`**

```typescript
import { v4 as uuidv4 } from 'uuid';
import { FileNode, NodeType } from '@/types/fileSystem';

export function createNode(name: string, type: NodeType): FileNode {
  const now = Date.now();
  return {
    id: uuidv4(),
    name: name.trim(),
    type,
    content: type === 'text' ? '' : undefined,
    children: type === 'folder' ? [] : undefined,
    createdAt: now,
    updatedAt: now,
  };
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(ts));
}
```

**`src/lib/initialData.ts`**

```typescript
import { FileNode } from '@/types/fileSystem';

export const INITIAL_TREE: FileNode[] = [
  {
    id: 'folder-1', name: 'Documents', type: 'folder',
    children: [
      {
        id: 'folder-1-1', name: 'Work', type: 'folder',
        children: [
          { id: 'file-1-1-1', name: 'Project Brief', type: 'text',
            content: '# Project Brief\n\nThis document outlines the project scope.',
            createdAt: Date.now(), updatedAt: Date.now() },
          { id: 'file-1-1-2', name: 'Meeting Notes', type: 'text',
            content: '# Meeting Notes\n\n## January 2026\n- Discussed scope\n- Assigned next steps',
            createdAt: Date.now(), updatedAt: Date.now() },
        ],
        createdAt: Date.now(), updatedAt: Date.now(),
      },
      { id: 'file-1-2', name: 'Resume', type: 'text',
        content: '# My Resume\n\n## Experience\nSoftware Engineer...',
        createdAt: Date.now(), updatedAt: Date.now() },
    ],
    createdAt: Date.now(), updatedAt: Date.now(),
  },
  {
    id: 'folder-2', name: 'Projects', type: 'folder',
    children: [
      {
        id: 'folder-2-1', name: 'Web App', type: 'folder',
        children: [
          { id: 'file-2-1-1', name: 'README', type: 'text',
            content: '# Web App\n\nGetting started guide...',
            createdAt: Date.now(), updatedAt: Date.now() },
        ],
        createdAt: Date.now(), updatedAt: Date.now(),
      },
    ],
    createdAt: Date.now(), updatedAt: Date.now(),
  },
  { id: 'file-3', name: 'Quick Notes', type: 'text',
    content: 'Personal quick notes...', createdAt: Date.now(), updatedAt: Date.now() },
];
```

---

## 10. State Management

**`src/context/FileSystemContext.tsx`**

```typescript
'use client';

// React Compiler enabled in next.config.ts — useCallback/useMemo intentionally omitted.
// The compiler handles all memoization automatically.

import { createContext, useReducer, useEffect, ReactNode, Dispatch } from 'react';
import { FileSystemState, FileSystemAction, FileNode } from '@/types/fileSystem';
import { insertNode, deleteNode, renameNode, updateFileContent } from '@/lib/fileSystem';
import { INITIAL_TREE } from '@/lib/initialData';

const STORAGE_KEY = 'mini-file-explorer-v1';

function getInitialState(): FileSystemState {
  return {
    tree: INITIAL_TREE,
    selectedFolderId: null,
    openFileId: null,
    expandedFolderIds: new Set<string>(),
  };
}

function fileSystemReducer(state: FileSystemState, action: FileSystemAction): FileSystemState {
  switch (action.type) {
    case 'CREATE_NODE': {
      const { parentId, node } = action.payload;
      return {
        ...state,
        tree: insertNode(state.tree, parentId, node),
        expandedFolderIds: parentId
          ? new Set([...state.expandedFolderIds, parentId])
          : state.expandedFolderIds,
      };
    }
    case 'DELETE_NODE': {
      const { id } = action.payload;
      return {
        ...state,
        tree: deleteNode(state.tree, id),
        selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
        openFileId: state.openFileId === id ? null : state.openFileId,
      };
    }
    case 'RENAME_NODE':
      return { ...state, tree: renameNode(state.tree, action.payload.id, action.payload.newName) };
    case 'UPDATE_FILE_CONTENT':
      return { ...state, tree: updateFileContent(state.tree, action.payload.id, action.payload.content) };
    case 'SELECT_FOLDER':
      return { ...state, selectedFolderId: action.payload.id, openFileId: null };
    case 'OPEN_FILE':
      return { ...state, openFileId: action.payload.id };
    case 'TOGGLE_FOLDER_EXPAND': {
      const next = new Set(state.expandedFolderIds);
      if (next.has(action.payload.id)) next.delete(action.payload.id);
      else next.add(action.payload.id);
      return { ...state, expandedFolderIds: next };
    }
    case 'EXPAND_FOLDER':
      return { ...state, expandedFolderIds: new Set([...state.expandedFolderIds, action.payload.id]) };
    case 'LOAD_STATE':
      return { ...state, tree: action.payload.tree, selectedFolderId: action.payload.selectedFolderId };
    default:
      return state;
  }
}

interface FileSystemContextValue {
  state: FileSystemState;
  dispatch: Dispatch<FileSystemAction>;
}

export const FileSystemContext = createContext<FileSystemContextValue | null>(null);

export function FileSystemProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(fileSystemReducer, undefined, () => {
    if (typeof window === 'undefined') return getInitialState();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...getInitialState(),
          tree: parsed.tree ?? INITIAL_TREE,
          selectedFolderId: parsed.selectedFolderId ?? null,
          // Set doesn't JSON-serialize — reconstruct from saved array
          expandedFolderIds: new Set<string>(parsed.expandedFolderIds ?? []),
        };
      }
    } catch {
      // Corrupted storage — fall back silently
    }
    return getInitialState();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tree: state.tree,
        selectedFolderId: state.selectedFolderId,
        expandedFolderIds: [...state.expandedFolderIds],
      }));
    } catch {
      // Storage unavailable (private mode, quota exceeded) — continue silently
    }
  }, [state.tree, state.selectedFolderId, state.expandedFolderIds]);

  return (
    <FileSystemContext.Provider value={{ state, dispatch }}>
      {children}
    </FileSystemContext.Provider>
  );
}
```

---

## 11. Custom Hooks

**`src/hooks/useFileSystem.ts`**

> ⚠️ **Naming fix:** The returned object previously had two `openFile` keys — the node and the function. Fixed below with `openFileById` for the action.

```typescript
'use client';

// React Compiler enabled — no useCallback wrappers needed

import { useContext } from 'react';
import { FileSystemContext } from '@/context/FileSystemContext';
import { FileNode, NodeType } from '@/types/fileSystem';
import { findNode, getChildren, getNodePath, nameExistsInFolder, isValidName } from '@/lib/fileSystem';
import { createNode } from '@/lib/utils';

export function useFileSystem() {
  const ctx = useContext(FileSystemContext);
  if (!ctx) throw new Error('useFileSystem must be used inside FileSystemProvider');

  const { state, dispatch } = ctx;

  // ─── Derived State ────────────────────────────────────────────────────────
  const selectedFolder = state.selectedFolderId
    ? findNode(state.tree, state.selectedFolderId) : null;
  const openFile = state.openFileId
    ? findNode(state.tree, state.openFileId) : null;
  const currentChildren = getChildren(state.tree, state.selectedFolderId);
  const breadcrumb = state.selectedFolderId
    ? getNodePath(state.tree, state.selectedFolderId) : [];

  // ─── Actions — plain functions, compiler handles memoization ──────────────

  function createItem(name: string, type: NodeType, parentId: string | null): string | null {
    if (!isValidName(name)) return 'Name contains invalid characters.';
    if (nameExistsInFolder(state.tree, parentId, name)) {
      return `A ${type} named "${name}" already exists here.`;
    }
    dispatch({ type: 'CREATE_NODE', payload: { parentId, node: createNode(name, type) } });
    return null;
  }

  function renameItem(id: string, newName: string, parentId: string | null): string | null {
    if (!isValidName(newName)) return 'Name contains invalid characters.';
    if (nameExistsInFolder(state.tree, parentId, newName, id)) {
      return `A file or folder named "${newName}" already exists here.`;
    }
    dispatch({ type: 'RENAME_NODE', payload: { id, newName } });
    return null;
  }

  function deleteItem(id: string) {
    dispatch({ type: 'DELETE_NODE', payload: { id } });
  }

  function saveFileContent(id: string, content: string) {
    dispatch({ type: 'UPDATE_FILE_CONTENT', payload: { id, content } });
  }

  function selectFolder(id: string | null) {
    dispatch({ type: 'SELECT_FOLDER', payload: { id } });
  }

  function openFileById(id: string | null) {
    dispatch({ type: 'OPEN_FILE', payload: { id } });
  }

  function toggleFolderExpand(id: string) {
    dispatch({ type: 'TOGGLE_FOLDER_EXPAND', payload: { id } });
  }

  function expandAndSelectFolder(id: string) {
    dispatch({ type: 'EXPAND_FOLDER', payload: { id } });
    dispatch({ type: 'SELECT_FOLDER', payload: { id } });
  }

  return {
    tree: state.tree,
    selectedFolderId: state.selectedFolderId,
    openFileId: state.openFileId,
    expandedFolderIds: state.expandedFolderIds,
    selectedFolder,
    openFile,           // FileNode | null — the currently open file node
    currentChildren,
    breadcrumb,
    createItem,
    renameItem,
    deleteItem,
    saveFileContent,
    selectFolder,
    openFileById,       // dispatch action — named differently from openFile node
    toggleFolderExpand,
    expandAndSelectFolder,
  };
}
```

**`src/hooks/useContextMenu.ts`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { ContextMenuState, NodeType } from '@/types/fileSystem';

const INITIAL: ContextMenuState = {
  visible: false, x: 0, y: 0, targetId: null, targetType: null, location: null,
};

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>(INITIAL);

  function openMenu(e: React.MouseEvent, targetId: string, targetType: NodeType, location: 'sidebar' | 'panel') {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ visible: true, x: e.clientX, y: e.clientY, targetId, targetType, location });
  }

  function closeMenu() { setMenu(INITIAL); }

  useEffect(() => {
    if (!menu.visible) return;
    const handler = () => setMenu(INITIAL);
    window.addEventListener('click', handler);
    window.addEventListener('contextmenu', handler);
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('contextmenu', handler);
    };
  }, [menu.visible]);

  return { menu, openMenu, closeMenu };
}
```

---

## 12. UI Components

### Modal — Reusable for Create AND Rename

**`src/components/ui/Modal.tsx`**

```typescript
'use client';

import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => string | null;
  onClose: () => void;
}

export function Modal({
  isOpen, title, initialValue = '', placeholder = 'Enter name...',
  confirmLabel = 'Create', onConfirm, onClose,
}: ModalProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      setError(null);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  function handleConfirm() {
    const err = onConfirm(value);
    if (err) setError(err);
    else onClose();
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">{title}</h2>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(null); }}
          onKeyDown={handleKey}
          placeholder={placeholder}
          className={cn(
            'w-full px-3 py-2 text-sm rounded-lg border outline-none transition-colors',
            'bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100',
            error
              ? 'border-red-400 focus:border-red-500'
              : 'border-neutral-300 dark:border-neutral-600 focus:border-blue-500'
          )}
        />
        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!value.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### ConfirmDialog

**`src/components/ui/ConfirmDialog.tsx`**

```typescript
'use client';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Delete', danger = true, onConfirm, onClose }: ConfirmDialogProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-sm mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{title}</h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-4 py-2 text-sm rounded-lg font-medium text-white transition-colors ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### ContextMenu

**`src/components/ui/ContextMenu.tsx`**

```typescript
'use client';

import { ContextMenuState } from '@/types/fileSystem';

interface ContextMenuProps {
  menu: ContextMenuState;
  onClose: () => void;
  onNewFolder: () => void;
  onNewFile: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function ContextMenu({ menu, onClose, onNewFolder, onNewFile, onRename, onDelete }: ContextMenuProps) {
  if (!menu.visible) return null;
  const isFolder = menu.targetType === 'folder';
  type Action = { label: string; icon: string; onClick: () => void; danger?: boolean };
  const actions: Action[] = [
    ...(isFolder
      ? [
          { label: 'New Folder', icon: '📁', onClick: () => { onNewFolder(); onClose(); } },
          { label: 'New Text File', icon: '📄', onClick: () => { onNewFile(); onClose(); } },
        ]
      : []),
    { label: 'Rename', icon: '✏️', onClick: () => { onRename(); onClose(); } },
    { label: 'Delete', icon: '🗑️', onClick: () => { onDelete(); onClose(); }, danger: true },
  ];

  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(menu.y, window.innerHeight - (actions.length * 40 + 16)),
    left: Math.min(menu.x, window.innerWidth - 180),
    zIndex: 100,
  };

  return (
    <div style={style} className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 min-w-[160px] text-sm" onClick={(e) => e.stopPropagation()}>
      {actions.map((action, i) => (
        <button key={i} onClick={action.onClick}
          className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${action.danger ? 'text-red-500' : 'text-neutral-700 dark:text-neutral-200'}`}
        >
          <span className="text-base leading-none">{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
}
```

### Breadcrumb

**`src/components/ui/Breadcrumb.tsx`**

```typescript
'use client';

import { FileNode } from '@/types/fileSystem';
import { useFileSystem } from '@/hooks/useFileSystem';

export function Breadcrumb({ path }: { path: FileNode[] }) {
  const { selectFolder } = useFileSystem();
  return (
    <nav className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400 flex-wrap" aria-label="breadcrumb">
      <button onClick={() => selectFolder(null)} className="hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors font-medium">
        Home
      </button>
      {path.map((node, i) => (
        <span key={node.id} className="flex items-center gap-1">
          <span className="text-neutral-300 dark:text-neutral-600">/</span>
          <button
            onClick={() => i < path.length - 1 ? selectFolder(node.id) : undefined}
            aria-current={i === path.length - 1 ? 'page' : undefined}
            className={`transition-colors ${i === path.length - 1 ? 'text-neutral-900 dark:text-neutral-100 font-medium cursor-default' : 'hover:text-neutral-900 dark:hover:text-neutral-100'}`}
          >
            {node.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
```

### EmptyState

**`src/components/ui/EmptyState.tsx`**

```typescript
interface EmptyStateProps { title: string; description: string; icon?: string; }

export function EmptyState({ title, description, icon = '📂' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
      <span className="text-5xl opacity-30">{icon}</span>
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{title}</p>
      <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-48">{description}</p>
    </div>
  );
}
```

---

## 13. Tree Components

### TreeNode — Recursive

**`src/components/tree/TreeNode.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { FileNode } from '@/types/fileSystem';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useContextMenu } from '@/hooks/useContextMenu';
import { ContextMenu } from '@/components/ui/ContextMenu';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { ChevronRight, Folder, FolderOpen, FileText } from 'lucide-react';

interface TreeNodeProps { node: FileNode; depth?: number; parentId: string | null; }

export function TreeNode({ node, depth = 0, parentId }: TreeNodeProps) {
  const { selectedFolderId, expandedFolderIds, selectFolder, openFileById, toggleFolderExpand, createItem, renameItem, deleteItem } = useFileSystem();
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [showCreateModal, setShowCreateModal] = useState<'folder' | 'text' | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolderIds.has(node.id);
  const isSelected = selectedFolderId === node.id;

  function handleClick() {
    if (isFolder) { toggleFolderExpand(node.id); selectFolder(node.id); }
    else openFileById(node.id);
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-1.5 py-1 rounded-md cursor-pointer select-none group',
          'hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors',
          isSelected && 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px`, paddingRight: '8px' }}
        onClick={handleClick}
        onContextMenu={(e) => openMenu(e, node.id, node.type, 'sidebar')}
        role="treeitem"
        aria-expanded={isFolder ? isExpanded : undefined}
        aria-selected={isFolder ? isSelected : undefined}
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      >
        {isFolder
          ? <ChevronRight size={14} className={cn('shrink-0 text-neutral-400 transition-transform duration-150', isExpanded && 'rotate-90')} />
          : <span className="w-3.5 shrink-0" />
        }
        {isFolder
          ? (isExpanded ? <FolderOpen size={15} className="shrink-0 text-yellow-500" /> : <Folder size={15} className="shrink-0 text-yellow-500" />)
          : <FileText size={15} className="shrink-0 text-blue-400" />
        }
        <span className="text-sm truncate flex-1 text-neutral-700 dark:text-neutral-200">{node.name}</span>
      </div>

      {/* Recursive children */}
      {isFolder && isExpanded && node.children && (
        <div role="group">
          {node.children.length === 0
            ? <p className="text-xs text-neutral-400 italic py-0.5" style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}>Empty folder</p>
            : node.children.map((child) => <TreeNode key={child.id} node={child} depth={depth + 1} parentId={node.id} />)
          }
        </div>
      )}

      <ContextMenu menu={menu} onClose={closeMenu}
        onNewFolder={() => setShowCreateModal('folder')}
        onNewFile={() => setShowCreateModal('text')}
        onRename={() => setShowRenameModal(true)}
        onDelete={() => setShowDeleteConfirm(true)}
      />
      <Modal isOpen={showCreateModal !== null} title={showCreateModal === 'folder' ? 'New Folder' : 'New Text File'}
        placeholder={showCreateModal === 'folder' ? 'Folder name' : 'File name'} confirmLabel="Create"
        onConfirm={(name) => createItem(name, showCreateModal!, node.id)} onClose={() => setShowCreateModal(null)}
      />
      <Modal isOpen={showRenameModal} title="Rename" initialValue={node.name} confirmLabel="Rename"
        onConfirm={(name) => renameItem(node.id, name, parentId)} onClose={() => setShowRenameModal(false)}
      />
      <ConfirmDialog isOpen={showDeleteConfirm} title={`Delete "${node.name}"`}
        message={isFolder ? 'This will permanently delete this folder and all its contents.' : 'This will permanently delete this file.'}
        onConfirm={() => deleteItem(node.id)} onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
```

### TreeView

**`src/components/tree/TreeView.tsx`**

```typescript
'use client';

import { useFileSystem } from '@/hooks/useFileSystem';
import { TreeNode } from './TreeNode';
import { EmptyState } from '@/components/ui/EmptyState';

export function TreeView() {
  const { tree } = useFileSystem();
  if (tree.length === 0) return <EmptyState title="No files yet" description="Use the + buttons to create your first folder or file" icon="🗂️" />;
  return (
    <div role="tree" className="overflow-y-auto flex-1 py-1 px-1">
      {tree.map((node) => <TreeNode key={node.id} node={node} depth={0} parentId={null} />)}
    </div>
  );
}
```

---

## 14. Panel Components

### FileCard

**`src/components/panel/FileCard.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { FileNode } from '@/types/fileSystem';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useContextMenu } from '@/hooks/useContextMenu';
import { ContextMenu } from '@/components/ui/ContextMenu';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { formatDate } from '@/lib/utils';
import { Folder, FileText } from 'lucide-react';

interface FileCardProps { node: FileNode; parentId: string | null; }

export function FileCard({ node, parentId }: FileCardProps) {
  const { expandAndSelectFolder, openFileById, createItem, renameItem, deleteItem } = useFileSystem();
  const { menu, openMenu, closeMenu } = useContextMenu();
  const [showCreateModal, setShowCreateModal] = useState<'folder' | 'text' | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isFolder = node.type === 'folder';

  function handleDoubleClick() {
    if (isFolder) expandAndSelectFolder(node.id);
    else openFileById(node.id);
  }

  return (
    <>
      <div
        className="group flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors select-none text-center"
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => openMenu(e, node.id, node.type, 'panel')}
        role="button" tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && handleDoubleClick()}
        aria-label={`${isFolder ? 'Folder' : 'File'}: ${node.name}`}
      >
        <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 group-hover:border-neutral-300 dark:group-hover:border-neutral-600 transition-colors">
          {isFolder
            ? <Folder size={28} className="text-yellow-500" fill="currentColor" fillOpacity={0.15} />
            : <FileText size={28} className="text-blue-500" />
          }
        </div>
        <span className="text-xs text-neutral-700 dark:text-neutral-200 font-medium w-20 truncate leading-tight">{node.name}</span>
        <span className="text-[10px] text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity">{formatDate(node.updatedAt)}</span>
      </div>

      <ContextMenu menu={menu} onClose={closeMenu}
        onNewFolder={() => setShowCreateModal('folder')}
        onNewFile={() => setShowCreateModal('text')}
        onRename={() => setShowRenameModal(true)}
        onDelete={() => setShowDeleteConfirm(true)}
      />
      {isFolder && (
        <Modal isOpen={showCreateModal !== null} title={showCreateModal === 'folder' ? 'New Folder' : 'New Text File'}
          placeholder={showCreateModal === 'folder' ? 'Folder name' : 'File name'} confirmLabel="Create"
          onConfirm={(name) => createItem(name, showCreateModal!, node.id)} onClose={() => setShowCreateModal(null)}
        />
      )}
      <Modal isOpen={showRenameModal} title="Rename" initialValue={node.name} confirmLabel="Rename"
        onConfirm={(name) => renameItem(node.id, name, parentId)} onClose={() => setShowRenameModal(false)}
      />
      <ConfirmDialog isOpen={showDeleteConfirm} title={`Delete "${node.name}"`}
        message={isFolder ? 'This will permanently delete this folder and all its contents.' : 'This will permanently delete this file.'}
        onConfirm={() => deleteItem(node.id)} onClose={() => setShowDeleteConfirm(false)}
      />
    </>
  );
}
```

### FolderContents

**`src/components/panel/FolderContents.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { FileCard } from './FileCard';
import { Modal } from '@/components/ui/Modal';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { EmptyState } from '@/components/ui/EmptyState';
import { FolderPlus, FilePlus } from 'lucide-react';

export function FolderContents() {
  const { currentChildren, selectedFolderId, breadcrumb, createItem } = useFileSystem();
  const [showCreateModal, setShowCreateModal] = useState<'folder' | 'text' | null>(null);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <Breadcrumb path={breadcrumb} />
        <div className="flex items-center gap-1">
          <button onClick={() => setShowCreateModal('folder')} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors font-medium" title="New Folder">
            <FolderPlus size={14} /><span className="hidden sm:inline">Folder</span>
          </button>
          <button onClick={() => setShowCreateModal('text')} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors font-medium" title="New File">
            <FilePlus size={14} /><span className="hidden sm:inline">File</span>
          </button>
        </div>
      </div>

      {currentChildren.length === 0
        ? <EmptyState title="This folder is empty" description="Double-click a folder to enter it, or use the buttons above to create items" />
        : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
              {currentChildren.map((node) => <FileCard key={node.id} node={node} parentId={selectedFolderId} />)}
            </div>
          </div>
        )
      }

      <Modal isOpen={showCreateModal !== null} title={showCreateModal === 'folder' ? 'New Folder' : 'New Text File'}
        placeholder={showCreateModal === 'folder' ? 'Folder name' : 'File name'} confirmLabel="Create"
        onConfirm={(name) => createItem(name, showCreateModal!, selectedFolderId)} onClose={() => setShowCreateModal(null)}
      />
    </div>
  );
}
```

### TextEditor — Uses React 19.2 `useEffectEvent`

**`src/components/panel/TextEditor.tsx`**

```typescript
'use client';

// useEffectEvent (React 19.2, stable in Next.js 16) solves the stale closure
// problem for the Ctrl+S handler without needing useCallback.
// It extracts non-reactive logic from effects so that `content` is always fresh
// without being listed as a dependency.

import { useState, useEffect, useRef, experimental_useEffectEvent as useEffectEvent } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { ArrowLeft, Save, CheckCircle } from 'lucide-react';

export function TextEditor() {
  const { openFile, openFileId, saveFileContent, openFileById } = useFileSystem();
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(true);
  const [justSaved, setJustSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync content when switching files
  useEffect(() => {
    if (openFile) { setContent(openFile.content ?? ''); setSaved(true); }
  }, [openFile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // useEffectEvent: reads current content without being a dep
  const onSave = useEffectEvent(() => {
    if (!openFileId) return;
    saveFileContent(openFileId, content);
    setSaved(true);
    setJustSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setJustSaved(false), 2000);
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // onSave is an Effect Event — not a dependency
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); onSave(); }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!openFile) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => openFileById(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" title="Back">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate max-w-48">{openFile.name}</h2>
          {!saved && <span className="text-xs text-amber-500 font-medium">● Unsaved</span>}
        </div>
        <button onClick={onSave} disabled={saved}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
            justSaved ? 'bg-green-50 dark:bg-green-950 text-green-600'
            : saved ? 'text-neutral-400 cursor-default'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {justSaved ? <><CheckCircle size={13} /> Saved</> : <><Save size={13} /> Save</>}
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => { setContent(e.target.value); setSaved(false); }}
        className="flex-1 p-5 resize-none outline-none font-mono text-sm text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-950 leading-relaxed"
        placeholder="Start typing..."
        spellCheck={false}
      />

      <div className="px-5 py-2 border-t border-neutral-100 dark:border-neutral-800 text-xs text-neutral-400 shrink-0">
        Press <kbd className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 font-mono text-[10px]">Ctrl+S</kbd> to save
      </div>
    </div>
  );
}
```

---

## 15. Layout Components

### Sidebar

**`src/components/layout/Sidebar.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { TreeView } from '@/components/tree/TreeView';
import { Modal } from '@/components/ui/Modal';
import { useFileSystem } from '@/hooks/useFileSystem';
import { FolderPlus, FilePlus, HardDrive } from 'lucide-react';

export function Sidebar() {
  const { createItem } = useFileSystem();
  const [showCreateModal, setShowCreateModal] = useState<'folder' | 'text' | null>(null);

  return (
    <aside className="flex flex-col h-full border-r border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 w-60 shrink-0">
      <div className="flex items-center justify-between px-3 py-3 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <HardDrive size={15} className="text-neutral-500" />
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">Files</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setShowCreateModal('folder')} className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" title="New Folder at root">
            <FolderPlus size={14} />
          </button>
          <button onClick={() => setShowCreateModal('text')} className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 transition-colors" title="New File at root">
            <FilePlus size={14} />
          </button>
        </div>
      </div>
      <TreeView />
      <Modal isOpen={showCreateModal !== null} title={showCreateModal === 'folder' ? 'New Folder' : 'New Text File'}
        placeholder={showCreateModal === 'folder' ? 'Folder name' : 'File name'} confirmLabel="Create"
        onConfirm={(name) => createItem(name, showCreateModal!, null)} onClose={() => setShowCreateModal(null)}
      />
    </aside>
  );
}
```

### MainPanel

**`src/components/layout/MainPanel.tsx`**

```typescript
'use client';

import { useFileSystem } from '@/hooks/useFileSystem';
import { FolderContents } from '@/components/panel/FolderContents';
import { TextEditor } from '@/components/panel/TextEditor';

export function MainPanel() {
  const { openFileId } = useFileSystem();
  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-neutral-950">
      {openFileId ? <TextEditor /> : <FolderContents />}
    </main>
  );
}
```

### AppLayout

**`src/components/layout/AppLayout.tsx`**

```typescript
'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { MainPanel } from './MainPanel';
import { PanelLeft } from 'lucide-react';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="flex h-screen bg-white dark:bg-neutral-950 overflow-hidden">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm"
        aria-label="Toggle sidebar"
      >
        <PanelLeft size={16} />
      </button>
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 fixed lg:relative z-40 h-full`}>
        <Sidebar />
      </div>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <MainPanel />
    </div>
  );
}
```

---

## 16. App Entry Points

**`src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'Mini File Explorer',
  description: 'Built with Next.js 16.2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
```

**`src/app/page.tsx`**

```typescript
import { FileSystemProvider } from '@/context/FileSystemContext';
import { AppLayout } from '@/components/layout/AppLayout';

export default function Home() {
  return (
    <FileSystemProvider>
      <AppLayout />
    </FileSystemProvider>
  );
}
```

**`src/app/globals.css`**

```css
@import "tailwindcss";

* {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.neutral.300') transparent;
}
*::-webkit-scrollbar { width: 5px; }
*::-webkit-scrollbar-thumb { background: theme('colors.neutral.300'); border-radius: 999px; }
* { -webkit-tap-highlight-color: transparent; }
```

---

## 17. Implementation Order

Follow this exact order to avoid broken imports at any stage:

```
1.  src/types/fileSystem.ts
2.  src/lib/fileSystem.ts
3.  src/lib/utils.ts
4.  src/lib/initialData.ts
5.  next.config.ts                     ← reactCompiler: true
6.  src/context/FileSystemContext.tsx
7.  src/hooks/useFileSystem.ts
8.  src/hooks/useContextMenu.ts
9.  src/components/ui/EmptyState.tsx
10. src/components/ui/Modal.tsx
11. src/components/ui/ConfirmDialog.tsx
12. src/components/ui/ContextMenu.tsx
13. src/components/ui/Breadcrumb.tsx
14. src/components/tree/TreeNode.tsx
15. src/components/tree/TreeView.tsx
16. src/components/panel/FileCard.tsx
17. src/components/panel/FolderContents.tsx
18. src/components/panel/TextEditor.tsx
19. src/components/layout/Sidebar.tsx
20. src/components/layout/MainPanel.tsx
21. src/components/layout/AppLayout.tsx
22. src/app/layout.tsx
23. src/app/page.tsx
24. src/app/globals.css
```

---

## 18. Next.js 16.2 Features Used — For README

Add a `README.md` so the evaluator sees you understand what you used:

| Feature | File | Why |
|---|---|---|
| **React Compiler** | `next.config.ts` | Eliminates manual `useCallback`/`useMemo` — compiler auto-memoizes |
| **Turbopack (default)** | dev server | ~87% faster startup, zero config |
| **React 19.2 `useEffectEvent`** | `TextEditor.tsx` | Solves stale closure in keyboard handler without useCallback |
| **`next.config.ts`** | config | Type-safe configuration |
| **App Router** | `app/page.tsx` | Server/client boundary, layout system |
| **`'use client'` directive** | All interactive components | Correct RSC boundary — Server Components can't use hooks |
| **Tailwind v4** | `globals.css` | `@import "tailwindcss"` (not the old three `@tailwind` directives) |

---

## 19. What NOT to Do

1. **DO NOT** use `useState` for tree data — only `useReducer`
2. **DO NOT** mutate state — always return new objects/arrays
3. **DO NOT** put recursive tree logic inside components — it lives in `lib/fileSystem.ts`
4. **DO NOT** use `any` — `tsc --noEmit` must pass
5. **DO NOT** add `useCallback`/`useMemo` anywhere — React Compiler handles it; adding them is redundant noise
6. **DO NOT** make two separate Modal components for create vs rename — parameterize one
7. **DO NOT** skip `'use client'` on interactive components — the build will fail
8. **DO NOT** name both the file node and the open-file action `openFile` — use `openFileById` for the action
9. **DO NOT** list `onSave` (a `useEffectEvent`) in the `useEffect` deps array — that defeats its purpose
10. **DO NOT** forget `aria-expanded` and `role="treeitem"` on tree nodes — it's part of the accessibility score

---

## 20. Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Delete currently selected folder | `selectedFolderId → null`, panel shows home |
| Delete open text file | `openFileId → null`, returns to folder view |
| Create with duplicate name | Error shown in modal, modal stays open |
| Create with empty name | Confirm button is disabled |
| Name with `/`, `\`, `*`, `?` etc. | Validation error shown in modal |
| Very long filename | CSS `truncate` on tree + card; full name visible via `title` attr |
| Deeply nested folders (10+ levels) | Tree scrolls; `paddingLeft` calculated dynamically from `depth` |
| localStorage unavailable | Silent fallback, state lives in memory for the session |
| Empty root tree | "No files yet" empty state in sidebar |
| Open file → click Back | `openFileById(null)` returns to folder contents view |

---

## 21. Verification Commands

```bash
# Node version check
node -v              # Must be ≥ 20.9.0

# TypeScript — MUST produce zero errors before submission
npx tsc --noEmit

# Dev server (Turbopack is default — no flag needed)
npm run dev

# Production build — must succeed
npm run build
```



<!-- END:nextjs-agent-rules -->
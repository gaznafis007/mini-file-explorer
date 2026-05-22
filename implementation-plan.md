# Mini File Explorer — Implementation Plan

> Cross-reference with `agents.md` (source of truth) at every step.
> This document tracks phases, per-file checklists, and verification gates.

---

## Current State (as of May 23, 2026)

| Item | Status |
|---|---|
| `next.config.ts` → `reactCompiler: true` | ✅ Done |
| `tsconfig.json` → `strict: true` | ✅ Done |
| `package.json` → `lucide-react`, `uuid`, `@types/uuid` | ✅ Done |
| `globals.css` → `@import "tailwindcss"` | ✅ Done (has extra boilerplate to strip in Phase 5) |
| `layout.tsx` | ❌ Still default create-next-app |
| `page.tsx` | ❌ Still default landing page |
| `src/types/` | ❌ Does not exist |
| `src/lib/` | ❌ Does not exist |
| `src/context/` | ❌ Does not exist |
| `src/hooks/` | ❌ Does not exist |
| `src/components/` | ❌ Does not exist |
| `README.md` | ❌ Not done |
| `next.config.ts` → `turbopackFileSystemCacheForDev` | ❌ Missing |

---

## Dependency Graph

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
(types,       (context,    (ui         (tree,       (page.tsx,
 lib)          hooks)       primitives) panel,       layout,
                                        layout)      globals,
                                                     README,
                                                     verify)
```

Every phase can be verified with `npx tsc --noEmit` before proceeding.
Phases 3 and 4 files within each phase have no cross-dependencies —
they can be created in a single pass in the order listed.

---

## Phase 1 — Foundation Layer (Zero React)

**Goal:** Pure TypeScript only. Types, pure algorithms, utilities, demo data.
No browser APIs, no React imports.
After this phase `tsc --noEmit` must pass on these four files.

**Also fix:** `next.config.ts` — add `experimental.turbopackFileSystemCacheForDev: true` (§3 of agents.md).

### Files

| # | agents.md §17 step | File | Description |
|---|---|---|---|
| 1 | Step 1 | `src/types/fileSystem.ts` | All TypeScript interfaces |
| 2 | Step 2 | `src/lib/fileSystem.ts` | Pure recursive algorithms |
| 3 | Step 3 | `src/lib/utils.ts` | `createNode`, `cn`, `formatDate` |
| 4 | Step 4 | `src/lib/initialData.ts` | Demo `INITIAL_TREE` |

### `src/types/fileSystem.ts` checklist

- [ ] `NodeType = 'folder' | 'text'`
- [ ] `FileNode` interface with `id`, `name`, `type`, `content?`, `children?`, `createdAt`, `updatedAt`
- [ ] `FileSystemState` with `tree`, `selectedFolderId`, `openFileId`, `expandedFolderIds: Set<string>`
- [ ] `FileSystemAction` discriminated union — all 8 variants:
  - `CREATE_NODE` · `DELETE_NODE` · `RENAME_NODE` · `UPDATE_FILE_CONTENT`
  - `SELECT_FOLDER` · `OPEN_FILE` · `TOGGLE_FOLDER_EXPAND` · `EXPAND_FOLDER` · `LOAD_STATE`
- [ ] `ContextMenuState` with `visible`, `x`, `y`, `targetId`, `targetType`, `location`
- [ ] Zero `any`

### `src/lib/fileSystem.ts` checklist

- [ ] No React imports — pure TypeScript only
- [ ] `findNode(tree, id)` — recursive, returns `FileNode | null`
- [ ] `getNodePath(tree, id)` — recursive, returns full path as `FileNode[]`
- [ ] `getChildren(tree, folderId | null)` — `null` returns root
- [ ] `insertNode(tree, parentId | null, newNode)` — immutable, recursive
- [ ] `renameNode(tree, id, newName)` — updates `updatedAt`, immutable
- [ ] `updateFileContent(tree, id, content)` — updates `updatedAt`, immutable
- [ ] `deleteNode(tree, id)` — filter + recursive map, immutable
- [ ] `nameExistsInFolder(tree, parentId, name, excludeId?)` — case-insensitive
- [ ] `isValidName(name)` — rejects empty + invalid chars `<>:"/\|?*` and control chars

### `src/lib/utils.ts` checklist

- [ ] `createNode(name, type)` uses `uuidv4()`, sets `createdAt`/`updatedAt` to `Date.now()`
- [ ] `content` set to `''` for text nodes, `undefined` for folders
- [ ] `children` set to `[]` for folders, `undefined` for text nodes
- [ ] `cn(...classes)` filters falsy and joins
- [ ] `formatDate(ts)` uses `Intl.DateTimeFormat` — `month: 'short', day: 'numeric', year: 'numeric'`

### `src/lib/initialData.ts` checklist

- [ ] `INITIAL_TREE: FileNode[]` exported
- [ ] Documents folder → Work subfolder → Project Brief + Meeting Notes files
- [ ] Documents folder → Resume file
- [ ] Projects folder → Web App subfolder → README file
- [ ] Quick Notes file at root
- [ ] All nodes use static id strings (not uuid — for determinism)

### Phase 1 verification

```bash
npx tsc --noEmit   # zero errors
```

---

## Phase 2 — State Layer

**Goal:** `useReducer` + context + consumer hooks. No UI rendered yet —
but the entire state machine is complete and type-safe.

### Files

| # | agents.md §17 step | File | Description |
|---|---|---|---|
| 5 | Step 5 (config) | `next.config.ts` | Add turbopack experimental flag |
| 6 | Step 6 | `src/context/FileSystemContext.tsx` | Reducer + Provider + localStorage |
| 7 | Step 7 | `src/hooks/useFileSystem.ts` | Consumer hook with derived state |
| 8 | Step 8 | `src/hooks/useContextMenu.ts` | Right-click menu state hook |

### `next.config.ts` checklist

- [ ] `reactCompiler: true` (already done)
- [ ] `experimental.turbopackFileSystemCacheForDev: true` (add this)

### `src/context/FileSystemContext.tsx` checklist

- [ ] `'use client'` at top (line 1)
- [ ] React Compiler comment block (second block, before imports)
- [ ] `getInitialState()` returns clean state with `new Set<string>()`
- [ ] `fileSystemReducer` — exhaustive `switch` covering all 8+ action types
  - `CREATE_NODE` — calls `insertNode`, auto-expands parent if `parentId` is not null
  - `DELETE_NODE` — calls `deleteNode`, clears `selectedFolderId` and `openFileId` if they match deleted id
  - `RENAME_NODE` — calls `renameNode`
  - `UPDATE_FILE_CONTENT` — calls `updateFileContent`
  - `SELECT_FOLDER` — sets `selectedFolderId`, clears `openFileId`
  - `OPEN_FILE` — sets `openFileId`
  - `TOGGLE_FOLDER_EXPAND` — `Set` add or delete
  - `EXPAND_FOLDER` — `Set` add only
  - `LOAD_STATE` — replaces `tree` and `selectedFolderId`
  - `default` — returns state unchanged
- [ ] `FileSystemProvider` uses lazy init (`useReducer(reducer, undefined, initFn)`)
- [ ] Lazy init reads `localStorage`, handles `JSON.parse` errors silently
- [ ] `expandedFolderIds` reconstructed as `new Set<string>(parsed.expandedFolderIds ?? [])`
- [ ] `useEffect` persists to `localStorage` on `[state.tree, state.selectedFolderId, state.expandedFolderIds]`
- [ ] `Set` serialized as spread array `[...state.expandedFolderIds]`
- [ ] Both `try/catch` blocks are silent (no `console.error`)
- [ ] `FileSystemContext` exported (used by `useFileSystem`)
- [ ] `FileSystemProvider` exported (used by `page.tsx`)
- [ ] Zero `useCallback` / `useMemo`

### `src/hooks/useFileSystem.ts` checklist

- [ ] `'use client'` at top
- [ ] React Compiler comment
- [ ] Throws if used outside `FileSystemProvider`
- [ ] Derived state computed inline (no `useMemo`):
  - `selectedFolder: FileNode | null`
  - `openFile: FileNode | null` ← the **node**, not the action
  - `currentChildren: FileNode[]`
  - `breadcrumb: FileNode[]` (empty array when no folder selected)
- [ ] All action functions are plain `function` declarations (no arrow functions at top level):
  - `createItem(name, type, parentId)` → validates name + duplicate → returns `string | null` error
  - `renameItem(id, newName, parentId)` → validates + duplicate with `excludeId` → returns `string | null`
  - `deleteItem(id)` → dispatches `DELETE_NODE`
  - `saveFileContent(id, content)` → dispatches `UPDATE_FILE_CONTENT`
  - `selectFolder(id)` → dispatches `SELECT_FOLDER`
  - `openFileById(id)` → dispatches `OPEN_FILE` ← **named `openFileById`**, not `openFile`
  - `toggleFolderExpand(id)` → dispatches `TOGGLE_FOLDER_EXPAND`
  - `expandAndSelectFolder(id)` → dispatches `EXPAND_FOLDER` then `SELECT_FOLDER`
- [ ] Return object includes both `openFile` (node) and `openFileById` (action) — different names

### `src/hooks/useContextMenu.ts` checklist

- [ ] `'use client'` at top
- [ ] `INITIAL` constant for default state
- [ ] `openMenu(e, targetId, targetType, location)` — calls `e.preventDefault()` + `e.stopPropagation()`
- [ ] `closeMenu()` resets to `INITIAL`
- [ ] `useEffect` adds `click` + `contextmenu` listeners on `window` when `menu.visible`
- [ ] Cleanup removes both listeners
- [ ] Effect only runs when `[menu.visible]` changes

### Phase 2 verification

```bash
npx tsc --noEmit   # zero errors
```

---

## Phase 3 — UI Primitives

**Goal:** All reusable leaf components that tree, panel, and layout components depend on.
Pure UI — no business logic beyond what props provide.

### Files

| # | agents.md §17 step | File | Description |
|---|---|---|---|
| 9 | Step 9 | `src/components/ui/EmptyState.tsx` | Icon + title + description |
| 10 | Step 10 | `src/components/ui/Modal.tsx` | Reusable create + rename modal |
| 11 | Step 11 | `src/components/ui/ConfirmDialog.tsx` | Delete confirmation |
| 12 | Step 12 | `src/components/ui/ContextMenu.tsx` | Right-click menu |
| 13 | Step 13 | `src/components/ui/Breadcrumb.tsx` | Navigation path |

### `EmptyState.tsx` checklist

- [ ] No `'use client'` — stateless, no hooks
- [ ] Props: `title: string`, `description: string`, `icon?: string` (default `'📂'`)
- [ ] Centred flex column layout, `h-full`
- [ ] Icon at 5xl, 30% opacity

### `Modal.tsx` checklist

- [ ] `'use client'`
- [ ] Props: `isOpen`, `title`, `initialValue?`, `placeholder?`, `confirmLabel?`, `onConfirm`, `onClose`
- [ ] `onConfirm(value)` returns `string` (error message) or `null` (success → close)
- [ ] `useEffect` resets value + error + calls `inputRef.current?.select()` with 50ms delay when `isOpen` changes
- [ ] Returns `null` when `!isOpen` (not rendered to DOM)
- [ ] Enter key → `handleConfirm()`, Escape key → `onClose()`
- [ ] Confirm button `disabled={!value.trim()}`
- [ ] Error message in red below input when present
- [ ] Border turns red on error
- [ ] Backdrop click closes modal, inner div `stopPropagation`
- [ ] `backdrop-blur-sm` on overlay

### `ConfirmDialog.tsx` checklist

- [ ] `'use client'`
- [ ] Props: `isOpen`, `title`, `message`, `confirmLabel?` (default `'Delete'`), `danger?` (default `true`), `onConfirm`, `onClose`
- [ ] Returns `null` when `!isOpen`
- [ ] Confirm button calls both `onConfirm()` and `onClose()` together
- [ ] `danger=true` → red button, `danger=false` → blue button
- [ ] Backdrop click closes

### `ContextMenu.tsx` checklist

- [ ] `'use client'`
- [ ] Returns `null` when `!menu.visible`
- [ ] Actions built dynamically: folders get "New Folder" + "New Text File" + "Rename" + "Delete"; files get only "Rename" + "Delete"
- [ ] Position clamped: `top: Math.min(menu.y, window.innerHeight - ...)`, `left: Math.min(menu.x, window.innerWidth - 180)`
- [ ] Uses `position: 'fixed'` via inline style
- [ ] Delete item styled in red (`text-red-500`)
- [ ] Each action calls its prop + `onClose()` on click
- [ ] Outer div has `stopPropagation` on click

### `Breadcrumb.tsx` checklist

- [ ] `'use client'` (uses `useFileSystem`)
- [ ] `<nav aria-label="breadcrumb">` semantic wrapper
- [ ] "Home" button always present, calls `selectFolder(null)`
- [ ] Each path segment has `/` separator
- [ ] All segments except last are clickable → `selectFolder(node.id)`
- [ ] Last segment has `aria-current="page"` and `cursor-default`
- [ ] `flex-wrap` for long paths

### Phase 3 verification

```bash
npx tsc --noEmit   # zero errors
```

---

## Phase 4 — Feature Components

**Goal:** All interactive components — tree, panel, layout.
After this phase the full app is functional.

### Files

| # | agents.md §17 step | File | Description |
|---|---|---|---|
| 14 | Step 14 | `src/components/tree/TreeNode.tsx` | Recursive tree item |
| 15 | Step 15 | `src/components/tree/TreeView.tsx` | Root tree container |
| 16 | Step 16 | `src/components/panel/FileCard.tsx` | Icon grid card |
| 17 | Step 17 | `src/components/panel/FolderContents.tsx` | Main panel folder view |
| 18 | Step 18 | `src/components/panel/TextEditor.tsx` | Text editor with useEffectEvent |
| 19 | Step 19 | `src/components/layout/Sidebar.tsx` | Left sidebar |
| 20 | Step 20 | `src/components/layout/MainPanel.tsx` | Right main panel |
| 21 | Step 21 | `src/components/layout/AppLayout.tsx` | Root layout shell |

### `TreeNode.tsx` checklist

- [ ] `'use client'`
- [ ] Props: `node: FileNode`, `depth?: number` (default 0), `parentId: string | null`
- [ ] Calls `useFileSystem()` and `useContextMenu()`
- [ ] Local state: `showCreateModal: 'folder' | 'text' | null`, `showRenameModal: boolean`, `showDeleteConfirm: boolean`
- [ ] `paddingLeft: depth * 12 + 8` calculated inline via style prop
- [ ] `role="treeitem"` on the row div
- [ ] `aria-expanded={isFolder ? isExpanded : undefined}` — only on folders
- [ ] `aria-selected={isFolder ? isSelected : undefined}` — only on folders
- [ ] `tabIndex={0}` + `onKeyDown` Enter triggers click
- [ ] Chevron icon rotates 90° when expanded (`rotate-90` class)
- [ ] `FolderOpen` vs `Folder` icon based on `isExpanded`
- [ ] `FileText` icon for files
- [ ] Click: folders → `toggleFolderExpand` + `selectFolder`; files → `openFileById`
- [ ] Selected state: `bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300`
- [ ] Recursive: renders children as `<TreeNode depth={depth + 1} parentId={node.id} />`
- [ ] Empty folder shows italic "Empty folder" message (not empty state component)
- [ ] Children wrapped in `role="group"` div
- [ ] `ContextMenu` + both `Modal`s + `ConfirmDialog` rendered inside the fragment
- [ ] Create modal uses `node.id` as `parentId`
- [ ] Rename modal uses `node.name` as `initialValue`, `parentId` prop for duplicate check
- [ ] Zero `useCallback`

### `TreeView.tsx` checklist

- [ ] `'use client'`
- [ ] `role="tree"` on container div
- [ ] Empty tree → `<EmptyState>` with "No files yet" + `icon="🗂️"`
- [ ] Maps `tree` root nodes to `<TreeNode depth={0} parentId={null} />`

### `FileCard.tsx` checklist

- [ ] `'use client'`
- [ ] Props: `node: FileNode`, `parentId: string | null`
- [ ] **Double-click** (not single) to navigate/open: folders → `expandAndSelectFolder`, files → `openFileById`
- [ ] `onContextMenu` → `openMenu`
- [ ] `role="button"` + `tabIndex={0}` + Enter key triggers double-click action
- [ ] `aria-label="Folder: name"` or `"File: name"`
- [ ] 56×56px icon container, rounded-xl
- [ ] Folder icon: `fill="currentColor" fillOpacity={0.15}` for subtle fill
- [ ] Filename truncated to `w-20`
- [ ] Date shown only on hover (`opacity-0 group-hover:opacity-100`)
- [ ] Create modal only rendered when `isFolder` (can't create inside a file)

### `FolderContents.tsx` checklist

- [ ] `'use client'`
- [ ] Header row: `<Breadcrumb>` left, New Folder + New File buttons right
- [ ] Button labels hidden on small screens: `hidden sm:inline`
- [ ] Grid: `grid-cols-[repeat(auto-fill,minmax(96px,1fr))]`
- [ ] Empty children → `<EmptyState>` with "This folder is empty"
- [ ] Create modal uses `selectedFolderId` as `parentId`

### `TextEditor.tsx` checklist

- [ ] `'use client'`
- [ ] Import: `experimental_useEffectEvent as useEffectEvent` from `'react'`
- [ ] Comment block explaining `useEffectEvent` at top of file (agents.md §14 verbatim)
- [ ] `useEffect` syncs content when `openFile?.id` changes (not `openFile` object)
- [ ] `eslint-disable-line react-hooks/exhaustive-deps` comment on that effect
- [ ] `onSave = useEffectEvent(...)` captures `content` without being a dep
- [ ] Ctrl+S / Cmd+S `useEffect` has empty deps array `[]`
- [ ] `eslint-disable-next-line react-hooks/exhaustive-deps` before that effect
- [ ] **`onSave` is NOT in the `useEffect` deps array** (this is the whole point)
- [ ] `timerRef` for "just saved" timeout cleanup
- [ ] Returns `null` when `!openFile`
- [ ] Back button → `openFileById(null)`
- [ ] Three button states: Unsaved (amber dot in header), Save (blue), Saved (green + CheckCircle)
- [ ] `<textarea>` with `font-mono`, `resize-none`, `spellCheck={false}`
- [ ] Status bar: Ctrl+S hint with `<kbd>` styling

### `Sidebar.tsx` checklist

- [ ] `'use client'`
- [ ] `<aside>` semantic element (not `<div>`)
- [ ] `w-60 shrink-0` fixed width
- [ ] `HardDrive` icon + "FILES" uppercase label
- [ ] New Folder + New File icon buttons in header (create at root → `parentId: null`)
- [ ] `<TreeView>` fills remaining height
- [ ] Create modal with `parentId: null`

### `MainPanel.tsx` checklist

- [ ] `'use client'`
- [ ] `<main>` semantic element (not `<div>`)
- [ ] `flex-1` takes remaining width
- [ ] `openFileId` truthy → `<TextEditor>`, else → `<FolderContents>`

### `AppLayout.tsx` checklist

- [ ] `'use client'`
- [ ] `sidebarOpen` state (default `true`)
- [ ] Mobile toggle button: `lg:hidden fixed top-3 left-3 z-50`
- [ ] Sidebar div: `translate-x-0` when open, `-translate-x-full` when closed, `lg:translate-x-0` always
- [ ] Sidebar position: `fixed lg:relative z-40`
- [ ] Overlay: `fixed inset-0 z-30 bg-black/20 lg:hidden` — shown when sidebar open on mobile
- [ ] `PanelLeft` icon for toggle button
- [ ] `aria-label="Toggle sidebar"` on button
- [ ] `overflow-hidden` on root div

### Phase 4 verification

```bash
npx tsc --noEmit   # zero errors
npm run dev        # visual check — app should be fully functional
```

---

## Phase 5 — Wire-Up, Polish & Final Verification

**Goal:** Connect the app entry points, clean up scaffold defaults,
write README for evaluator, pass all verification commands.

### Files

| # | agents.md §17 step | File | What changes |
|---|---|---|---|
| 22 | Step 22 | `src/app/layout.tsx` | Update metadata, fix body className |
| 23 | Step 23 | `src/app/page.tsx` | Replace with FileSystemProvider + AppLayout |
| 24 | Step 24 | `src/app/globals.css` | Strip defaults, apply spec scrollbar rules |
| 25 | — | `README.md` | Feature table per §18 |

### `layout.tsx` checklist

- [ ] `metadata.title` → `"Mini File Explorer"`
- [ ] `metadata.description` → `"Built with Next.js 16.2"`
- [ ] `<body>` className → `"antialiased font-sans"` only (no `min-h-full`, no `flex flex-col`)
- [ ] `<html>` → `lang="en"`, both font variables in className
- [ ] No `Readonly<>` wrapper on children type (matches spec)

### `page.tsx` checklist

- [ ] No `'use client'` — Server Component wrapping client tree is the correct pattern
- [ ] Imports: `FileSystemProvider` from `@/context/FileSystemContext`, `AppLayout` from `@/components/layout/AppLayout`
- [ ] Returns `<FileSystemProvider><AppLayout /></FileSystemProvider>`
- [ ] No other content — replaces the entire default page

### `globals.css` checklist

- [ ] `@import "tailwindcss"` stays (first line)
- [ ] Remove all: `:root {}`, `@theme {}`, `@media {}`, `body {}` default blocks
- [ ] Add scrollbar rules:
  ```css
  * { scrollbar-width: thin; scrollbar-color: theme('colors.neutral.300') transparent; }
  *::-webkit-scrollbar { width: 5px; }
  *::-webkit-scrollbar-thumb { background: theme('colors.neutral.300'); border-radius: 999px; }
  * { -webkit-tap-highlight-color: transparent; }
  ```

### `README.md` checklist (§18)

- [ ] Title: "Mini File Explorer"
- [ ] Table of Next.js 16.2 features used:
  - React Compiler → `next.config.ts` → eliminates manual `useCallback`/`useMemo`
  - Turbopack (default) → dev server → ~87% faster startup
  - React 19.2 `useEffectEvent` → `TextEditor.tsx` → stale closure fix
  - `next.config.ts` → type-safe config (`.ts` not `.js`)
  - App Router → `app/page.tsx` → server/client boundary
  - `'use client'` directive → all interactive components → correct RSC boundary
  - Tailwind v4 → `globals.css` → `@import "tailwindcss"` syntax

### Final verification

```bash
# Node version
node -v              # Must be ≥ 20.9.0

# TypeScript — must produce zero errors
npx tsc --noEmit

# Production build — must succeed
npm run build

# Dev server — visual check
npm run dev
```

---

## Edge Case Verification Checklist (§20)

Go through each manually after `npm run dev`:

- [ ] Delete currently selected folder → `selectedFolderId` becomes `null`, panel shows home
- [ ] Delete currently open file → `openFileId` becomes `null`, returns to folder view
- [ ] Create item with duplicate name in same folder → error shown in modal, modal stays open
- [ ] Create item with empty name → Confirm button is disabled (not just visually — actually can't submit)
- [ ] Create item with name containing `/`, `\`, `*`, `?`, `<`, `>`, `:`, `"`, `|` → validation error in modal
- [ ] Very long filename → `truncate` applied in tree node label and file card name
- [ ] Deeply nested folders (10+ levels) → `paddingLeft` scales correctly, tree scrolls
- [ ] `localStorage` unavailable (e.g. private browsing) → silent fallback, state works in memory
- [ ] Empty root tree (delete everything) → "No files yet" empty state appears in sidebar
- [ ] Open file → click Back button → returns to folder contents view
- [ ] Mobile: sidebar toggle button visible, sidebar slides in/out, overlay dismisses it

---

## §19 "What NOT to Do" — Enforcement Map

| Rule | Phase | How enforced |
|---|---|---|
| No `useState` for tree data — only `useReducer` | 2 | Reducer owns all tree state |
| No state mutation — always return new objects/arrays | 2 | Immutable spread in all reducer cases |
| No recursive tree logic inside components | 1 | All algorithms live in `lib/fileSystem.ts` |
| No `any` — `tsc --noEmit` must pass | All | TypeScript strict mode catches it |
| No `useCallback` / `useMemo` — compiler handles it | 2, 3, 4 | React Compiler comment explains absence |
| One `Modal` component only — parameterized | 3 | Single `Modal.tsx` with `title`/`confirmLabel`/`initialValue` |
| No missing `'use client'` on interactive components | 3, 4 | Every component with hooks/handlers listed |
| `openFileById` for the action, `openFile` for the node | 2 | Hook return object has both, different names |
| `onSave` (useEffectEvent) NOT in deps array | 4 | TextEditor checklist item |
| `aria-expanded` + `role="treeitem"` on tree nodes | 4 | TreeNode checklist items |

---

## Rubric Coverage Map (§0)

| Rubric Point | Phase that covers it | Key files |
|---|---|---|
| Semantic HTML (`<aside>`, `<main>`, ARIA) | 4 | `Sidebar`, `MainPanel`, `TreeNode`, `Breadcrumb` |
| Tailwind only, responsive layout | 3, 4 | All components + `AppLayout` mobile toggle |
| App Router + `'use client'` on every interactive component | 2, 3, 4 | All client files |
| `useEffectEvent` (React 19.2) | 4 | `TextEditor.tsx` |
| Single `useReducer` + typed discriminated action union | 2 | `FileSystemContext.tsx` |
| Zero `useState` for tree data | 2 | `FileSystemContext.tsx` |
| Pure recursive tree algorithms — immutable, unlimited depth | 1 | `lib/fileSystem.ts` |
| `tsc --noEmit` zero errors, zero `any` | All | TypeScript strict + verify step |
| React Compiler enabled, no manual `useCallback` | 1 (config), 2, 3, 4 | `next.config.ts` + all hooks/components |
| One `Modal` for create + rename | 3 | `Modal.tsx` |
| One `ContextMenu` for sidebar + panel | 3 | `ContextMenu.tsx` |
| `TreeNode` recursive | 4 | `TreeNode.tsx` |

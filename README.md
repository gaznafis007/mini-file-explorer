# Mini File Explorer

A browser-based file explorer built with **Next.js 16.2**, **React 19.2**, and **TypeScript**. Browse a nested folder tree, manage files and folders, and edit text documents — all in a split-panel interface with persistent local storage.

**Live demo:** [mini-file-explorer-seven.vercel.app](https://mini-file-explorer-seven.vercel.app/)  
**Repository:** [github.com/gaznafis007/mini-file-explorer](https://github.com/gaznafis007/mini-file-explorer)

---

## Overview

Mini File Explorer is a front-end task application that demonstrates modern React patterns, accessible UI, and immutable tree algorithms. The app runs entirely in the browser: file data is stored in `localStorage`, so your tree survives page refreshes without a backend.

The layout follows a familiar desktop pattern — a collapsible sidebar for navigation and a main panel for folder contents or an in-app text editor.

---

## Features & Rubric Coverage

This project was built against a structured evaluation rubric. The table below maps each requirement to how it is implemented in the app.

| Rubric area | Implementation |
|---|---|
| **Frontend fundamentals** | Semantic HTML (`<aside>`, `<main>`, `<nav>`), ARIA tree roles, Tailwind-only styling, responsive mobile sidebar |
| **React / Next.js** | App Router, Server/Client boundaries, React 19.2 `useEffectEvent` for keyboard save |
| **State management** | Single `useReducer` with a typed discriminated action union; no `useState` for tree data |
| **UI structure** | Sidebar tree + main panel, breadcrumb navigation, shared context menus, text editor |
| **Problem solving** | Pure recursive algorithms in `src/lib/fileSystem.ts` — immutable updates, unlimited depth |
| **Clean code** | Strict TypeScript (`tsc --noEmit` passes), zero `any`, React Compiler enabled |
| **Reusable components** | One `Modal` (create + rename), one `ContextMenu` (sidebar + panel), recursive `TreeNode` |

---

## UI & Interactions

### Layout

- **Sidebar** — hierarchical file tree with expand/collapse, selection highlighting, and root-level create buttons
- **Main panel** — icon grid for the current folder, or a full-height text editor when a file is open
- **Breadcrumb** — click any segment to navigate up the folder path; “Home” returns to the root view
- **Mobile** — sidebar slides in/out with a toggle button and backdrop overlay (`lg` breakpoint and above keeps the sidebar visible)

### Creating items

| Location | How |
|---|---|
| Sidebar header | `+` folder / `+` file buttons — creates at the **root** |
| Folder view header | “Folder” / “File” buttons — creates inside the **currently selected** folder |
| Context menu (folder) | Right-click a folder → **New Folder** or **New Text File** |
| Validation | Empty names are blocked; duplicate names and invalid characters (`/ \ * ? < > : " \|`) show an inline error in the modal |

### Renaming items

| Location | How |
|---|---|
| Sidebar tree | Hover a row → pencil icon, or right-click → **Rename** |
| Main panel grid | Hover a card → pencil icon (top-right), or right-click → **Rename** |
| Modal | Pre-filled with the current name; same validation rules as create |

### Deleting items

| Location | How |
|---|---|
| Sidebar tree | Hover a row → trash icon, or right-click → **Delete** |
| Main panel grid | Hover a card → trash icon, or right-click → **Delete** |
| Confirmation | A dialog warns before permanent deletion; deleting a folder removes all nested contents |

### Opening & editing files

- **Sidebar** — single-click a text file to open it in the editor
- **Main panel** — double-click a file card to open it
- **Editor** — edit content in a monospace textarea; **Save** button or **Ctrl+S** / **Cmd+S** to persist
- **Back** — arrow in the editor header returns to the folder view

### Other UX details

- Modals render via a **React portal** so dialogs always appear centered on the viewport (not clipped by the sidebar)
- Empty states for an empty root tree and empty folders
- Selected folder syncs between sidebar and main panel
- State persisted to `localStorage` under `mini-file-explorer-v1`

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| UI | React 19.2, Tailwind CSS v4 |
| Language | TypeScript (strict) |
| Icons | lucide-react |
| IDs | uuid |
| State | React Context + `useReducer` (no external state library) |

---

## Getting Started

**Requirements:** Node.js ≥ 20.9.0

```bash
git clone https://github.com/gaznafis007/mini-file-explorer.git
cd mini-file-explorer
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Type-check without emitting files |

---

## Project Structure

```
src/
├── app/                 # Next.js App Router entry (layout, page, globals)
├── components/
│   ├── layout/          # AppLayout, Sidebar, MainPanel
│   ├── tree/            # TreeView, TreeNode (recursive)
│   ├── panel/           # FolderContents, FileCard, TextEditor
│   └── ui/              # Modal, ContextMenu, Breadcrumb, ConfirmDialog, EmptyState
├── context/             # FileSystemProvider + reducer
├── hooks/               # useFileSystem, useContextMenu
├── lib/                 # Pure tree algorithms, utils, initial demo data
└── types/               # TypeScript interfaces and action union
```

Tree mutations (`insert`, `rename`, `delete`, `find`, etc.) live in `src/lib/fileSystem.ts` as pure functions — components never mutate state directly.

---

## Next.js 16.2 Features Used

| Feature | Where | Purpose |
|---|---|---|
| **React Compiler** | `next.config.ts` | Automatic memoization — no manual `useCallback` / `useMemo` |
| **Turbopack** | dev server | Faster local development, zero extra config |
| **React 19.2 `useEffectEvent`** | `TextEditor.tsx` | Fresh Ctrl+S handler without stale closures |
| **Type-safe config** | `next.config.ts` | `.ts` config instead of `.js` |
| **App Router** | `app/page.tsx` | Server Component wraps client provider + layout |
| **`'use client'`** | Interactive components | Correct React Server Components boundary |
| **Tailwind v4** | `globals.css` | `@import "tailwindcss"` (v4 syntax) |

---

## License

Private task project. See repository for details.

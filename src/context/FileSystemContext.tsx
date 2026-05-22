'use client';

// React Compiler enabled in next.config.ts — useCallback/useMemo intentionally omitted.
// The compiler handles all memoization automatically.

import { createContext, useReducer, useEffect, ReactNode, Dispatch } from 'react';
import { FileSystemState, FileSystemAction } from '@/types/fileSystem';
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

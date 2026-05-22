'use client';

// React Compiler enabled — no useCallback wrappers needed

import { useContext } from 'react';
import { FileSystemContext } from '@/context/FileSystemContext';
import { NodeType } from '@/types/fileSystem';
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

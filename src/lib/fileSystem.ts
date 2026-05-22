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

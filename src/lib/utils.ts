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
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(ts));
}

import { FileNode } from '@/types/fileSystem';

export const INITIAL_TREE: FileNode[] = [
  {
    id: 'folder-1',
    name: 'Documents',
    type: 'folder',
    children: [
      {
        id: 'folder-1-1',
        name: 'Work',
        type: 'folder',
        children: [
          {
            id: 'file-1-1-1',
            name: 'Project Brief',
            type: 'text',
            content: '# Project Brief\n\nThis document outlines the project scope.',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: 'file-1-1-2',
            name: 'Meeting Notes',
            type: 'text',
            content: '# Meeting Notes\n\n## January 2026\n- Discussed scope\n- Assigned next steps',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: 'file-1-2',
        name: 'Resume',
        type: 'text',
        content: '# My Resume\n\n## Experience\nSoftware Engineer...',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'folder-2',
    name: 'Projects',
    type: 'folder',
    children: [
      {
        id: 'folder-2-1',
        name: 'Web App',
        type: 'folder',
        children: [
          {
            id: 'file-2-1-1',
            name: 'README',
            type: 'text',
            content: '# Web App\n\nGetting started guide...',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'file-3',
    name: 'Quick Notes',
    type: 'text',
    content: 'Personal quick notes...',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

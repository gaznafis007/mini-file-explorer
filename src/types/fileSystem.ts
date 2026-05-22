export type NodeType = 'folder' | 'text';

export interface FileNode {
  id: string;
  name: string;
  type: NodeType;
  content?: string; // text files only
  children?: FileNode[]; // folders only
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

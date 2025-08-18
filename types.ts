
export interface FileNode {
  type: 'file';
  name: string;
  path: string;
  content?: string; // Content is loaded on demand, not stored in the tree
  sha: string;
}

export interface DirectoryNode {
  type: 'directory';
  name: string;
  path: string;
  children: { [key: string]: FileSystemNode };
}

export type FileSystemNode = FileNode | DirectoryNode;


export enum ChatMessageSender {
  User = 'user',
  AI = 'ai',
  System = 'system',
}

export interface ChatMessage {
  id: string;
  sender: ChatMessageSender;
  text: string;
}

export interface SelectedFile {
    path: string;
    content: string;
    sha: string;
}

export interface RepoInfo {
  owner: string;
  repo: string;
  branch?: string;
}

export interface GitTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
  url: string;
}

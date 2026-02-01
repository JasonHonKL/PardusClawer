export interface Workspace {
  uuid: string;
  title: string;
  path: string;
}

export interface WorkspaceFile {
  name: string;
  path: string;
  size?: number;
}

export interface WorkspaceFiles {
  uuid: string;
  files: string[];
}

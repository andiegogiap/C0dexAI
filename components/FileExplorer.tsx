import React from 'react';
import { FileSystemNode, DirectoryNode } from '../types';
import { FolderIcon, FileTextIcon, PythonIcon, JsonIcon, MarkdownIcon, JsIcon, CsvIcon } from './icons/FileIcons';

interface FileExplorerProps {
  nodes: { [key: string]: FileSystemNode };
  onSelectNode: (path: string, type: 'tree' | 'blob') => void;
}

const getFileIcon = (fileName: string): React.ReactNode => {
    if (fileName.endsWith('.py')) return <PythonIcon />;
    if (fileName.endsWith('.json')) return <JsonIcon />;
    if (fileName.endsWith('.md')) return <MarkdownIcon />;
    if (fileName.endsWith('.js') || fileName.endsWith('.tsx') || fileName.endsWith('.ts')) return <JsIcon />;
    if (fileName.endsWith('.csv')) return <CsvIcon />;
    return <FileTextIcon />;
};

const ExplorerNode: React.FC<{ node: FileSystemNode; onSelectNode: (path: string, type: 'tree' | 'blob') => void; level: number; }> = ({ node, onSelectNode, level }) => {
  const [isOpen, setIsOpen] = React.useState(level < 1);

  const handleSelect = () => {
    if (node.type === 'directory') {
        onSelectNode(node.path, 'tree');
        setIsOpen(!isOpen);
    } else {
        onSelectNode(node.path, 'blob');
    }
  };

  const indentation = { paddingLeft: `${level * 1.5}rem` };
  
  const commonClasses = "flex items-center gap-2 p-2 cursor-pointer rounded-md transition-all duration-200";
  const hoverClasses = "hover:bg-cyan-400/20 hover:text-cyan-300";

  if (node.type === 'directory') {
    return (
      <div>
        <div onClick={handleSelect} style={indentation} className={`${commonClasses} ${hoverClasses}`}>
          <FolderIcon isOpen={isOpen} />
          <span className="truncate">{node.name}</span>
        </div>
        {isOpen && (
          <ExplorerSubTree
            childrenNodes={node.children}
            onSelectNode={onSelectNode}
            level={level + 1}
          />
        )}
      </div>
    );
  }

  return (
    <div onClick={handleSelect} style={indentation} className={`${commonClasses} ${hoverClasses}`}>
      {getFileIcon(node.name)}
      <span className="truncate">{node.name}</span>
    </div>
  );
};

const ExplorerSubTree: React.FC<{childrenNodes: { [key: string]: FileSystemNode }, onSelectNode: (path: string, type: 'tree' | 'blob') => void, level: number}> = ({childrenNodes, onSelectNode, level}) => {
    const sortedNodes = Object.values(childrenNodes).sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <>
        {sortedNodes.map(node => (
            <ExplorerNode
            key={node.path}
            node={node}
            onSelectNode={onSelectNode}
            level={level}
            />
        ))}
        </>
    );
}

const FileExplorer: React.FC<FileExplorerProps> = ({ nodes, onSelectNode }) => {
  return (
    <div className="p-2">
      <ExplorerSubTree childrenNodes={nodes} onSelectNode={onSelectNode} level={0} />
    </div>
  );
};

export default FileExplorer;

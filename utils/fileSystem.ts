
import { DirectoryNode, GitTreeItem } from '../types';

export const buildFileSystemFromGitTree = (tree: GitTreeItem[]): DirectoryNode => {
    const root: DirectoryNode = { type: 'directory', name: 'root', path: '', children: {} };

    // Filter out submodule commits and sort by path length to ensure parent directories are created first
    const sortedTree = tree
        .filter(item => item.type === 'blob' || item.type === 'tree')
        .sort((a, b) => a.path.split('/').length - b.path.split('/').length);


    for (const item of sortedTree) {
        if (!item.path) continue;
        const parts = item.path.split('/');
        let currentNode: DirectoryNode = root;

        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            if (!currentNode.children[part]) {
                const newPath = parts.slice(0, i + 1).join('/');
                currentNode.children[part] = {
                    type: 'directory',
                    name: part,
                    path: newPath,
                    children: {},
                };
            }
            const nextNode = currentNode.children[part];
            if (nextNode.type === 'directory') {
                currentNode = nextNode;
            } else {
                console.error(`Path conflict: ${part} is a file, but path expects a directory.`);
                // If a path conflict occurs, we skip this item.
                continue;
            }
        }
        
        const itemName = parts[parts.length - 1];
        if (item.type === 'blob') {
            currentNode.children[itemName] = {
                type: 'file',
                name: itemName,
                path: item.path,
                sha: item.sha,
            };
        } else if (item.type === 'tree' && !currentNode.children[itemName]) {
             currentNode.children[itemName] = {
                type: 'directory',
                name: itemName,
                path: item.path,
                children: {},
            };
        }
    }

    return root;
};

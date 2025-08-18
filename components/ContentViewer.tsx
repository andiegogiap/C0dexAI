


import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FolderIcon, FileTextIcon, PythonIcon, JsonIcon, MarkdownIcon, JsIcon, CsvIcon } from './icons/FileIcons';
import { SelectedFile, FileSystemNode } from '../types';

// Editor Component defined within the same file to adhere to file constraints
// This will be used for all non-HTML files.
interface MonacoEditorProps {
    file: SelectedFile;
    onSave: (path: string, newContent: string, commitMessage: string) => Promise<void>;
}

const languageMapping: { [key: string]: string } = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    json: 'json',
    md: 'markdown',
    html: 'html',
    htm: 'html',
    css: 'css',
    yml: 'yaml',
    yaml: 'yaml',
};

const getLanguage = (path: string) => {
    const extension = path.split('.').pop()?.toLowerCase() || '';
    return languageMapping[extension] || 'plaintext';
};


const MonacoEditor: React.FC<MonacoEditorProps> = ({ file, onSave }) => {
    const [content, setContent] = useState(file.content);
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [originalContent, setOriginalContent] = useState(file.content);
    
    useEffect(() => {
        setContent(file.content);
        setOriginalContent(file.content);
        setIsDirty(false);
    }, [file]);

    const handleEditorChange = (value: string | undefined) => {
        const newValue = value || '';
        setContent(newValue);
        setIsDirty(newValue !== originalContent);
    };

    const handleSave = async () => {
        if (!file || !isDirty || isSaving) return;
        
        const commitMessage = prompt("Enter commit message:", `Update ${file.path}`);
        if (!commitMessage) {
            return; // User cancelled prompt
        }

        setIsSaving(true);
        try {
            await onSave(file.path, content, commitMessage);
            setIsDirty(false);
            setOriginalContent(content);
        } catch (error) {
            alert(`Failed to commit file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-slate-900/50">
            <div className="flex-grow relative">
                <Editor
                    path={file.path}
                    language={getLanguage(file.path)}
                    value={content}
                    onChange={handleEditorChange}
                    theme="vs-dark"
                    options={{ minimap: { enabled: false }, wordWrap: 'on', automaticLayout: true, background: '#00000000' }}
                />
            </div>
            <div className="flex-shrink-0 p-2 flex items-center gap-4 bg-black/40 backdrop-blur-sm border-t border-white/10">
                <button
                    onClick={handleSave}
                    disabled={!isDirty || isSaving}
                    className="bg-green-600 hover:bg-green-500 text-black font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-[0_0_15px_rgba(0,255,0,0.6)]"
                >
                    {isSaving ? 'Committing...' : 'Commit Changes'}
                </button>
                 <span className={`text-sm ${isDirty ? 'text-yellow-400' : 'text-green-400'}`}>
                    {isSaving ? '...' : (isDirty ? 'Unsaved changes' : 'Committed')}
                </span>
            </div>
        </div>
    );
};


// Main ContentViewer Component
interface ContentViewerProps {
  selectedFile: SelectedFile | null;
  selectedPath: string;
  directoryChildren: FileSystemNode[] | null;
  onCommitFile: (path: string, newContent: string, commitMessage: string) => Promise<void>;
}

const getFileIcon = (fileName: string): React.ReactNode => {
    if (fileName.endsWith('.py')) return <PythonIcon />;
    if (fileName.endsWith('.json')) return <JsonIcon />;
    if (fileName.endsWith('.md')) return <MarkdownIcon />;
    if (fileName.endsWith('.js') || fileName.endsWith('.tsx')) return <JsIcon />;
    if (fileName.endsWith('.csv')) return <CsvIcon />;
    return <FileTextIcon />;
};

const ContentViewer: React.FC<ContentViewerProps> = ({ selectedFile, selectedPath, directoryChildren, onCommitFile }) => {
    // State for HTML editing/preview
    const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
    const [editorContent, setEditorContent] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [originalContent, setOriginalContent] = useState('');

    const isHtmlFile = selectedFile?.path.endsWith('.html') || selectedFile?.path.endsWith('.htm');

    useEffect(() => {
        if (selectedFile) {
            setEditorContent(selectedFile.content);
            setOriginalContent(selectedFile.content);
            setIsDirty(false);
            setActiveTab('editor'); // Reset to editor on new file
        }
    }, [selectedFile]);

    const handleEditorChange = (value: string | undefined) => {
        const newValue = value || '';
        setEditorContent(newValue);
        setIsDirty(newValue !== originalContent);
    };

    const handleSave = async () => {
        if (!selectedFile || !isDirty || isSaving) return;
        
        const commitMessage = prompt("Enter commit message:", `Update ${selectedFile.path}`);
        if (!commitMessage) return;

        setIsSaving(true);
        try {
            await onCommitFile(selectedFile.path, editorContent, commitMessage);
            setIsDirty(false);
            setOriginalContent(editorContent);
        } catch (error) {
            alert(`Failed to commit file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

  
  if (selectedFile) {
    if (isHtmlFile) {
        return (
            <div className="h-full w-full flex flex-col bg-slate-900/50">
                {/* Tab Bar */}
                <div className="flex-shrink-0 p-1 border-b border-white/10 flex gap-1 bg-black/40">
                  <button 
                    onClick={() => setActiveTab('editor')} 
                    className={`flex-1 text-center px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'editor' ? 'bg-pink-500/20 text-pink-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]' : 'text-slate-400 hover:bg-slate-700/50'}`}
                  >
                    Editor
                  </button>
                  <button 
                    onClick={() => setActiveTab('preview')} 
                    className={`flex-1 text-center px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-cyan-500/20 text-cyan-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]' : 'text-slate-400 hover:bg-slate-700/50'}`}
                  >
                    Preview
                  </button>
                </div>

                {/* Tab Content */}
                <div className="flex-grow relative overflow-hidden">
                    <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'editor' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                        <Editor
                            path={selectedFile.path}
                            language={getLanguage(selectedFile.path)}
                            value={editorContent}
                            onChange={handleEditorChange}
                            theme="vs-dark"
                            options={{ minimap: { enabled: false }, wordWrap: 'on', automaticLayout: true, background: '#00000000' }}
                        />
                    </div>
                    <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'preview' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                       <iframe
                            srcDoc={editorContent}
                            title="HTML Preview"
                            sandbox="allow-scripts allow-same-origin"
                            className="w-full h-full bg-white"
                        />
                    </div>
                </div>
                {/* Commit Bar */}
                <div className="flex-shrink-0 p-2 flex items-center gap-4 bg-black/40 backdrop-blur-sm border-t border-white/10">
                    <button
                        onClick={handleSave}
                        disabled={!isDirty || isSaving}
                        className="bg-green-600 hover:bg-green-500 text-black font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-600 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none hover:shadow-[0_0_15px_rgba(0,255,0,0.6)]"
                    >
                        {isSaving ? 'Committing...' : 'Commit Changes'}
                    </button>
                     <span className={`text-sm ${isDirty ? 'text-yellow-400' : 'text-green-400'}`}>
                        {isSaving ? '...' : (isDirty ? 'Unsaved changes' : 'Committed')}
                    </span>
                </div>
            </div>
        );
    }
    return <MonacoEditor file={selectedFile} onSave={onCommitFile} />;
  }
  
  if (directoryChildren) {
     const sortedChildren = [...directoryChildren].sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
     });

    return (
      <div className="p-4 flex-grow overflow-y-auto">
        <h2 className="text-xl font-bold text-pink-400 mb-4 border-b border-pink-500/30 pb-2 flex items-center gap-2 filter drop-shadow-[0_0_4px_#ff00ff]">
            <FolderIcon isOpen={true} />
            <span>Directory: /{selectedPath}</span>
        </h2>
        <ul>
          {sortedChildren.map(child => (
            <li key={child.path} className="flex items-center gap-3 p-2 hover:bg-pink-500/20 rounded-md transition-colors">
              {child.type === 'directory' ? <FolderIcon isOpen={false} /> : getFileIcon(child.path)}
              <span>{child.name}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
      <div className="p-8 text-center text-slate-500 h-full flex items-center justify-center">
        <div>
            <h2 className="text-2xl text-pink-400 filter drop-shadow-[0_0_4px_#ff00ff]">Nothing Selected</h2>
            <p className="mt-2">Select a file or folder to view its content.</p>
        </div>
      </div>
    );
};

export default ContentViewer;
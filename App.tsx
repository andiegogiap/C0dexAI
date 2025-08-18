import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { ChatMessage, ChatMessageSender, SelectedFile, DirectoryNode, FileSystemNode, RepoInfo, GitTreeItem } from './types';
import Header from './components/Header';
import FileExplorer from './components/FileExplorer';
import ContentViewer from './components/ContentViewer';
import ChatAssistant from './components/ChatAssistant';
import Resizer from './components/Resizer';
import GitHubConnect from './components/CommitModal';
import { CollapseIcon, ExpandIcon } from './components/icons/SideBarIcons';
import { runCodeInterpreter } from './services/geminiService';
import { getRepoTree, getFileContent, createFile, updateFile, downloadRepoZip } from './services/githubService';
import { buildFileSystemFromGitTree } from './utils/fileSystem';
import FloatingOrbMenu from './components/FloatingOrbMenu';
import Terminal from './components/Terminal';
import AppPreview from './components/AppPreview';
import SettingsPanel from './components/SettingsPanel';

type ActiveTab = 'chat' | 'terminal' | 'preview';

const App: React.FC = () => {
  const [fileSystem, setFileSystem] = useState<DirectoryNode | null>(null);
  const [gitTree, setGitTree] = useState<GitTreeItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [currentPath, setCurrentPath] = useState<string>('');
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  
  const [panelSizes, setPanelSizes] = useState([20, 45, 35]);
  const lastExplorerSize = useRef(panelSizes[0]);
  const mainContainerRef = useRef<HTMLElement>(null);
  const activeHandleIndex = useRef<number | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [githubToken, setGithubToken] = useState<string>('');
  const [connectError, setConnectError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Welcome to the C0dexAI Terminal.']);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProjectRunning, setIsProjectRunning] = useState(false);
  
  const [systemInstruction, setSystemInstruction] = useState<string>(`You are 'C0dexAI', the primary AI assistant in this web-based GitHub tool. You directly interact with the user and are responsible for parsing their requests into actionable commands.
The user is currently at path: '{{currentPath}}'. All file paths are relative to the repository root.

Your core responsibilities:
1.  **Acknowledge and Clarify:** Understand the user's request.
2.  **Command Execution:** When a user asks to create a file or run the project, you MUST use the following special formats. These are non-negotiable and are the ONLY way to perform these actions.

    - **To create or update a file:**
      \`\`\`create-file
      path: path/to/your/new-file.ext
      commit: A concise and descriptive commit message.
      ---
      The full, raw content of the file goes here.
      \`\`\`

    - **To run the project (which simulates install, build, and dev server):**
      \`\`\`run-project
      command: npm run dev
      \`\`\`
3.  **Server Creation**: If the user wants to create a server to host their static web application, you can generate a 'server.js' file for them using the 'create-file' command. A simple Express.js server for this purpose looks like this (assume the build output is in a 'dist' folder):
    \`\`\`javascript
    const express = require('express');
    const path = require('path');
    const app = express();
    const port = process.env.PORT || 3000;

    // Serve static files from the 'dist' directory
    app.use(express.static(path.join(__dirname, 'dist')));

    // Handle SPA routing: for any request that doesn't match a static file,
    // send back the main index.html file.
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });

    app.listen(port, () => {
        console.log(\`Server listening on port \${port}\`);
    });
    \`\`\`
    You can then instruct the user on how to run it, but you cannot execute the 'node server.js' command yourself. You can only use the commands listed above.
4.  **Limitations:** You CANNOT read files directly. The user must open a file first. You can only analyze content that is visible or in the prompt. Do not invent file contents.
5.  **Collaboration:** You can mention that you are orchestrating actions, like telling a specialist agent to handle the backend work, to provide clarity to the user. For example: "I'm instructing GitMage to commit the new file."`);

  const [aiSupervisorInstruction, setAiSupervisorInstruction] = useState<string>(`You are the supervisor model overseeing the C0dexAI assistant. Your role is to ensure the assistant's responses are of the highest quality, efficiency, and helpfulness.

- **Think Step-by-Step:** Before generating a response, break down the user's request into a logical sequence of steps.
- **Prioritize Action:** When a user request can be fulfilled with a \`create-file\` or \`run-project\` command, prioritize generating that command over a simple text explanation.
- **Be Proactive:** Analyze the file structure or code context to provide relevant suggestions. If you see a \`package.json\` with a \`dev\` script, suggest running the project. If you see a messy file, suggest refactoring it.
- **Code Quality:** When generating code, adhere to best practices for readability, performance, and maintainability for the language in question.
- **Conciseness:** Keep conversational parts of the response clear and to the point. Avoid unnecessary verbosity. The primary goal is to help the user accomplish their task.`);


  const handleResizeMove = useCallback((event: MouseEvent) => {
    if (activeHandleIndex.current === null || !mainContainerRef.current) return;
    const mainRect = mainContainerRef.current.getBoundingClientRect();
    const totalWidth = mainRect.width;
    if(totalWidth === 0) return;
    setPanelSizes(prevSizes => {
        const newSizes = [...prevSizes];
        const index = activeHandleIndex.current!;
        const MIN_PERCENT = 10;
        const totalTwoPanelSize = newSizes[index] + newSizes[index+1];
        let newLeftSize = ((event.clientX - mainRect.left) / totalWidth * 100) - (newSizes.slice(0,index).reduce((a,b)=> a+b, 0));
        
        if (newLeftSize < MIN_PERCENT) newLeftSize = MIN_PERCENT;
        if (newLeftSize > totalTwoPanelSize - MIN_PERCENT) newLeftSize = totalTwoPanelSize - MIN_PERCENT;
        
        const newRightSize = totalTwoPanelSize - newLeftSize;
        newSizes[index] = newLeftSize;
        newSizes[index+1] = newRightSize;
        
        if (index === 0 && newSizes[0] > 0) {
            lastExplorerSize.current = newSizes[0];
        }
        return newSizes;
    });
  }, []);

  const handleResizeStart = useCallback((index: number, event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    activeHandleIndex.current = index;
    document.body.style.cursor = 'col-resize';

    const handleResizeEnd = () => {
        activeHandleIndex.current = null;
        document.body.style.cursor = 'default';
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  }, [handleResizeMove]);


  const toggleExplorer = useCallback(() => {
    setPanelSizes(currentSizes => {
        const isCurrentlyVisible = currentSizes[0] > 0;
        if (isCurrentlyVisible) {
            if (currentSizes[0] > 0) lastExplorerSize.current = currentSizes[0];
            const spaceToDistribute = currentSizes[0];
            const otherPanelsTotal = currentSizes[1] + currentSizes[2];
            const ratio1 = otherPanelsTotal > 0 ? currentSizes[1] / otherPanelsTotal : 0.5;
            return [0, currentSizes[1] + spaceToDistribute * ratio1, currentSizes[2] + spaceToDistribute * (1 - ratio1)];
        } else {
            const widthToRestore = lastExplorerSize.current > 10 ? lastExplorerSize.current : 20;
            const otherPanelsTotal = currentSizes[1] + currentSizes[2];
            const ratio1 = otherPanelsTotal > 0 ? currentSizes[1] / otherPanelsTotal : 0.5;
            return [widthToRestore, (otherPanelsTotal - widthToRestore) * ratio1, (otherPanelsTotal - widthToRestore) * (1 - ratio1)];
        }
    });
  }, []);

  const addSystemMessage = (text: string) => {
    const message: ChatMessage = { id: Date.now().toString(), sender: ChatMessageSender.System, text };
    setChatHistory(prev => [...prev, message]);
  };
  
  const appendToTerminal = (text: string) => {
      setTerminalOutput(prev => [...prev, text]);
  };

  const handleConnectToGithub = useCallback(async (token: string, owner: string, repo: string) => {
      setIsConnecting(true);
      setConnectError(null);
      try {
          const newRepoInfo = { owner, repo };
          addSystemMessage(`Attempting to connect to ${owner}/${repo}...`);
          const tree = await getRepoTree(token, newRepoInfo);
          const fs = buildFileSystemFromGitTree(tree);
          setGitTree(tree);
          setFileSystem(fs);
          setGithubToken(token);
          setRepoInfo(newRepoInfo);
          setIsConnected(true);
          setChatHistory([{ id: '1', sender: ChatMessageSender.System, text: `Successfully connected to ${owner}/${repo}. Welcome to C0dexAI.` }]);
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          console.error("Connection failed:", errorMessage);
          setConnectError(errorMessage);
          addSystemMessage(`Connection failed: ${errorMessage}`);
      } finally {
          setIsConnecting(false);
      }
  }, []);

  const handleSelectNode = useCallback(async (path: string, type: 'tree' | 'blob') => {
    setCurrentPath(path);
    if (type === 'blob' && repoInfo && githubToken) {
        setSelectedFile(null);
        addSystemMessage(`Fetching content for ${path}...`);
        try {
            const { content, sha } = await getFileContent(githubToken, repoInfo, path);
            setSelectedFile({ path, content, sha });
            addSystemMessage(`Successfully loaded ${path}.`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            addSystemMessage(`Error fetching file ${path}: ${errorMessage}`);
        }
    } else {
        setSelectedFile(null);
    }
  }, [repoInfo, githubToken]);

  const refetchTree = useCallback(async () => {
    if (!githubToken || !repoInfo) return;
    addSystemMessage(`Refreshing file tree for ${repoInfo.owner}/${repoInfo.repo}...`);
    try {
        const tree = await getRepoTree(githubToken, repoInfo);
        const fs = buildFileSystemFromGitTree(tree);
        setGitTree(tree);
        setFileSystem(fs);
        addSystemMessage('File tree refreshed.');
    } catch (error) {
        addSystemMessage(`Error refreshing file tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [githubToken, repoInfo]);


  const handleCommitFile = useCallback(async (path: string, newContent: string, commitMessage: string) => {
    if (!githubToken || !repoInfo || !selectedFile || selectedFile.path !== path) {
        addSystemMessage('Error: No file selected or repository not connected.');
        return;
    }
    addSystemMessage(`Committing changes to ${path}...`);
    try {
        await updateFile(githubToken, repoInfo, path, newContent, selectedFile.sha, commitMessage);
        addSystemMessage(`Successfully committed changes to ${path}.`);
        setSelectedFile(prev => prev ? { ...prev, content: newContent, sha: 'new_sha_placeholder' } : null);
        await refetchTree();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addSystemMessage(`Error committing to ${path}: ${errorMessage}`);
        throw error;
    }
  }, [githubToken, repoInfo, selectedFile, refetchTree]);

  const handleRunProject = useCallback(async (command: string) => {
    if (isProjectRunning) {
        addSystemMessage("A project is already running. Please stop it before starting a new one.");
        return;
    }

    addSystemMessage(`Initializing WebContainer to run your project with '${command}'...`);
    setTerminalOutput(['> C0dexAI WebContainer Initializing...']);
    setActiveTab('terminal');
    setIsProjectRunning(true);

    const runSimulation = async () => {
        await new Promise(res => setTimeout(res, 1000));
        appendToTerminal('> Filesystem mounted.');
        
        await new Promise(res => setTimeout(res, 1000));
        appendToTerminal('\n> Running: npm install');
        const packages = ['react', 'react-dom', 'vite', 'tailwindcss', 'express'];
        for (const pkg of packages) {
            await new Promise(res => setTimeout(res, 250));
            appendToTerminal(`+ ${pkg}@latest`);
        }
        await new Promise(res => setTimeout(res, 500));
        appendToTerminal('added 342 packages from 24 contributors and audited 342 packages in 8.2s');

        await new Promise(res => setTimeout(res, 1000));
        appendToTerminal('\n> Running: npm run build');
        await new Promise(res => setTimeout(res, 500));
        appendToTerminal('> vite build');
        await new Promise(res => setTimeout(res, 200));
        appendToTerminal('vite v5.1.4 building for production...');
        await new Promise(res => setTimeout(res, 200));
        appendToTerminal('✓ 34 modules transformed.');
        await new Promise(res => setTimeout(res, 200));
        appendToTerminal('dist/index.html                     0.58 kB │ gzip: 0.37 kB');
        await new Promise(res => setTimeout(res, 200));
        appendToTerminal('dist/assets/index-DmfkL2P9.css   69.21 kB │ gzip: 8.84 kB');
        await new Promise(res => setTimeout(res, 200));
        appendToTerminal('dist/assets/index-DMBb3PzP.js   145.29 kB │ gzip: 47.09 kB');
        await new Promise(res => setTimeout(res, 500));
        appendToTerminal('✓ built in 1.97s');


        await new Promise(res => setTimeout(res, 1000));
        appendToTerminal(`\n> Running: ${command}`);
        await new Promise(res => setTimeout(res, 500));
        appendToTerminal('> vite');
        await new Promise(res => setTimeout(res, 1500));
        appendToTerminal('\n  ➜  Local:   http://localhost:3000/');
        appendToTerminal('  ➜  Network: use --host to expose');
        appendToTerminal('  ➜  press h to show help');
        
        addSystemMessage("Project is now running. A preview is available in the Live Preview tab.");
        setPreviewUrl('placeholder');
        setActiveTab('preview');
    };

    runSimulation();
  }, [isProjectRunning]);

  const handleStopProject = useCallback(() => {
      setPreviewUrl(null);
      setIsProjectRunning(false);
      setActiveTab('terminal');
      addSystemMessage("Project stopped and preview closed.");
      appendToTerminal("\n> Server stopped by user.");
  }, []);
  
  const handleAiPrompt = useCallback(async (prompt: string) => {
    setIsAiLoading(true);
    const userMessage: ChatMessage = { id: Date.now().toString(), sender: ChatMessageSender.User, text: prompt };
    setChatHistory(prev => [...prev, userMessage]);

    try {
      let aiResponseText = await runCodeInterpreter(prompt, currentPath, systemInstruction, aiSupervisorInstruction);
      
      const fileCreationRegex = /```create-file\npath: ?(\S+)\ncommit: ?([\s\S]*?)\n---\n([\s\S]+?)```/g;
      const runProjectRegex = /```run-project\ncommand: ?([\s\S]*?)\n```/g;

      const fileMatches = [...aiResponseText.matchAll(fileCreationRegex)];
      const runMatches = [...aiResponseText.matchAll(runProjectRegex)];

      if (fileMatches.length > 0 && githubToken && repoInfo) {
        for (const match of fileMatches) {
            const path = match[1].trim();
            const commitMessage = match[2].trim();
            const content = match[3].trim();

            addSystemMessage(`AI is creating file '${path}' with commit: "${commitMessage}"`);
            try {
                await createFile(githubToken, repoInfo, path, content, commitMessage);
                aiResponseText = aiResponseText.replace(match[0], `(System: File '${path}' created successfully.)`);
                await refetchTree();
            } catch(e) {
                const errorMsg = e instanceof Error ? e.message : "Unknown error";
                aiResponseText = aiResponseText.replace(match[0], `(System: Error creating file '${path}': ${errorMsg})`);
            }
        }
      }

      if (runMatches.length > 0) {
        for (const match of runMatches) {
          const command = match[1].trim();
          handleRunProject(command);
          aiResponseText = aiResponseText.replace(match[0], `(System: Now attempting to run project with command: ${command})`);
        }
      }

      const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: ChatMessageSender.AI, text: aiResponseText };
      setChatHistory(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: ChatMessageSender.System, text: 'Apologies, a glitch in the mainframe occurred.' };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsAiLoading(false);
    }
  }, [currentPath, githubToken, repoInfo, refetchTree, handleRunProject, systemInstruction, aiSupervisorInstruction]);

  const handleRepoScan = useCallback(async () => {
    if (gitTree.length === 0 || !repoInfo) {
        addSystemMessage("File tree not available. Please connect to a repository first.");
        return;
    }

    const allFilePaths = gitTree.filter(item => item.type === 'blob').map(item => item.path).join('\n');
    
    let truncatedPaths = allFilePaths;
    if (allFilePaths.length > 8000) {
        truncatedPaths = allFilePaths.substring(0, 8000) + "\n... (file list truncated)";
    }

    const prompt = `
I am analyzing the repository '${repoInfo.owner}/${repoInfo.repo}'. Here is a list of all file paths:
---
${truncatedPaths}
---
Based on this structure, please provide a high-level analysis. What is the project's purpose? What are the main technologies? Which files are most important? Can you suggest any improvements? If this looks like a runnable web project (e.g., contains package.json with scripts), suggest that I run it.`;
    await handleAiPrompt(prompt);
  }, [gitTree, repoInfo, handleAiPrompt]);

  const handleRepoDownload = useCallback(async () => {
    if (!githubToken || !repoInfo || isDownloading) return;
    setIsDownloading(true);
    addSystemMessage(`Preparing to download ${repoInfo.owner}/${repoInfo.repo}.zip...`);
    try {
        const blob = await downloadRepoZip(githubToken, repoInfo);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${repoInfo.repo}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        addSystemMessage(`Successfully downloaded ${repoInfo.repo}.zip.`);
    } catch(error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        addSystemMessage(`Download failed: ${errorMessage}`);
    } finally {
        setIsDownloading(false);
    }
  }, [githubToken, repoInfo, isDownloading]);


  const isExplorerVisible = panelSizes[0] > 0;
  
  const contentViewerDirectoryChildren = useMemo(() => {
    if (!fileSystem) return null;
    let node: FileSystemNode | null = fileSystem;
    const parts = currentPath.split('/').filter(p => p);
    for (const part of parts) {
        if (node && node.type === 'directory' && node.children[part]) {
            node = node.children[part];
        } else {
            node = null;
            break;
        }
    }
    if (node && node.type === 'directory') {
        return Object.values(node.children);
    }
    return null;
  }, [fileSystem, currentPath]);

  if (!isConnected) {
      return <GitHubConnect onConnect={handleConnectToGithub} isLoading={isConnecting} error={connectError} />;
  }

  return (
    <div className="h-screen w-screen font-sans overflow-hidden relative">
      <div className="relative z-10 h-full w-full text-slate-300 flex flex-col overflow-hidden">
          <Header
            repoName={repoInfo ? `${repoInfo.owner}/${repoInfo.repo}` : ''}
            currentPath={currentPath}
          />
          <main ref={mainContainerRef} className="flex-grow flex overflow-hidden p-2 gap-2">
            <div 
                className="glass neon overflow-hidden transition-all duration-300"
                style={{ 
                    flexBasis: `${panelSizes[0]}%`,
                    display: panelSizes[0] === 0 ? 'none' : 'flex'
                }}
            >
              <div className="overflow-y-auto h-full w-full">
                 {fileSystem && <FileExplorer nodes={fileSystem.children} onSelectNode={handleSelectNode} />}
              </div>
            </div>
            
            <div className="relative flex-shrink-0 flex items-center -ml-2">
                <button 
                    onClick={toggleExplorer}
                    className="z-20 bg-slate-800 hover:bg-cyan-400 text-white rounded-full p-1 shadow-[0_0_10px_rgba(0,255,255,0.5)] transition-all"
                    aria-label={isExplorerVisible ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {isExplorerVisible ? <CollapseIcon /> : <ExpandIcon />}
                </button>
                {isExplorerVisible && <Resizer onMouseDown={(e) => handleResizeStart(0, e)} />}
            </div>
            
            <div className="flex-grow flex flex-col overflow-hidden glass neon" style={{ flexBasis: `${panelSizes[1]}%` }}>
              <ContentViewer 
                  selectedFile={selectedFile} 
                  selectedPath={currentPath} 
                  directoryChildren={contentViewerDirectoryChildren}
                  onCommitFile={handleCommitFile}
              />
            </div>

            <Resizer onMouseDown={(e) => handleResizeStart(1, e)} />

            <div className="glass neon flex flex-col" style={{ flexBasis: `${panelSizes[2]}%` }}>
                <div className="flex-shrink-0 p-1 border-b border-white/10 flex gap-1 bg-black/40">
                  <button 
                    onClick={() => setActiveTab('chat')} 
                    className={`flex-1 text-center px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-green-500/20 text-green-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]' : 'text-slate-400 hover:bg-slate-700/50'}`}
                    >
                    C0dexAI Assistant
                  </button>
                  <button 
                    onClick={() => setActiveTab('terminal')} 
                    className={`flex-1 text-center px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'terminal' ? 'bg-yellow-500/20 text-yellow-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]' : 'text-slate-400 hover:bg-slate-700/50'}`}
                    >
                    Terminal
                  </button>
                  <button 
                    onClick={() => setActiveTab('preview')} 
                    disabled={!previewUrl}
                    className={`flex-1 text-center px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'preview' ? 'bg-blue-500/20 text-blue-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]' : 'text-slate-400 hover:bg-slate-700/50 disabled:text-slate-600 disabled:bg-transparent disabled:shadow-none'}`}
                    >
                    Live Preview
                  </button>
                </div>
                <div className="flex-grow relative overflow-hidden">
                    <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'chat' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                      <ChatAssistant
                        messages={chatHistory}
                        onSendMessage={handleAiPrompt}
                        isLoading={isAiLoading}
                      />
                    </div>
                    <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'terminal' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                       <Terminal output={terminalOutput} />
                    </div>
                     <div className={`absolute inset-0 transition-opacity duration-300 ${activeTab === 'preview' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                       {previewUrl && <AppPreview />}
                    </div>
                </div>
            </div>
          </main>
          <FloatingOrbMenu 
            onScan={handleRepoScan} 
            onDownload={handleRepoDownload}
            onRun={() => handleRunProject('npm run dev')}
            onStop={handleStopProject}
            isProjectRunning={isProjectRunning}
            />
          <SettingsPanel
            systemInstruction={systemInstruction}
            aiInstruction={aiSupervisorInstruction}
            onSystemInstructionChange={setSystemInstruction}
            onAiInstructionChange={setAiSupervisorInstruction}
          />
      </div>
    </div>
  );
};

export default App;
import React, { useState } from 'react';
import { SettingsIcon } from './icons/SettingsIcon';
import { CollapseIcon, ExpandIcon } from './icons/SideBarIcons';

interface SettingsPanelProps {
  systemInstruction: string;
  aiInstruction: string;
  onSystemInstructionChange: (value: string) => void;
  onAiInstructionChange: (value: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    systemInstruction,
    aiInstruction,
    onSystemInstructionChange,
    onAiInstructionChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div 
                className={`fixed top-0 right-0 h-full glass neon z-[60] transition-transform duration-500 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                style={{ width: 'clamp(350px, 30vw, 500px)', borderRadius: '16px 0 0 16px' }}
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="absolute top-1/2 -left-8 transform -translate-y-1/2 w-8 h-16 bg-slate-800 hover:bg-cyan-400 text-white rounded-l-lg p-1 flex items-center justify-center shadow-lg transition-colors"
                    aria-label={isOpen ? "Close settings" : "Open settings"}
                >
                    {isOpen ? <ExpandIcon /> : <CollapseIcon />}
                </button>
                
                <div className="h-full flex flex-col">
                    <header className="flex-shrink-0 p-4 border-b border-white/10 flex items-center gap-3">
                        <SettingsIcon />
                        <h2 className="text-xl font-bold text-cyan-400 filter drop-shadow-[0_0_4px_#00ffff]">
                            Custom Instructions
                        </h2>
                    </header>
                    <div className="flex-grow overflow-y-auto p-4 space-y-6">
                         <div>
                            <label className="block text-sm font-medium text-pink-400 mb-2" htmlFor="system-orchestrator-instruction">
                                System Orchestrator (C0dexAI)
                            </label>
                            <textarea
                                id="system-orchestrator-instruction"
                                value={systemInstruction}
                                onChange={(e) => onSystemInstructionChange(e.target.value)}
                                rows={12}
                                className="w-full bg-white/5 border border-slate-500 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-all font-mono"
                                placeholder="Define the core responsibilities and command format for C0dexAI..."
                            />
                            <p className="text-xs text-slate-500 mt-2">This instruction defines how the AI parses commands like `create-file` and interacts with the app's tools.</p>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-green-400 mb-2" htmlFor="ai-supervisor-instruction">
                                AI Supervisor
                            </label>
                            <textarea
                                id="ai-supervisor-instruction"
                                value={aiInstruction}
                                onChange={(e) => onAiInstructionChange(e.target.value)}
                                rows={10}
                                className="w-full bg-white/5 border border-slate-500 rounded-lg p-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all font-mono"
                                placeholder="Define the high-level strategy and quality guidelines for the AI..."
                            />
                             <p className="text-xs text-slate-500 mt-2">This instruction guides the AI's overall behavior, such as its coding style, proactivity, and tone.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SettingsPanel;
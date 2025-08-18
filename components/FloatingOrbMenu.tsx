

import React, { useState } from 'react';
import { ScanIcon, DownloadIcon, PlayIcon, StopIcon } from './icons/ActionIcons';
import { OrbIcon } from './icons/OrbIcon';

interface FloatingOrbMenuProps {
    onScan: () => void;
    onDownload: () => void;
    onRun: () => void;
    onStop: () => void;
    isProjectRunning: boolean;
}

const FloatingOrbMenu: React.FC<FloatingOrbMenuProps> = ({ onScan, onDownload, onRun, onStop, isProjectRunning }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleToggle = () => setIsOpen(!isOpen);

    const menuItems = [
        isProjectRunning
            ? { label: 'Stop Project', icon: <StopIcon />, action: onStop, className: 'hover:bg-red-500 hover:shadow-[0_0_15px_#ff0000]' }
            : { label: 'Run Project', icon: <PlayIcon />, action: onRun, className: 'hover:bg-cyan-400 hover:shadow-[0_0_15px_#00ffff]' },
        { label: 'Scan Repo', icon: <ScanIcon />, action: onScan, className: 'hover:bg-cyan-400 hover:shadow-[0_0_15px_#00ffff]' },
        { label: 'Download ZIP', icon: <DownloadIcon />, action: onDownload, className: 'hover:bg-cyan-400 hover:shadow-[0_0_15px_#00ffff]' },
    ];

    return (
        <div className="fixed bottom-5 right-5 z-50">
            <div className="relative flex flex-col items-center">
                <div className="flex flex-col items-center gap-3 mb-4">
                    {menuItems.map((item, index) => (
                         <div
                            key={item.label}
                            className={`transform transition-all duration-300 ease-out ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}
                            style={{ transitionDelay: `${isOpen ? (menuItems.length - 1 - index) * 60 : 0}ms` }}
                        >
                            <button
                                onClick={() => { item.action(); setIsOpen(false); }}
                                className={`group flex items-center justify-center w-14 h-14 bg-black/50 backdrop-blur-md border border-cyan-400/50 rounded-full text-cyan-400 hover:text-black ${item.className} transition-colors`}
                                title={item.label}
                            >
                                {item.icon}
                            </button>
                        </div>
                    ))}
                </div>
                
                <button
                    onClick={handleToggle}
                    className="w-16 h-16 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 animate-pulse-glow"
                    aria-label="Toggle Quick Actions Menu"
                >
                    <OrbIcon isOpen={isOpen} />
                </button>
            </div>
        </div>
    );
};

export default FloatingOrbMenu;
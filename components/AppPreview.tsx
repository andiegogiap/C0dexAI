
import React from 'react';

interface AppPreviewProps {}

const AppPreview: React.FC<AppPreviewProps> = () => {
    return (
        <div className="h-full w-full flex flex-col bg-slate-900">
            <div className="flex-grow flex items-center justify-center p-8">
                <div className="text-center text-slate-400">
                    <h2 className="text-2xl font-bold text-pink-400 filter drop-shadow-[0_0_4px_#ff00ff] mb-4">WebContainer Preview</h2>
                    <p>In a full implementation, your live application would be displayed here.</p>
                    <p className="mt-2 text-sm text-slate-500">This feature is powered by WebContainers, which run Node.js directly in your browser.</p>
                </div>
            </div>
        </div>
    );
};

export default AppPreview;

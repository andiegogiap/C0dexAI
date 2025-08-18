import React, { useState } from 'react';

interface GitHubConnectProps {
    onConnect: (token: string, owner: string, repo: string) => void;
    isLoading: boolean;
    error: string | null;
}

const GitHubConnect: React.FC<GitHubConnectProps> = ({ onConnect, isLoading, error }) => {
    const [token, setToken] = useState('');
    const [owner, setOwner] = useState('');
    const [repo, setRepo] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (token && owner && repo) {
            onConnect(token, owner, repo);
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center font-sans relative">
            <div className="relative w-full max-w-md glass neon p-8">
                <h1 className="text-3xl font-bold text-center text-cyan-400 filter drop-shadow-[0_0_5px_#00ffff] mb-2">
                    C0dexAI
                </h1>
                <p className="text-slate-400 text-center mb-8">Connect to a GitHub Repository</p>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-md mb-6">
                        {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="github-token">
                            GitHub Personal Access Token
                        </label>
                        <input
                            id="github-token"
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="ghp_..."
                            className="w-full bg-white/5 border border-slate-500 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                            required
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                             <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="repo-owner">
                                Owner
                            </label>
                            <input
                                id="repo-owner"
                                type="text"
                                value={owner}
                                onChange={(e) => setOwner(e.target.value)}
                                placeholder="e.g., 'facebook'"
                                className="w-full bg-white/5 border border-slate-500 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                                required
                            />
                        </div>
                        <div className="flex-1">
                             <label className="block text-sm font-medium text-slate-300 mb-2" htmlFor="repo-name">
                                Repository
                            </label>
                            <input
                                id="repo-name"
                                type="text"
                                value={repo}
                                onChange={(e) => setRepo(e.target.value)}
                                placeholder="e.g., 'react'"
                                className="w-full bg-white/5 border border-slate-500 rounded-lg p-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all"
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold py-3 px-4 rounded-lg transition-all duration-300 disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,255,255,0.5)]"
                    >
                        {isLoading ? 'Connecting...' : 'Connect to Repository'}
                    </button>
                </form>
                <p className="text-xs text-slate-500 mt-4 text-center">Your token is used only for API requests and is not stored long-term.</p>
            </div>
        </div>
    );
};

export default GitHubConnect;
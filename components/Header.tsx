import React from 'react';

interface HeaderProps {
  repoName: string;
  currentPath: string;
}

const Header: React.FC<HeaderProps> = ({ repoName, currentPath }) => {
  const pathParts = currentPath.split('/').filter(p => p);

  return (
    <header 
        className="glass p-3 flex items-center justify-between flex-shrink-0"
        style={{ borderRadius: 0 }}
    >
      <a href="/" aria-label="Home">
        <img
          src="https://andiegogiap.com/assets/aionex-icon-256.png"
          alt="AIONEX"
          width="128"
          height="128"
          style={{ height: '40px', width: 'auto', display: 'block' }}
          loading="eager"
          decoding="async"
        />
      </a>
      
      <div className="flex-1 mx-8">
        <div className="text-sm text-slate-400 bg-black/50 rounded-full px-4 py-1 border border-slate-700 flex items-baseline">
          <span className="font-semibold text-pink-400 flex-shrink-0">{repoName}</span>
          <span className="mx-2 text-slate-600">/</span>
          <span className="truncate">
            {pathParts.length > 0 
              ? pathParts.map((part, index) => (
                  <React.Fragment key={index}>
                    <span className="cursor-pointer hover:underline hover:text-cyan-400">{part}</span>
                    {index < pathParts.length - 1 && <span className="mx-1 text-slate-600">/</span>}
                  </React.Fragment>
                ))
              : <span className="text-slate-500">root</span>
            }
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>System USER: user_a95bfb54</span>
        <span className="border-l border-slate-600 h-4"></span>
        <span>Session ID: session_1ab89b9e-e17</span>
      </div>
    </header>
  );
};

export default Header;
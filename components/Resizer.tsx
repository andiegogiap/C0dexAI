import React from 'react';

interface ResizerProps {
  onMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const Resizer: React.FC<ResizerProps> = ({ onMouseDown }) => {
  return (
    <div
      onMouseDown={onMouseDown}
      className="w-2 cursor-col-resize group"
      style={{ flexShrink: 0 }}
      aria-label="Resize panel"
      role="separator"
      tabIndex={-1}
    >
      <div className="w-0.5 h-full bg-slate-700 mx-auto group-hover:bg-cyan-400 group-hover:shadow-[0_0_8px_#00ffff] transition-all duration-200" />
    </div>
  );
};

export default Resizer;
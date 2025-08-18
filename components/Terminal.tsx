
import React, { useRef, useEffect } from 'react';

interface TerminalProps {
  output: string[];
}

const Terminal: React.FC<TerminalProps> = ({ output }) => {
    const endOfTerminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfTerminalRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [output]);

    return (
        <div className="h-full bg-black/80 p-4 font-mono text-sm text-slate-300 overflow-y-auto">
            {output.map((line, index) => (
                <div key={index} className="whitespace-pre-wrap">
                    {line}
                </div>
            ))}
            <div ref={endOfTerminalRef} />
        </div>
    );
};

export default Terminal;

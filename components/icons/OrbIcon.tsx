import React from 'react';

export const OrbIcon: React.FC<{ isOpen: boolean }> = ({ isOpen }) => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" />
    <g className={`transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-45' : ''}`} style={{ transformOrigin: 'center' }}>
      <line x1="16" y1="8" x2="16" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="8" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);
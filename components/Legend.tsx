import React from 'react';
import { COLORS } from '../constants.ts';

interface LegendProps {
  onClose?: () => void;
}

const Legend: React.FC<LegendProps> = ({ onClose }) => {
  const items = [
    { label: 'Normal', color: COLORS.CYAN, desc: 'Stable ground' },
    { label: 'Spring', color: COLORS.YELLOW, desc: 'High bounce' },
    { label: 'Teleport', color: COLORS.PURPLE, desc: 'Warp jump' },
    { label: 'Speed', color: COLORS.GREEN, desc: 'Dash pad' },
    { label: 'Immunity', color: COLORS.WHITE, desc: 'Hazard shield' },
    { label: 'Danger', color: COLORS.RED, desc: 'Insta-fail' },
    { label: 'Moving', color: COLORS.MAGENTA, desc: 'Kinetic platform' },
  ];

  return (
    <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
      <div className="bg-gray-900 border-2 border-cyan-500/50 p-6 rounded-3xl w-full max-w-[280px] shadow-[0_0_50px_rgba(0,255,255,0.3)]">
        <div className="flex justify-between items-center mb-6 border-b border-cyan-500/20 pb-2">
          <h3 className="text-cyan-400 font-orbitron text-xs font-bold uppercase tracking-[0.3em]">Sector Intel</h3>
          {onClose && (
            <button onClick={onClose} className="text-cyan-500 hover:text-white transition-colors">
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.label} className="flex items-center space-x-3 group">
              <div 
                className="w-4 h-4 rounded shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                style={{ backgroundColor: item.color, boxShadow: `0 0 12px ${item.color}` }}
              />
              <div className="flex flex-col">
                <span className="text-[10px] font-orbitron text-white uppercase tracking-widest">{item.label}</span>
                <span className="text-[8px] text-gray-500 uppercase tracking-tighter">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
        <button 
          onClick={onClose}
          className="w-full mt-6 py-2 bg-cyan-500 text-black font-orbitron text-[10px] font-bold uppercase hover:bg-white transition-all rounded-lg"
        >
          Close Log
        </button>
      </div>
    </div>
  );
};

export default Legend;
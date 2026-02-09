
import React, { useMemo } from 'react';
import { LeaderboardEntry } from '../types.ts';
import { COSMETICS } from '../constants.ts';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUser: string;
  onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentUser, onClose }) => {
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => b.score - a.score).slice(0, 10);
  }, [entries]);

  return (
    <div className="fixed inset-0 bg-black/95 z-[150] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-gray-900 border-2 border-purple-500/50 p-6 md:p-10 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_80px_rgba(168,85,247,0.2)] flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-orbitron font-bold text-purple-400 italic tracking-tighter">GLOBAL RANKS</h2>
            <div className="text-[10px] text-purple-500/50 uppercase tracking-[0.5em] font-orbitron">Neural Network Sync v2.0</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
          {sortedEntries.map((entry, idx) => {
            const isSelf = entry.username === currentUser;
            const skinColor = COSMETICS.SKINS.find(s => s.id === entry.skinId)?.value || '#00ffaa';
            
            return (
              <div 
                key={idx} 
                className={`flex items-center p-4 rounded-2xl border transition-all ${isSelf ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
              >
                <div className="w-10 text-xl font-orbitron font-bold text-gray-600 italic">
                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                </div>
                <div className="w-10 h-10 rounded-lg mr-4 border border-white/10 flex items-center justify-center bg-black/60 shadow-inner">
                  <div className="w-6 h-6 rounded-sm shadow-[0_0_10px_rgba(255,255,255,0.2)]" style={{ backgroundColor: skinColor }}></div>
                </div>
                <div className="flex-1">
                  <div className={`font-orbitron text-xs uppercase tracking-widest font-bold ${isSelf ? 'text-white' : 'text-gray-400'}`}>
                    {entry.username} {isSelf && <span className="text-[8px] text-purple-400 ml-2 italic">(YOU)</span>}
                  </div>
                  <div className="text-[9px] text-gray-600 uppercase font-orbitron mt-1">{entry.rank}</div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-orbitron font-black italic tracking-tighter ${isSelf ? 'text-white' : 'text-purple-400'}`}>
                    {entry.score.toLocaleString()}<span className="text-[10px] ml-1 opacity-50 not-italic">M</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-orbitron mb-4">Syncing with Vanguard Satellite...</p>
          <button 
            onClick={onClose} 
            className="w-full py-5 bg-purple-600 text-white font-orbitron font-bold rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;

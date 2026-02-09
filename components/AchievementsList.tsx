
import React from 'react';
import { ACHIEVEMENTS } from '../constants.ts';
import { UserStats } from '../types.ts';

interface AchievementsListProps {
  stats: UserStats;
  unlockedIds: string[];
  onClose: () => void;
}

const AchievementsList: React.FC<AchievementsListProps> = ({ stats, unlockedIds, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/95 z-[150] flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-gray-900 border-2 border-yellow-500/50 p-6 md:p-10 rounded-[2.5rem] w-full max-w-lg shadow-[0_0_80px_rgba(234,179,8,0.1)] flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-4xl font-orbitron font-bold text-yellow-500 italic tracking-tighter uppercase">Merit Archive</h2>
            <div className="text-[10px] text-yellow-600/50 uppercase tracking-[0.5em] font-orbitron">Vanguard Achievement Logs</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors text-2xl">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = unlockedIds.includes(ach.id);
            let progressValue = 0;
            if (ach.id.includes('meters')) progressValue = stats.totalMeters;
            else if (ach.id.includes('sectors')) progressValue = stats.sectorsBeat;
            else if (ach.id.includes('coins')) progressValue = stats.coinsEarned;
            else if (ach.id.includes('deaths')) progressValue = stats.totalDeaths;

            const percent = Math.min(100, (progressValue / ach.goal) * 100);

            return (
              <div key={ach.id} className={`p-5 rounded-2xl border transition-all ${isUnlocked ? 'bg-yellow-500/10 border-yellow-500/40 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)]' : 'bg-black/40 border-white/5'}`}>
                <div className="flex items-center mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 border ${isUnlocked ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-gray-800 border-white/10 text-gray-600'}`}>
                    <i className={`fas ${ach.icon}`}></i>
                  </div>
                  <div className="flex-1">
                    <div className={`font-orbitron text-xs uppercase tracking-widest font-bold ${isUnlocked ? 'text-yellow-500' : 'text-gray-400'}`}>
                      {ach.name}
                    </div>
                    <div className="text-[9px] text-gray-500 uppercase mt-1 leading-tight">{ach.desc}</div>
                  </div>
                  {isUnlocked && <i className="fas fa-check-circle text-yellow-500 text-lg"></i>}
                </div>
                
                {!isUnlocked && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[8px] font-orbitron text-gray-600 uppercase tracking-widest">
                      <span>{Math.floor(progressValue).toLocaleString()} / {ach.goal.toLocaleString()}</span>
                      <span>{Math.floor(percent)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500/50 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                )}
                
                <div className="mt-3 flex items-center text-[8px] font-orbitron uppercase tracking-widest">
                  <span className="text-gray-500 mr-2">Reward:</span>
                  <span className={ach.rewardType === 'COINS' ? 'text-yellow-400' : 'text-purple-400'}>
                    +{ach.rewardAmount} {ach.rewardType}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={onClose} 
          className="mt-8 py-5 border-2 border-yellow-500/50 text-yellow-500 font-orbitron font-bold rounded-2xl uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all"
        >
          Close Archive
        </button>
      </div>
    </div>
  );
};

export default AchievementsList;

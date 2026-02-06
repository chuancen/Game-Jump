
import React, { useState } from 'react';
import { UPGRADE_BASE_COSTS, SKINS, BOOST_COSTS, LEVEL_BOOSTS } from '../constants.ts';
import { sfx } from '../services/audioService.ts';

interface ShopProps {
  coins: number;
  extraLives: number;
  jumpLevel: number;
  meterLevel: number;
  unlockedSkins: string[];
  activeSkinId: string;
  doubleCreditsActive: boolean;
  level: number;
  levelPoints: number;
  activeLevelBoosts: string[];
  onBuyLife: (cost: number) => void;
  onBuyJump: (cost: number) => void;
  onBuyMeter: (cost: number) => void;
  onBuySkin: (id: string, cost: number) => void;
  onEquipSkin: (id: string) => void;
  onBuyBoost: (type: string, cost: number) => void;
  onSpendLevelPoints: (id: string, cost: number) => void;
  onClose: () => void;
}

const Shop: React.FC<ShopProps> = ({ 
  coins, extraLives, jumpLevel, meterLevel, 
  unlockedSkins, activeSkinId, doubleCreditsActive,
  level, levelPoints, activeLevelBoosts,
  onBuyLife, onBuyJump, onBuyMeter, onBuySkin, onEquipSkin, onBuyBoost, onSpendLevelPoints, onClose 
}) => {
  const [tab, setTab] = useState<'upgrades' | 'skins' | 'boosts' | 'levels'>('upgrades');

  const lifeCost = Math.floor(UPGRADE_BASE_COSTS.LIFE * Math.pow(2.0, extraLives));
  const jumpCost = Math.floor(UPGRADE_BASE_COSTS.JUMP * Math.pow(1.6, jumpLevel));
  const meterCost = Math.floor(UPGRADE_BASE_COSTS.MULTIPLIER * Math.pow(1.4, meterLevel));

  const handleTabChange = (newTab: 'upgrades' | 'skins' | 'boosts' | 'levels') => {
    sfx.playClick();
    setTab(newTab);
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] backdrop-blur-2xl animate-in fade-in duration-500 px-4">
      <div className="bg-gray-900 border-2 border-cyan-500/50 p-6 md:p-8 rounded-[2rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,255,255,0.15)] flex flex-col max-h-[85vh] relative overflow-hidden">
        
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-bl-full pointer-events-none"></div>

        <div className="flex justify-between items-start mb-8 z-10">
          <div>
            <h2 className="text-3xl font-orbitron font-bold text-cyan-400 italic tracking-tighter">BLACK MARKET</h2>
            <div className="text-[10px] text-cyan-500/50 uppercase tracking-[0.4em] font-orbitron font-bold">Encrypted Terminal v4.0</div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-yellow-400 font-orbitron text-xl font-bold flex items-center justify-end">
              <i className="fas fa-coins mr-2 text-sm"></i>{coins.toLocaleString()}
            </div>
            <div className="text-purple-400 font-orbitron text-[10px] font-bold uppercase tracking-widest">
              Available PTS: {levelPoints}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 bg-black/50 p-1.5 rounded-2xl border border-white/5">
          {(['upgrades', 'skins', 'boosts', 'levels'] as const).map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`flex-1 py-3 text-[9px] font-orbitron font-bold uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${tab === t ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,255,255,0.5)]' : 'text-gray-500 hover:text-cyan-400 hover:bg-white/5'}`}
            >
              {t === 'levels' ? 'LOGIC' : t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 pr-3 custom-scrollbar">
          {tab === 'upgrades' && (
            <div className="grid grid-cols-1 gap-4">
              <UpgradeRow label="Backup Cores" desc="Permanent Extra Lives" sub={`Current: ${extraLives + 1}`} cost={lifeCost} color="red" coins={coins} onBuy={() => onBuyLife(lifeCost)} />
              <UpgradeRow label="Impulse Drive" desc="Permanent Jump Power" sub={`Lv ${jumpLevel}`} cost={jumpCost} color="yellow" coins={coins} onBuy={() => onBuyJump(jumpCost)} />
              <UpgradeRow label="Sync Multiplier" desc="Score Multiplier Boost" sub={`Lv ${meterLevel}`} cost={meterCost} color="green" coins={coins} onBuy={() => onBuyMeter(meterCost)} />
            </div>
          )}

          {tab === 'skins' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
              {SKINS.map(skin => {
                const isUnlocked = unlockedSkins.includes(skin.id);
                const isActive = activeSkinId === skin.id;
                const levelMet = level >= skin.levelRequired;
                return (
                  <div key={skin.id} className={`p-4 bg-black/40 border-2 rounded-2xl flex flex-col items-center space-y-4 transition-all duration-300 ${isActive ? 'border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.25)]' : 'border-white/5'} ${!levelMet ? 'opacity-30' : 'hover:border-cyan-500/30'}`}>
                    <div className="w-10 h-10 rounded-lg shadow-2xl relative" style={{ backgroundColor: skin.color }}>
                       <div className="absolute inset-0 bg-white/20 rounded-lg blur-sm opacity-50"></div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] font-bold font-orbitron uppercase text-white tracking-tighter">{skin.name}</div>
                      {!levelMet && <div className="text-[8px] text-red-500 font-bold mt-1">REQ LV {skin.levelRequired}</div>}
                    </div>
                    {isUnlocked ? (
                      <button onClick={() => onEquipSkin(skin.id)} className={`w-full py-2 rounded-lg text-[9px] font-bold font-orbitron transition-all ${isActive ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-cyan-400 hover:bg-cyan-500/10'}`}>
                        {isActive ? 'ACTIVE' : 'EQUIP'}
                      </button>
                    ) : (
                      <button disabled={coins < skin.cost || !levelMet} onClick={() => onBuySkin(skin.id, skin.cost)} className="w-full bg-yellow-600 disabled:bg-gray-800 py-2 rounded-lg text-[9px] font-bold font-orbitron text-black transition-all">
                        {skin.cost} CR
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'boosts' && (
            <div className="p-6 bg-black/40 border-2 border-cyan-500/30 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <div className="text-cyan-400 font-bold uppercase text-sm tracking-[0.2em] font-orbitron">Double Credits</div>
                <div className="text-white/60 text-[10px] mt-1 font-orbitron">Earn 1 CR every 100m next round</div>
              </div>
              <button disabled={coins < BOOST_COSTS.DOUBLE_CREDITS || doubleCreditsActive} onClick={() => onBuyBoost('double_credits', BOOST_COSTS.DOUBLE_CREDITS)} className="w-full md:w-auto bg-cyan-600 disabled:bg-gray-800 px-8 py-3 rounded-xl text-[10px] font-bold font-orbitron text-white transition-all">
                {doubleCreditsActive ? 'PREPPED' : `${BOOST_COSTS.DOUBLE_CREDITS} CR`}
              </button>
            </div>
          )}

          {tab === 'levels' && (
            <div className="space-y-4 pb-4">
              <div className="text-center p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl mb-4">
                <span className="text-[10px] font-orbitron text-purple-400 uppercase tracking-widest font-bold">Unused Neural Points: {levelPoints}</span>
              </div>
              {LEVEL_BOOSTS.map(boost => {
                const isActive = activeLevelBoosts.includes(boost.id);
                return (
                  <div key={boost.id} className="p-5 bg-black/40 border-2 border-purple-500/20 rounded-[1.5rem] flex justify-between items-center transition-all hover:border-purple-500/40">
                    <div>
                      <div className="text-purple-400 font-bold uppercase text-xs tracking-widest font-orbitron">{boost.name}</div>
                      <div className="text-white/50 text-[10px] mt-1 italic leading-tight">{boost.desc}</div>
                    </div>
                    <button 
                      disabled={levelPoints < boost.cost || isActive} 
                      onClick={() => onSpendLevelPoints(boost.id, boost.cost)} 
                      className="bg-purple-600 disabled:bg-gray-800 px-6 py-3 rounded-xl text-[10px] font-bold font-orbitron text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                    >
                      {isActive ? 'PREPPED' : `${boost.cost} PTS`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button onClick={() => { sfx.playClick(); onClose(); }} className="w-full mt-8 py-5 border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black font-orbitron font-bold rounded-2xl transition-all shadow-[0_0_30px_rgba(0,255,255,0.2)] uppercase tracking-widest">Exit Terminal</button>
      </div>
    </div>
  );
};

const UpgradeRow: React.FC<{ label: string, desc: string, sub: string, cost: number, color: string, coins: number, onBuy: () => void }> = ({ label, desc, sub, cost, color, coins, onBuy }) => {
  const colorMap: Record<string, string> = {
    red: 'border-red-500/30 text-red-400 bg-red-600',
    yellow: 'border-yellow-500/30 text-yellow-400 bg-yellow-600',
    green: 'border-green-500/30 text-green-400 bg-green-600'
  };
  const [cBorder, cText, cBtn] = colorMap[color].split(' ');

  return (
    <div className={`flex justify-between items-center p-5 bg-black/50 border-2 ${cBorder} rounded-2xl transition-all hover:bg-black/70`}>
      <div>
        <div className={`${cText} font-bold uppercase text-xs tracking-[0.2em] font-orbitron`}>{label}</div>
        <div className="text-white/60 text-[10px] font-orbitron mt-1">{desc}</div>
        <div className="text-[9px] opacity-40 uppercase font-orbitron mt-0.5">{sub}</div>
      </div>
      <button disabled={coins < cost} onClick={onBuy} className={`${cBtn} disabled:bg-gray-800 px-6 py-3 rounded-xl text-[10px] font-bold font-orbitron text-white transition-all shadow-lg`}>
        {cost.toLocaleString()} CR
      </button>
    </div>
  );
};

export default Shop;

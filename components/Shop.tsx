
import React, { useState } from 'react';
import { UPGRADE_BASE_COSTS, COSMETICS, BOOST_COSTS, LEVEL_BOOSTS } from '../constants.ts';
import { sfx } from '../services/audioService.ts';

interface ShopProps {
  coins: number;
  extraLives: number;
  jumpLevel: number;
  meterLevel: number;
  unlockedCosmetics: Record<string, string[]>;
  activeCosmetics: Record<string, string>;
  doubleCreditsActive: boolean;
  doubleJumpActive: boolean;
  level: number;
  levelPoints: number;
  activeLevelBoosts: string[];
  onBuyLife: (cost: number) => void;
  onBuyJump: (cost: number) => void;
  onBuyMeter: (cost: number) => void;
  onBuyCosmetic: (type: string, id: string, cost: number) => void;
  onEquipCosmetic: (type: string, id: string) => void;
  onBuyBoost: (type: string, cost: number) => void;
  onSpendLevelPoints: (id: string, cost: number) => void;
  onClose: () => void;
}

const Shop: React.FC<ShopProps> = ({ 
  coins, extraLives, jumpLevel, meterLevel, unlockedCosmetics, activeCosmetics,
  doubleCreditsActive, doubleJumpActive, level, levelPoints, activeLevelBoosts,
  onBuyLife, onBuyJump, onBuyMeter, onBuyCosmetic, onEquipCosmetic, onBuyBoost, onSpendLevelPoints, onClose 
}) => {
  const [tab, setTab] = useState<'upgrades' | 'skins' | 'effects' | 'boosts' | 'levels'>('upgrades');

  const lifeCost = Math.floor(UPGRADE_BASE_COSTS.LIFE * Math.pow(2.0, extraLives));
  const jumpCost = Math.floor(UPGRADE_BASE_COSTS.JUMP * Math.pow(1.6, jumpLevel));
  const meterCost = Math.floor(UPGRADE_BASE_COSTS.MULTIPLIER * Math.pow(1.4, meterLevel));

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] backdrop-blur-2xl animate-in fade-in duration-500 px-4">
      <div className="bg-gray-900 border-2 border-cyan-500/50 p-6 md:p-8 rounded-[2rem] w-full max-w-lg shadow-[0_0_100px_rgba(0,255,255,0.15)] flex flex-col max-h-[85vh] relative overflow-hidden">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-3xl font-orbitron font-bold text-cyan-400 italic tracking-tighter">BLACK MARKET</h2>
            <div className="text-[10px] text-cyan-500/50 uppercase tracking-[0.4em] font-orbitron">Neural Node Active</div>
          </div>
          <div className="text-right">
            <div className="text-yellow-400 font-orbitron text-xl font-bold flex items-center justify-end"><i className="fas fa-coins mr-2 text-sm"></i>{coins.toLocaleString()}</div>
            <div className="text-purple-400 font-orbitron text-[10px] font-bold uppercase tracking-widest">Neural PTS: {levelPoints}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6 bg-black/50 p-1.5 rounded-2xl border border-white/5">
          {(['upgrades', 'skins', 'effects', 'boosts', 'levels'] as const).map(t => (
            <button key={t} onClick={() => { sfx.playClick(); setTab(t); }} className={`flex-1 py-3 px-2 text-[8px] md:text-[9px] font-orbitron font-bold uppercase tracking-[0.2em] rounded-xl transition-all ${tab === t ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(0,255,255,0.5)]' : 'text-gray-500 hover:text-cyan-400 hover:bg-white/5'}`}>{t}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {tab === 'upgrades' && (
            <div className="space-y-4">
              <UpgradeRow label="Backup Cores" desc="Permanent Extra Lives" sub={`Current: ${extraLives + 1}`} cost={lifeCost} color="red" coins={coins} onBuy={() => onBuyLife(lifeCost)} />
              <UpgradeRow label="Impulse Drive" desc="Permanent Jump Power" sub={`Lv ${jumpLevel}`} cost={jumpCost} color="yellow" coins={coins} onBuy={() => onBuyJump(jumpCost)} />
              <UpgradeRow label="Sync Multiplier" desc="Score Multiplier Boost" sub={`Lv ${meterLevel}`} cost={meterCost} color="green" coins={coins} onBuy={() => onBuyMeter(meterCost)} />
            </div>
          )}

          {tab === 'skins' && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
              {COSMETICS.SKINS.map(skin => {
                const isUnlocked = unlockedCosmetics.SKINS.includes(skin.id);
                const isActive = activeCosmetics.SKINS === skin.id;
                const levelMet = level >= skin.levelRequired;
                return (
                  <div key={skin.id} className={`p-4 bg-black/40 border-2 rounded-2xl flex flex-col items-center space-y-4 ${isActive ? 'border-cyan-500' : 'border-white/5'} ${!levelMet ? 'opacity-30' : ''}`}>
                    <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: skin.value }} />
                    <div className="text-center font-orbitron uppercase text-[9px] text-white tracking-tighter">{skin.name}</div>
                    {isUnlocked ? (
                      <button onClick={() => onEquipCosmetic('SKINS', skin.id)} className={`w-full py-2 rounded-lg text-[9px] font-bold font-orbitron ${isActive ? 'bg-cyan-500 text-black' : 'bg-gray-800 text-cyan-400'}`}>{isActive ? 'ACTIVE' : 'EQUIP'}</button>
                    ) : (
                      <button disabled={coins < skin.cost || !levelMet} onClick={() => onBuyCosmetic('SKINS', skin.id, skin.cost)} className="w-full bg-yellow-600 py-2 rounded-lg text-[9px] font-bold font-orbitron text-black">{skin.cost} CR</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'effects' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-cyan-400 font-orbitron text-[10px] mb-3 uppercase tracking-widest font-bold">Neural Trails</h3>
                <div className="grid grid-cols-2 gap-3">
                  {COSMETICS.TRAILS.map(trail => {
                    const isUnlocked = unlockedCosmetics.TRAILS.includes(trail.id);
                    const isActive = activeCosmetics.TRAILS === trail.id;
                    return (
                      <button key={trail.id} onClick={() => isUnlocked ? onEquipCosmetic('TRAILS', trail.id) : (coins >= trail.cost && onBuyCosmetic('TRAILS', trail.id, trail.cost))} className={`p-3 border-2 rounded-xl text-left transition-all ${isActive ? 'border-cyan-500 bg-cyan-500/10' : 'border-white/5 bg-black/40'}`}>
                         <div className="text-[10px] font-orbitron text-white uppercase">{trail.name}</div>
                         <div className="text-[8px] text-cyan-500/50 mt-1">{isActive ? 'Equipped' : isUnlocked ? 'Owned' : `${trail.cost} CR`}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <h3 className="text-red-400 font-orbitron text-[10px] mb-3 uppercase tracking-widest font-bold">Termination FX</h3>
                <div className="grid grid-cols-2 gap-3">
                  {COSMETICS.DEATH_FX.map(fx => {
                    const isUnlocked = unlockedCosmetics.DEATH_FX.includes(fx.id);
                    const isActive = activeCosmetics.DEATH_FX === fx.id;
                    return (
                      <button key={fx.id} onClick={() => isUnlocked ? onEquipCosmetic('DEATH_FX', fx.id) : (coins >= fx.cost && onBuyCosmetic('DEATH_FX', fx.id, fx.cost))} className={`p-3 border-2 rounded-xl text-left transition-all ${isActive ? 'border-red-500 bg-red-500/10' : 'border-white/5 bg-black/40'}`}>
                         <div className="text-[10px] font-orbitron text-white uppercase">{fx.name}</div>
                         <div className="text-[8px] text-red-500/50 mt-1">{isActive ? 'Equipped' : isUnlocked ? 'Owned' : `${fx.cost} CR`}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'boosts' && (
            <div className="space-y-4">
              <BoostRow label="Double Credits" desc="1 CR every 100m next round" cost={BOOST_COSTS.DOUBLE_CREDITS} active={doubleCreditsActive} coins={coins} onBuy={() => onBuyBoost('double_credits', BOOST_COSTS.DOUBLE_CREDITS)} />
              <BoostRow label="Double Jump" desc="Mid-air tactical jump next round" cost={BOOST_COSTS.DOUBLE_JUMP} active={doubleJumpActive} coins={coins} onBuy={() => onBuyBoost('double_jump', BOOST_COSTS.DOUBLE_JUMP)} />
            </div>
          )}

          {tab === 'levels' && (
            <div className="space-y-4">
              {LEVEL_BOOSTS.map(boost => (
                <div key={boost.id} className="p-5 bg-black/40 border-2 border-purple-500/20 rounded-[1.5rem] flex justify-between items-center">
                  <div>
                    <div className="text-purple-400 font-bold uppercase text-xs tracking-widest font-orbitron">{boost.name}</div>
                    <div className="text-white/50 text-[10px] mt-1 italic">{boost.desc}</div>
                  </div>
                  <button disabled={levelPoints < boost.cost || activeLevelBoosts.includes(boost.id)} onClick={() => onSpendLevelPoints(boost.id, boost.cost)} className="bg-purple-600 px-6 py-3 rounded-xl text-[10px] font-bold font-orbitron text-white">{activeLevelBoosts.includes(boost.id) ? 'PREPPED' : `${boost.cost} PTS`}</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => { sfx.playClick(); onClose(); }} className="w-full mt-6 py-5 border-2 border-cyan-500 text-cyan-500 hover:bg-cyan-500 hover:text-black font-orbitron font-bold rounded-2xl shadow-[0_0_30px_rgba(0,255,255,0.2)] uppercase tracking-widest">Exit Terminal</button>
      </div>
    </div>
  );
};

const UpgradeRow: React.FC<{ label: string, desc: string, sub: string, cost: number, color: string, coins: number, onBuy: () => void }> = ({ label, desc, sub, cost, color, coins, onBuy }) => (
  <div className={`flex justify-between items-center p-5 bg-black/50 border-2 rounded-2xl border-${color}-500/30`}>
    <div>
      <div className={`text-${color}-400 font-bold uppercase text-xs tracking-[0.2em] font-orbitron`}>{label}</div>
      <div className="text-white/60 text-[10px] font-orbitron mt-1">{desc}</div>
      <div className="text-[9px] opacity-40 uppercase font-orbitron mt-0.5">{sub}</div>
    </div>
    <button disabled={coins < cost} onClick={onBuy} className={`bg-${color}-600 disabled:bg-gray-800 px-6 py-3 rounded-xl text-[10px] font-bold font-orbitron text-white transition-all`}>{cost.toLocaleString()} CR</button>
  </div>
);

const BoostRow: React.FC<{ label: string, desc: string, cost: number, active: boolean, coins: number, onBuy: () => void }> = ({ label, desc, cost, active, coins, onBuy }) => (
  <div className="p-6 bg-black/40 border-2 border-cyan-500/30 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
    <div className="text-center md:text-left">
      <div className="text-cyan-400 font-bold uppercase text-sm tracking-[0.2em] font-orbitron">{label}</div>
      <div className="text-white/60 text-[10px] mt-1 font-orbitron">{desc}</div>
    </div>
    <button disabled={coins < cost || active} onClick={onBuy} className="w-full md:w-auto bg-cyan-600 disabled:bg-gray-800 px-8 py-3 rounded-xl text-[10px] font-bold font-orbitron text-white">{active ? 'PREPPED' : `${cost} CR`}</button>
  </div>
);

export default Shop;


import React, { useState, useRef, useEffect } from 'react';
import { Platform, Turret, CustomLevel, PlatformType } from '../types.ts';
import { CANVAS_WIDTH, CANVAS_HEIGHT, PLATFORM_WIDTH, PLATFORM_HEIGHT, COLORS } from '../constants.ts';
import { getPlatformColor } from './GameCanvas.tsx';

interface LevelEditorProps {
  onSave: (level: CustomLevel) => void;
  onClose: () => void;
}

const LevelEditor: React.FC<LevelEditorProps> = ({ onSave, onClose }) => {
  const [levelName, setLevelName] = useState('Sector ' + Math.floor(Math.random() * 1000));
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [turrets, setTurrets] = useState<Turret[]>([]);
  const [selectedType, setSelectedType] = useState<PlatformType | 'turret' | 'eraser'>('normal');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const EDITOR_HEIGHT = 3000; 

  // Scroll to the absolute bottom on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (selectedType === 'eraser') {
      setPlatforms(platforms.filter(p => !(x > p.x && x < p.x + p.width && y > p.y && y < p.y + p.height)));
      setTurrets(turrets.filter(t => !(Math.abs(y - t.y) < 20 && (t.side === 'left' ? x < 30 : x > CANVAS_WIDTH - 30))));
    } else if (selectedType === 'turret') {
      const side = x < CANVAS_WIDTH / 2 ? 'left' : 'right';
      setTurrets([...turrets, { y, side, fireCooldown: 0, fired: false }]);
    } else {
      setPlatforms([...platforms, {
        x: Math.max(0, Math.min(CANVAS_WIDTH - PLATFORM_WIDTH, x - PLATFORM_WIDTH / 2)),
        y: y - PLATFORM_HEIGHT / 2,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type: selectedType as PlatformType,
        dx: selectedType === 'moving' ? 1 : 0,
        broken: false
      }]);
    }
  };

  const clearLevel = () => {
    setPlatforms([]);
    setTurrets([]);
  };

  const saveLevel = () => {
    if (platforms.length === 0) {
      alert("Add at least one platform to your sector!");
      return;
    }
    onSave({
      id: Date.now().toString(),
      name: levelName,
      platforms,
      turrets
    });
  };

  const types: (PlatformType | 'turret' | 'eraser')[] = ['normal', 'moving', 'breakable', 'spring', 'teleport', 'speed', 'immunity', 'kill', 'turret', 'eraser'];

  const spawnX = CANVAS_WIDTH / 2 - 12.5;
  const spawnY = EDITOR_HEIGHT - 100;

  // Create altitude labels every 250px (50 meters)
  const altitudeLabels = [];
  for (let y = EDITOR_HEIGHT; y >= 0; y -= 250) {
    const meters = (EDITOR_HEIGHT - y) / 5;
    altitudeLabels.push({ y, meters });
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#020205] flex flex-col font-orbitron animate-in fade-in duration-500">
      <div className="bg-gray-900/80 backdrop-blur-md p-5 flex justify-between items-center border-b-2 border-cyan-500 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
        <div className="flex items-center space-x-6">
          <button onClick={onClose} className="bg-gray-800 hover:bg-white text-cyan-400 hover:text-black px-4 py-2 rounded-xl transition-all font-bold border border-cyan-500/30">
            <i className="fas fa-home mr-2"></i> HOME
          </button>
          <div className="h-6 w-[1px] bg-white/10"></div>
          <input 
            value={levelName}
            onChange={e => setLevelName(e.target.value)}
            className="bg-black border-2 border-cyan-500/20 text-cyan-400 px-4 py-2 rounded-xl outline-none text-sm focus:border-cyan-500 transition-all min-w-[200px]"
            placeholder="SECTOR NAME"
          />
        </div>
        <div className="flex space-x-4">
          <button onClick={clearLevel} className="bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white px-6 py-2 rounded-xl border border-red-500/50 text-xs font-bold transition-all">CLEAR</button>
          <button onClick={saveLevel} className="bg-cyan-500 text-black px-8 py-2 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(0,255,255,0.4)] hover:scale-105 transition-all">SAVE ARCHIVE</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox */}
        <div className="w-24 bg-gray-900 border-r border-cyan-500/30 flex flex-col items-center py-6 space-y-5 overflow-y-auto custom-scrollbar">
          {types.map(t => (
            <button 
              key={t} 
              onClick={() => setSelectedType(t)}
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${selectedType === t ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(0,255,255,0.4)] scale-110' : 'bg-gray-800 text-cyan-500 border border-cyan-500/20 hover:border-cyan-500'}`}
              title={t}
            >
              {t === 'eraser' ? (
                <i className="fas fa-eraser text-lg"></i>
              ) : t === 'turret' ? (
                <i className="fas fa-crosshairs text-red-500 text-lg"></i>
              ) : (
                <div 
                  className="w-5 h-2 rounded-sm" 
                  style={{ backgroundColor: getPlatformColor(t as PlatformType) }} 
                />
              )}
              <span className="text-[7px] mt-1 font-bold uppercase opacity-60">{t.slice(0, 4)}</span>
            </button>
          ))}
          <div className="text-[9px] text-cyan-500/30 rotate-90 mt-auto pb-4 whitespace-nowrap uppercase tracking-widest font-bold">ARCHITECT TOOLS</div>
        </div>

        {/* Editor Area with Altitude Ruler */}
        <div className="flex-1 overflow-auto bg-[#020208] custom-scrollbar p-10 flex" ref={scrollContainerRef}>
          {/* Altitude Ruler */}
          <div className="relative mr-4 w-12 border-r border-white/10 select-none" style={{ height: EDITOR_HEIGHT }}>
            {altitudeLabels.map(label => (
              <div 
                key={label.y} 
                className="absolute right-2 text-[8px] font-bold text-white/40 flex items-center"
                style={{ top: label.y, transform: 'translateY(-50%)' }}
              >
                <div className="w-2 h-[1px] bg-white/20 mr-1"></div>
                {label.meters}M
              </div>
            ))}
          </div>

          <div 
            className="relative cursor-crosshair shadow-[0_0_100px_rgba(0,255,255,0.05)] border-2 border-white/5"
            style={{ width: CANVAS_WIDTH, height: EDITOR_HEIGHT, backgroundColor: '#020205' }}
            onClick={handleCanvasClick}
          >
            {/* Grid */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(0,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            
            {/* Start Line */}
            <div className="absolute bottom-0 w-full h-1 bg-cyan-500/30 flex items-center justify-center">
              <span className="text-[12px] text-cyan-500/40 font-bold tracking-[0.5em] uppercase">0 METERS - DEPLOYMENT</span>
            </div>

            {/* Spawn Marker */}
            <div 
              className="absolute border-2 border-cyan-500/50 bg-cyan-500/20 flex flex-col items-center justify-center z-10 animate-pulse pointer-events-none"
              style={{ left: spawnX, top: spawnY, width: 25, height: 25 }}
            >
              <i className="fas fa-user-astronaut text-[8px] text-cyan-500"></i>
              <span className="absolute -top-4 text-[6px] text-cyan-500 font-bold">SPAWN</span>
            </div>

            {/* Elements */}
            {platforms.map((p, i) => (
              <div 
                key={'p' + i} 
                className="absolute border border-white/20"
                style={{ left: p.x, top: p.y, width: p.width, height: p.height, backgroundColor: getPlatformColor(p.type) }}
              />
            ))}
            {turrets.map((t, i) => (
              <div 
                key={'t' + i} 
                className="absolute w-4 h-6 bg-red-600 border border-white/40"
                style={{ left: t.side === 'left' ? 0 : CANVAS_WIDTH - 16, top: t.y }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 p-3 text-center text-[10px] text-cyan-500/50 uppercase tracking-widest border-t border-cyan-500/30 font-bold">
        Architectural Interface: {levelName} | Grid: 40px Sync | Start Height: 0M (Bottom)
      </div>
    </div>
  );
};

export default LevelEditor;

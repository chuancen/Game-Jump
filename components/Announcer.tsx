
import React, { useEffect, useState } from 'react';
import { AnnouncerMessage } from '../types.ts';

interface AnnouncerProps {
  message: AnnouncerMessage | null;
}

const Announcer: React.FC<AnnouncerProps> = ({ message }) => {
  const [visible, setVisible] = useState(false);
  const [displayMessage, setDisplayMessage] = useState<AnnouncerMessage | null>(null);

  useEffect(() => {
    if (message) {
      setDisplayMessage(message);
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 5500);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!displayMessage) return null;

  const colorClass = 
    displayMessage.type === 'praise' ? 'text-green-400 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]' :
    displayMessage.type === 'insult' ? 'text-red-400 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.3)]' :
    'text-cyan-400 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]';

  const avatarColor = 
    displayMessage.type === 'praise' ? 'bg-green-500' :
    displayMessage.type === 'insult' ? 'bg-red-500' :
    'bg-cyan-500';

  return (
    <div className={`fixed top-1/2 right-6 -translate-y-1/2 z-[100] transition-all duration-700 ease-out transform ${visible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-20 opacity-0 scale-95'}`}>
      <div className={`bg-black/95 backdrop-blur-3xl px-6 py-5 rounded-2xl border-2 max-w-[260px] text-left flex flex-col ${colorClass}`}>
        <div className="flex items-center space-x-3 mb-3">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${avatarColor}`}></div>
            <div className={`absolute inset-0 w-3 h-3 rounded-full animate-ping ${avatarColor}`}></div>
          </div>
          <div className="text-[9px] uppercase tracking-[0.4em] font-bold font-orbitron opacity-70">Aurora Link</div>
        </div>
        <div className="relative">
          <p className="text-xs font-orbitron leading-relaxed italic font-medium">
            "{displayMessage.text}"
          </p>
        </div>
        <div className="mt-4 w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full animate-[progress_5s_linear_forwards] ${avatarColor}`} style={{ width: '100%' }}></div>
        </div>
      </div>
      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default Announcer;

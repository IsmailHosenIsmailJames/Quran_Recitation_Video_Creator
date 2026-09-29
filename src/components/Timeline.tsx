import React from 'react';
import { Layers, Clock } from 'lucide-react';
import { AyahData } from '../types';

interface TimelineProps {
  ayahs: AyahData[];
  currentAyahIndex: number;
  onAyahClick: (index: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  ayahs,
  currentAyahIndex,
  onAyahClick,
}) => {
  const totalDuration = ayahs.reduce((acc, a) => acc + (a.duration || 5), 0);

  return (
    <div className="h-28 bg-[#0f172a] border-t border-slate-800 px-6 py-2.5 flex flex-col justify-between select-none z-20">
      {/* Timeline Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
        <div className="flex items-center space-x-2">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-200">Ayah Sequencer Timeline</span>
          <span className="text-slate-500">({ayahs.length} verses)</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-[11px]">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Total Audio Duration: {formatDuration(totalDuration)}</span>
        </div>
      </div>

      {/* Ayahs Scrollable Track */}
      <div className="flex-1 flex items-center space-x-2.5 overflow-x-auto pb-1 scrollbar-thin">
        {ayahs.map((item, idx) => {
          const isActive = idx === currentAyahIndex;
          return (
            <div
              key={idx}
              onClick={() => onAyahClick(idx)}
              className={`flex-shrink-0 w-36 h-14 rounded-xl p-2 flex flex-col justify-between border cursor-pointer transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-600/20 border-emerald-500 shadow-md shadow-emerald-950/40 translate-y-[-1px]'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Ayah {item.ayah}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {item.duration ? `${item.duration.toFixed(1)}s` : '~5.0s'}
                </span>
              </div>
              <p className="text-[11px] font-arabic text-slate-300 truncate text-right">
                {item.arabicText}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

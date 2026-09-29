import React from 'react';
import { Film, Sparkles, Download, Monitor, Smartphone } from 'lucide-react';
import { StylingConfig } from '../types';

interface NavbarProps {
  styling: StylingConfig;
  onStylingChange: (styling: StylingConfig) => void;
  onExportClick: () => void;
  isRendering: boolean;
  onApplyPreset: (preset: 'annaffee' | 'minimal' | 'traditional') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  styling,
  onStylingChange,
  onExportClick,
  isRendering,
  onApplyPreset,
}) => {
  return (
    <header className="h-16 bg-[#0f172a] border-b border-slate-800 px-6 flex items-center justify-between select-none z-30">
      {/* Brand */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Film className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            Quran Recitation Video Studio
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Tauri Desktop
            </span>
          </h1>
          <p className="text-xs text-slate-400">An Nafee Aesthetic Recitation Editor</p>
        </div>
      </div>

      {/* Middle Tools: Aspect Ratio & Presets */}
      <div className="flex items-center space-x-4">
        {/* Aspect Ratio Switcher */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-1 flex items-center space-x-1">
          <button
            onClick={() => onStylingChange({ ...styling, aspectRatio: '16:9' })}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              styling.aspectRatio === '16:9'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>16:9 Landscape</span>
          </button>
          <button
            onClick={() => onStylingChange({ ...styling, aspectRatio: '9:16' })}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              styling.aspectRatio === '9:16'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>9:16 Shorts/Reels</span>
          </button>
        </div>

        {/* Style Presets */}
        <div className="flex items-center space-x-2 border-l border-slate-800 pl-4">
          <span className="text-xs text-slate-400 font-medium">Presets:</span>
          <button
            onClick={() => onApplyPreset('annaffee')}
            className="flex items-center space-x-1 text-xs px-2.5 py-1.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>An Nafee Official</span>
          </button>
          <button
            onClick={() => onApplyPreset('minimal')}
            className="text-xs px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Clean White
          </button>
          <button
            onClick={() => onApplyPreset('traditional')}
            className="text-xs px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Indo-Pak Gold
          </button>
        </div>
      </div>

      {/* Action / Export Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onExportClick}
          disabled={isRendering}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-900/30 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
        >
          {isRendering ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Rendering...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export Video (1080p)</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

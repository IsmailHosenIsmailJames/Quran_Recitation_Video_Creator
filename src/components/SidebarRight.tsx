import React from 'react';
import { Type, Sliders, Shield, Palette } from 'lucide-react';
import { StylingConfig } from '../types';

interface SidebarRightProps {
  styling: StylingConfig;
  onStylingChange: (styling: StylingConfig) => void;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({
  styling,
  onStylingChange,
}) => {
  return (
    <aside className="w-80 bg-[#0f172a] border-l border-slate-800 flex flex-col h-[calc(100vh-4rem)] select-none overflow-y-auto p-4 space-y-6">
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <Sliders className="w-4 h-4 text-emerald-400" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
          Style & Layer Inspector
        </h2>
      </div>

      {/* SECTION 1: ARABIC TYPOGRAPHY */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-emerald-400" />
            Arabic Typography
          </span>
        </div>

        {/* Font Family */}
        <div>
          <label className="text-[11px] text-slate-400 mb-1 block">Arabic Font</label>
          <select
            value={styling.arabicFont}
            onChange={(e) => onStylingChange({ ...styling, arabicFont: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="KFGQPC Hafs">KFGQPC Uthmanic Hafs (Madani Standard)</option>
            <option value="AlQuran Neo">AlQuran Neo v5.1 (Indo-Pak / Subcontinent)</option>
            <option value="Amiri">Amiri Quran (Classical Naskh)</option>
            <option value="Al Qalam">Al Qalam Quran Majeed</option>
            <option value="Lateef">Lateef</option>
          </select>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Font Size</span>
            <span className="text-white font-mono">{styling.arabicFontSize}px</span>
          </div>
          <input
            type="range"
            min={32}
            max={72}
            value={styling.arabicFontSize}
            onChange={(e) =>
              onStylingChange({ ...styling, arabicFontSize: parseInt(e.target.value) })
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        {/* Colors & Glow */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={styling.arabicColor}
                onChange={(e) => onStylingChange({ ...styling, arabicColor: e.target.value })}
                className="w-7 h-7 rounded border border-slate-700 bg-transparent cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-300">{styling.arabicColor}</span>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 mb-1 block">Outer Glow</label>
            <button
              onClick={() => onStylingChange({ ...styling, arabicGlow: !styling.arabicGlow })}
              className={`w-full py-1 px-2 rounded-lg text-xs font-medium border transition-colors ${
                styling.arabicGlow
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-900 border-slate-700 text-slate-400'
              }`}
            >
              {styling.arabicGlow ? 'Glow On' : 'Glow Off'}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 2: TRANSLATION (BENGALI) */}
      <div className="space-y-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            Bengali Translation Style
          </span>
        </div>

        {/* Font Family */}
        <div>
          <label className="text-[11px] text-slate-400 mb-1 block">Font</label>
          <select
            value={styling.translationFont}
            onChange={(e) => onStylingChange({ ...styling, translationFont: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="Li Alinur Nakkhatra">Li Alinur Nakkhatra Unicode</option>
            <option value="sans-serif">System Sans-Serif</option>
          </select>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Font Size</span>
            <span className="text-white font-mono">{styling.translationFontSize}px</span>
          </div>
          <input
            type="range"
            min={22}
            max={54}
            value={styling.translationFontSize}
            onChange={(e) =>
              onStylingChange({ ...styling, translationFontSize: parseInt(e.target.value) })
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Color Presets */}
        <div>
          <label className="text-[11px] text-slate-400 mb-1.5 block">Color Palette</label>
          <div className="flex items-center space-x-2">
            {[
              { label: 'An Nafee Gold', val: '#FFE27D' },
              { label: 'Warm Amber', val: '#FCD34D' },
              { label: 'Pure White', val: '#FFFFFF' },
              { label: 'Cyan Glow', val: '#67E8F9' },
            ].map((c) => (
              <button
                key={c.val}
                onClick={() => onStylingChange({ ...styling, translationColor: c.val })}
                style={{ backgroundColor: c.val }}
                title={c.label}
                className={`w-6 h-6 rounded-full border-2 transition-transform ${
                  styling.translationColor.toLowerCase() === c.val.toLowerCase()
                    ? 'border-white scale-110 shadow-lg'
                    : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Decorative Divider */}
        <div className="pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Show Decorative Divider (✦)</span>
            <input
              type="checkbox"
              checked={styling.showDivider}
              onChange={(e) => onStylingChange({ ...styling, showDivider: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: OVERLAY SCRIM (SHADOW) */}
      <div className="space-y-3 pt-3 border-t border-slate-800/80">
        <span className="text-xs font-semibold text-slate-300 block">
          Bottom Scrim Shadow (Contrast)
        </span>

        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Darkness Opacity</span>
            <span className="text-white font-mono">
              {Math.round(styling.scrimDarkness * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={styling.scrimDarkness * 100}
            onChange={(e) =>
              onStylingChange({ ...styling, scrimDarkness: parseInt(e.target.value) / 100 })
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Shadow Height Coverage</span>
            <span className="text-white font-mono">
              {Math.round(styling.scrimHeight * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={20}
            max={80}
            value={styling.scrimHeight * 100}
            onChange={(e) =>
              onStylingChange({ ...styling, scrimHeight: parseInt(e.target.value) / 100 })
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
        </div>
      </div>

      {/* SECTION 4: BRANDING & WATERMARK */}
      <div className="space-y-3 pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            Badges & Watermark
          </span>
        </div>

        {/* Surah Calligraphy Badge (Top-Left) */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Surah Calligraphy Badge</span>
            <input
              type="checkbox"
              checked={styling.showSurahBadge}
              onChange={(e) =>
                onStylingChange({ ...styling, showSurahBadge: e.target.checked })
              }
              className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700"
            />
          </div>
          {styling.showSurahBadge && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">Show Bengali Subtitle</span>
              <input
                type="checkbox"
                checked={styling.showSurahSubtitle}
                onChange={(e) =>
                  onStylingChange({ ...styling, showSurahSubtitle: e.target.checked })
                }
                className="w-3.5 h-3.5 rounded text-emerald-600 bg-slate-950 border-slate-700"
              />
            </div>
          )}
        </div>

        {/* Channel Watermark (Top-Right) */}
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Channel Watermark</span>
            <input
              type="checkbox"
              checked={styling.showWatermark}
              onChange={(e) =>
                onStylingChange({ ...styling, showWatermark: e.target.checked })
              }
              className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700"
            />
          </div>

          {styling.showWatermark && (
            <>
              <input
                type="text"
                value={styling.watermarkText}
                onChange={(e) =>
                  onStylingChange({ ...styling, watermarkText: e.target.value })
                }
                placeholder="Watermark name (e.g. An Nafee)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Opacity</span>
                  <span className="text-white font-mono">
                    {Math.round(styling.watermarkOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={styling.watermarkOpacity * 100}
                  onChange={(e) =>
                    onStylingChange({
                      ...styling,
                      watermarkOpacity: parseInt(e.target.value) / 100,
                    })
                  }
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
};

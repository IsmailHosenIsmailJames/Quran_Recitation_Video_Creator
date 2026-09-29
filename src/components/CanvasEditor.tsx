import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, MoveVertical } from 'lucide-react';
import { AyahData, BackgroundMedia, StylingConfig, Surah } from '../types';

interface CanvasEditorProps {
  surah: Surah | null;
  ayahs: AyahData[];
  currentAyahIndex: number;
  onAyahIndexChange: (idx: number) => void;
  backgroundMedia: BackgroundMedia;
  styling: StylingConfig;
  onStylingChange: (styling: StylingConfig) => void;
  isLoading?: boolean;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  surah,
  ayahs,
  currentAyahIndex,
  onAyahIndexChange,
  backgroundMedia,
  styling,
  onStylingChange,
  isLoading = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDraggingText, setIsDraggingText] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);

  const currentAyah = ayahs[currentAyahIndex] || null;

  // Handle Audio playback changes when Ayah changes
  useEffect(() => {
    if (audioRef.current && currentAyah?.audioUrl) {
      audioRef.current.src = currentAyah.audioUrl;
      if (isPlaying) {
        audioRef.current.play().catch((e) => console.warn('Audio play error:', e));
      }
    }
  }, [currentAyahIndex, currentAyah?.audioUrl]);

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleAudioEnded = () => {
    if (currentAyahIndex < ayahs.length - 1) {
      onAyahIndexChange(currentAyahIndex + 1);
    } else {
      setIsPlaying(false);
      onAyahIndexChange(0);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((e) => {
        console.warn('Audio play error:', e);
      });
    }
  };

  // Dragging text block vertically on the canvas
  const handleMouseDownOnText = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingText(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingText || !canvasContainerRef.current) return;
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const relativeY = ((e.clientY - rect.top) / rect.height) * 100;
      const clampedY = Math.max(30, Math.min(88, relativeY));
      onStylingChange({ ...styling, textPositionY: Math.round(clampedY) });
    };

    const handleMouseUp = () => {
      setIsDraggingText(false);
    };

    if (isDraggingText) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingText, styling, onStylingChange]);

  const surahCode = surah ? `surah${String(surah.id).padStart(3, '0')}` : 'surah001';

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-6 bg-[#070b12] relative overflow-hidden select-none">
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />

      {/* Top Info Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-slate-400 mb-3 px-2">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-slate-200">
            {surah ? `${surah.name_en} (${surah.name_ar})` : 'Select Surah'}
          </span>
          {currentAyah && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Ayah {currentAyah.ayah} of {ayahs.length} in range
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-slate-500">
          <span>Click & drag text vertically on canvas</span>
          <MoveVertical className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* Interactive Video Canvas Container */}
      <div className="flex-1 w-full flex items-center justify-center min-h-0">
        <div
          ref={canvasContainerRef}
          className={`relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 transition-all ${
            styling.aspectRatio === '9:16'
              ? 'h-full aspect-[9/16] max-h-[720px]'
              : 'w-full max-w-[960px] aspect-video max-h-[540px]'
          }`}
          style={{ backgroundColor: '#000000' }}
        >
          {/* LAYER 1: Background Media */}
          {backgroundMedia.type === 'video' ? (
            <video
              src={backgroundMedia.url}
              autoPlay
              loop={backgroundMedia.loop}
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img
              src={backgroundMedia.url}
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* LAYER 2: Bottom Scrim Shadow Gradient */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none transition-all"
            style={{
              height: `${styling.scrimHeight * 100}%`,
              background: `linear-gradient(to top, rgba(0, 0, 0, ${styling.scrimDarkness}), rgba(0, 0, 0, 0))`,
            }}
          />

          {/* LAYER 3: Top-Left Surah Calligraphy Badge */}
          {styling.showSurahBadge && (
            <div className="absolute top-6 left-7 flex flex-col items-start pointer-events-none z-10">
              <span
                style={{
                  fontFamily: 'surah-name',
                  fontSize: `${styling.surahBadgeSize}px`,
                  color: styling.surahBadgeColor,
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                  lineHeight: '1.1',
                }}
              >
                {surahCode}
              </span>
              {styling.showSurahSubtitle && surah && (
                <span
                  className="bengali-translation-text text-xs text-white/80 font-medium mt-1"
                  style={{
                    fontFamily: `'${styling.translationFont}', 'Li Alinur Nakkhatra', sans-serif`,
                    textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                  }}
                >
                  {surah.name_bn}
                </span>
              )}
            </div>
          )}

          {/* LAYER 4: Top-Right Channel Watermark */}
          {styling.showWatermark && (
            <div
              className="absolute top-6 right-7 pointer-events-none z-10"
              style={{
                opacity: styling.watermarkOpacity,
              }}
            >
              <span
                style={{
                  fontSize: `${styling.watermarkSize}px`,
                  color: '#ffffff',
                  fontFamily: `'${styling.watermarkFont || 'cursive'}', cursive, sans-serif`,
                  textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                }}
                className="font-medium tracking-wider"
              >
                {styling.watermarkText}
              </span>
            </div>
          )}

          {/* LAYER 5: Central / Lower-Third Quran Ayah Text Stack */}
          <div
            onMouseDown={handleMouseDownOnText}
            className={`absolute left-0 right-0 px-8 flex flex-col items-center justify-center text-center cursor-move transition-transform ${
              isDraggingText ? 'scale-[1.02] ring-1 ring-emerald-500/50 rounded-xl' : ''
            }`}
            style={{
              top: `${styling.textPositionY}%`,
              transform: 'translateY(-50%)',
            }}
          >
            {currentAyah ? (
              <div className="space-y-3 max-w-[90%]">
                {/* Arabic Ayah */}
                <p
                  dir="rtl"
                  lang="ar"
                  style={{
                    fontFamily:
                      styling.arabicFont === 'AlQuran Neo' || styling.arabicFont === 'Indopak Nastaleeq'
                        ? "'AlQuran Neo', 'AlQuranNeo', 'Al-Qalam', serif"
                        : styling.arabicFont === 'Amiri'
                        ? "'Amiri', serif"
                        : styling.arabicFont === 'Al Qalam'
                        ? "'Al Qalam', 'Al-Qalam', serif"
                        : styling.arabicFont === 'Lateef'
                        ? "'Lateef', serif"
                        : "'KFGQPC Hafs', 'QPC Hafs', serif",
                    fontSize: `${styling.arabicFontSize}px`,
                    color: styling.arabicColor,
                    lineHeight: '1.85',
                    letterSpacing: '0px',
                    fontFeatureSettings: '"liga" 1, "mset" 1, "mark" 1, "mkmk" 1, "curs" 1',
                    textShadow: styling.arabicGlow
                      ? `0 0 16px ${styling.arabicGlowColor}, 0 2px 8px rgba(0,0,0,0.9)`
                      : '0 2px 10px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.8)',
                  }}
                  className="quran-arabic-text font-normal"
                >
                  {currentAyah.arabicText}
                </p>

                {/* Optional Ornamental Separator */}
                {styling.showDivider && (
                  <div
                    className="flex items-center justify-center space-x-2 py-0.5"
                    style={{
                      color: styling.dividerColor,
                      opacity: styling.dividerOpacity,
                    }}
                  >
                    <div className="h-[1px] w-16 bg-current" />
                    <span className="text-xs">✦</span>
                    <div className="h-[1px] w-16 bg-current" />
                  </div>
                )}

                {/* Bengali Translation */}
                <p
                  style={{
                    fontFamily: `'${styling.translationFont}', 'Li Alinur Nakkhatra', sans-serif`,
                    fontSize: `${styling.translationFontSize}px`,
                    color: styling.translationColor,
                    lineHeight: '1.5',
                    textShadow: styling.translationShadow
                      ? '0 2px 8px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,0.8)'
                      : 'none',
                  }}
                  className="bengali-translation-text font-medium"
                >
                  {currentAyah.primaryTranslationText}
                </p>

                {/* Optional English Translation */}
                {styling.showSecondaryTranslation && currentAyah.secondaryTranslationText && (
                  <p
                    style={{
                      fontSize: `${styling.secondaryFontSize}px`,
                      color: styling.secondaryColor,
                      lineHeight: '1.4',
                      textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                    }}
                    className="font-sans uppercase tracking-wider text-slate-300"
                  >
                    {currentAyah.secondaryTranslationText}
                  </p>
                )}
              </div>
            ) : isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-2 py-4">
                <div className="w-7 h-7 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
                <p className="text-emerald-400/80 text-xs font-medium">Loading Ayah script & translation...</p>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No Ayahs loaded in selected range</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Audio Player Controls Bar */}
      <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 mt-3 shadow-xl backdrop-blur-md flex items-center justify-between">
        {/* Playback Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onAyahIndexChange(Math.max(0, currentAyahIndex - 1))}
            disabled={currentAyahIndex === 0}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlayPause}
            className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </button>

          <button
            onClick={() =>
              onAyahIndexChange(Math.min(ayahs.length - 1, currentAyahIndex + 1))
            }
            disabled={currentAyahIndex === ayahs.length - 1}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar & Ayah Counter */}
        <div className="flex-1 mx-6 flex items-center space-x-3">
          <span className="text-xs font-mono text-slate-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => {
                const t = parseFloat(e.target.value);
                if (audioRef.current) {
                  audioRef.current.currentTime = t;
                  setCurrentTime(t);
                }
              }}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
          <span className="text-xs font-mono text-slate-500 w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Current Ayah Pill */}
        <div className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
          Verse {currentAyah ? currentAyah.ayah : 1} / {ayahs.length}
        </div>
      </div>
    </div>
  );
};

function formatTime(sec: number): string {
  if (isNaN(sec) || sec === 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

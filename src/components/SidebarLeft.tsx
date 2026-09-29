import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Upload,
  Search,
  Check,
  Film
} from 'lucide-react';
import { Surah, Reciter, TranslationBook, BackgroundMedia } from '../types';
import { open } from '@tauri-apps/plugin-dialog';

interface SidebarLeftProps {
  surahs: Surah[];
  selectedSurah: Surah | null;
  onSurahChange: (surah: Surah) => void;
  fromAyah: number;
  toAyah: number;
  onRangeChange: (from: number, to: number) => void;

  reciters: Reciter[];
  selectedReciter: Reciter | null;
  onReciterChange: (reciter: Reciter) => void;

  scriptType: 'hafs' | 'indopak';
  onScriptTypeChange: (script: 'hafs' | 'indopak') => void;

  translationsList: TranslationBook[];
  primaryTranslation: TranslationBook | null;
  onPrimaryTranslationChange: (book: TranslationBook) => void;

  secondaryTranslation: TranslationBook | null;
  onSecondaryTranslationChange: (book: TranslationBook | null) => void;
  showSecondary: boolean;
  onToggleSecondary: (show: boolean) => void;

  backgroundMedia: BackgroundMedia;
  onBackgroundMediaChange: (media: BackgroundMedia) => void;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  surahs,
  selectedSurah,
  onSurahChange,
  fromAyah,
  toAyah,
  onRangeChange,
  reciters,
  selectedReciter,
  onReciterChange,
  scriptType,
  onScriptTypeChange,
  translationsList,
  primaryTranslation,
  onPrimaryTranslationChange,
  secondaryTranslation,
  onSecondaryTranslationChange,
  showSecondary,
  onToggleSecondary,
  backgroundMedia,
  onBackgroundMediaChange,
}) => {
  const [activeTab, setActiveTab] = useState<'quran' | 'audio' | 'media'>('quran');
  const [surahSearch, setSurahSearch] = useState('');
  const [reciterSearch, setReciterSearch] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const filteredSurahs = surahs.filter((s) => {
    const q = surahSearch.toLowerCase();
    return (
      s.name_en.toLowerCase().includes(q) ||
      s.name_bn.toLowerCase().includes(q) ||
      s.name_ar.includes(q) ||
      String(s.id).includes(q)
    );
  });

  const filteredReciters = reciters.filter((r) =>
    r.name.toLowerCase().includes(reciterSearch.toLowerCase()) ||
    r.style.toLowerCase().includes(reciterSearch.toLowerCase())
  );

  const bengaliTranslations = translationsList.filter(
    (t) => t.language.toLowerCase() === 'bengali'
  );
  const englishTranslations = translationsList.filter(
    (t) => t.language.toLowerCase() === 'english'
  );

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const isVideo = file.type.startsWith('video') || file.name.match(/\.(mp4|mov|webm|mkv)$/i);
      const url = URL.createObjectURL(file);
      onBackgroundMediaChange({
        type: isVideo ? 'video' : 'image',
        url,
        localPath: (file as any).path || url,
        name: file.name,
        loop: true,
      });
    }
  };

  const handleBrowseMedia = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Media (Video / Image)',
            extensions: ['mp4', 'mov', 'webm', 'mkv', 'jpg', 'jpeg', 'png'],
          },
        ],
      });
      if (selected && typeof selected === 'string') {
        const isVideo = selected.match(/\.(mp4|mov|webm|mkv)$/i);
        const filename = selected.split('/').pop() || selected.split('\\').pop() || 'media';
        onBackgroundMediaChange({
          type: isVideo ? 'video' : 'image',
          url: selected,
          localPath: selected,
          name: filename,
          loop: true,
        });
      }
    } catch (e) {
      console.warn('File dialog error:', e);
    }
  };

  return (
    <aside className="w-84 bg-[#0f172a] border-r border-slate-800 flex flex-col h-[calc(100vh-4rem)] select-none">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 m-3 rounded-xl">
        <button
          onClick={() => setActiveTab('quran')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'quran'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Quran & Verses</span>
        </button>
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'audio'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>Reciter & Lang</span>
        </button>
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'media'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Background</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">
        {/* TAB 1: QURAN & VERSES */}
        {activeTab === 'quran' && (
          <>
            {/* Surah Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Select Surah
              </label>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Surah by name or number..."
                  value={surahSearch}
                  onChange={(e) => setSurahSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
                {filteredSurahs.slice(0, 30).map((s) => {
                  const isSelected = selectedSurah?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        onSurahChange(s);
                        onRangeChange(1, Math.min(5, s.ayah_count));
                      }}
                      className={`px-2.5 py-1.5 rounded-md flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-5 text-slate-500 font-mono text-[11px]">
                          {s.id}
                        </span>
                        <div>
                          <p className="font-semibold">{s.name_en}</p>
                          <p className="text-[10px] text-slate-400">{s.name_bn}</p>
                        </div>
                      </div>
                      <span className="font-arabic text-sm text-slate-400">{s.name_ar}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Ayah Range Picker */}
            {selectedSurah && (
              <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Ayah Range (Total: {selectedSurah.ayah_count})
                  </span>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onRangeChange(1, Math.min(5, selectedSurah.ayah_count))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                    >
                      1-5
                    </button>
                    <button
                      onClick={() => onRangeChange(1, Math.min(10, selectedSurah.ayah_count))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                    >
                      1-10
                    </button>
                    <button
                      onClick={() => onRangeChange(1, selectedSurah.ayah_count)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300"
                    >
                      All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">From Ayah</label>
                    <input
                      type="number"
                      min={1}
                      max={toAyah}
                      value={fromAyah}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(toAyah, parseInt(e.target.value) || 1));
                        onRangeChange(val, toAyah);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 block">To Ayah</label>
                    <input
                      type="number"
                      min={fromAyah}
                      max={selectedSurah.ayah_count}
                      value={toAyah}
                      onChange={(e) => {
                        const val = Math.max(
                          fromAyah,
                          Math.min(selectedSurah.ayah_count, parseInt(e.target.value) || fromAyah)
                        );
                        onRangeChange(fromAyah, val);
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Quran Script Type */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Arabic Quran Script
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onScriptTypeChange('hafs')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    scriptType === 'hafs'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-medium">Uthmanic Hafs</p>
                  <p className="text-[10px] text-slate-500">Madani Standard</p>
                </button>
                <button
                  onClick={() => onScriptTypeChange('indopak')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    scriptType === 'indopak'
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  <p className="font-medium">Indo-Pak Script</p>
                  <p className="text-[10px] text-slate-500">Nastaleeq / Asian</p>
                </button>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: RECITERS & TRANSLATIONS */}
        {activeTab === 'audio' && (
          <>
            {/* Reciter Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Quran Reciter
              </label>
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search 40+ reciters..."
                  value={reciterSearch}
                  onChange={(e) => setReciterSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 bg-slate-900/50 p-1.5 rounded-lg border border-slate-800">
                {filteredReciters.map((r, idx) => {
                  const isSelected = selectedReciter?.link === r.link;
                  return (
                    <div
                      key={idx}
                      onClick={() => onReciterChange(r)}
                      className={`px-2.5 py-1.5 rounded-md flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-[10px] text-slate-400">{r.style || 'Murattal'}</p>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Primary Translation (Bengali Default) */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Primary Translation (Bengali / বাংলা)
              </label>
              <select
                value={primaryTranslation?.full_path || ''}
                onChange={(e) => {
                  const found = translationsList.find((t) => t.full_path === e.target.value);
                  if (found) onPrimaryTranslationChange(found);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {bengaliTranslations.map((t, idx) => (
                  <option key={idx} value={t.full_path}>
                    {t.name} ({t.english_name})
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Translation (English / Optional) */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Secondary Subtitle (English)
                </span>
                <input
                  type="checkbox"
                  checked={showSecondary}
                  onChange={(e) => onToggleSecondary(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                />
              </div>

              {showSecondary && (
                <select
                  value={secondaryTranslation?.full_path || ''}
                  onChange={(e) => {
                    const found = translationsList.find((t) => t.full_path === e.target.value);
                    if (found) onSecondaryTranslationChange(found);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {englishTranslations.map((t, idx) => (
                    <option key={idx} value={t.full_path}>
                      {t.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </>
        )}

        {/* TAB 3: BACKGROUND MEDIA */}
        {activeTab === 'media' && (
          <>
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Background Video or Image
              </label>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-slate-700 bg-slate-900/40 hover:border-slate-600'
                }`}
              >
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-200">
                  Drag & Drop scenic video or image
                </p>
                <p className="text-[10px] text-slate-500 mt-1">MP4, MOV, WEBM, JPG, PNG</p>
                <button
                  type="button"
                  onClick={handleBrowseMedia}
                  className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors"
                >
                  Browse Files
                </button>
              </div>
            </div>

            {/* Current Media Info */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Background:</span>
                <span className="text-emerald-400 uppercase text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10">
                  {backgroundMedia.type}
                </span>
              </div>
              <p className="text-xs text-white font-medium truncate">{backgroundMedia.name}</p>

              {backgroundMedia.type === 'video' && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Auto-loop to fit recitation</span>
                  <input
                    type="checkbox"
                    checked={backgroundMedia.loop}
                    onChange={(e) =>
                      onBackgroundMediaChange({ ...backgroundMedia, loop: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-950 border-slate-700"
                  />
                </div>
              )}
            </div>

            {/* Built-in Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Sample Scenic Backgrounds
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    onBackgroundMediaChange({
                      type: 'image',
                      url: '/backgrounds/default.jpg',
                      name: 'Ramadan Atmosphere',
                      loop: true,
                    })
                  }
                  className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:border-slate-700 text-left text-xs text-slate-300"
                >
                  <p className="font-semibold text-white">Ramadan Atmosphere</p>
                  <p className="text-[10px] text-slate-500">Warm Evening Image</p>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

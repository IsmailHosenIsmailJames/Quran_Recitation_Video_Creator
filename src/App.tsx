import React, { useState, useEffect } from 'react';
import {
  Surah,
  Reciter,
  TranslationBook,
  AyahData,
  BackgroundMedia,
  StylingConfig,
  RenderProgress,
} from './types';
import {
  fetchSurahs,
  fetchReciters,
  fetchTranslationsList,
  fetchAyahArabicText,
  fetchAyahTranslation,
  getAyahAudioUrl,
  downloadAyahAudio,
  renderVideoExport,
} from './services/api';
import { Navbar } from './components/Navbar';
import { SidebarLeft } from './components/SidebarLeft';
import { SidebarRight } from './components/SidebarRight';
import { CanvasEditor } from './components/CanvasEditor';
import { Timeline } from './components/Timeline';
import { ExportModal } from './components/ExportModal';

export const App: React.FC = () => {
  // Global project data
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [translationsList, setTranslationsList] = useState<TranslationBook[]>([]);

  // Selection state
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(5);

  const [selectedReciter, setSelectedReciter] = useState<Reciter | null>(null);
  const [scriptType, setScriptType] = useState<'hafs' | 'indopak'>('hafs');

  const [primaryTranslation, setPrimaryTranslation] = useState<TranslationBook | null>(null);
  const [secondaryTranslation, setSecondaryTranslation] = useState<TranslationBook | null>(null);
  const [showSecondary, setShowSecondary] = useState<boolean>(false);

  // Background media
  const [backgroundMedia, setBackgroundMedia] = useState<BackgroundMedia>({
    type: 'image',
    url: '/backgrounds/default.jpg',
    name: 'Ramadan Atmosphere',
    loop: true,
  });

  // Ayah items in range
  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);

  // Styling state (matching An Nafee Aesthetic)
  const [styling, setStyling] = useState<StylingConfig>({
    aspectRatio: '16:9',
    arabicFont: 'KFGQPC Hafs',
    arabicFontSize: 46,
    arabicColor: '#FFFFFF',
    arabicGlow: false,
    arabicGlowColor: '#6ee7b7',
    arabicShadowBlur: 8,
    showDivider: true,
    dividerStyle: 'ornament',
    dividerColor: '#FFE27D',
    dividerOpacity: 0.75,
    translationFont: 'Li Alinur Nakkhatra',
    translationFontSize: 34,
    translationColor: '#FFE27D', // Signature An Nafee Gold
    translationShadow: true,
    showSecondaryTranslation: false,
    secondaryFont: 'sans-serif',
    secondaryFontSize: 16,
    secondaryColor: '#E2E8F0',
    scrimDarkness: 0.65,
    scrimHeight: 0.55,
    showSurahBadge: true,
    surahBadgeColor: '#FFFFFF',
    surahBadgeSize: 34,
    showSurahSubtitle: true,
    showWatermark: true,
    watermarkText: 'An Nafee',
    watermarkFont: 'cursive',
    watermarkOpacity: 0.85,
    watermarkSize: 26,
    textPositionY: 68,
  });

  // Export & modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const [isLoadingAyahs, setIsLoadingAyahs] = useState(false);

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        const [surahData, reciterData, transData] = await Promise.all([
          fetchSurahs(),
          fetchReciters(),
          fetchTranslationsList(),
        ]);

        setSurahs(surahData);
        setReciters(reciterData);
        setTranslationsList(transData);

        // Default to Surah Ar-Rahman (55)
        const rahman = surahData.find((s) => s.id === 55) || surahData[0];
        setSelectedSurah(rahman);
        setFromAyah(1);
        setToAyah(Math.min(5, rahman.ayah_count));

        // Default to Mishari Alafasy
        const alafasy = reciterData.find((r) => r.name.toLowerCase().includes('alafasy')) || reciterData[0];
        setSelectedReciter(alafasy);

        // Default Bengali translation (Taisirul Quran)
        const taisirul =
          transData.find((t) => t.full_path.includes('Taisirul_Quran')) ||
          transData.find((t) => t.language.toLowerCase() === 'bengali') ||
          transData[0];
        setPrimaryTranslation(taisirul);

        // Default English translation (Saheeh International)
        const saheeh = transData.find((t) => t.full_path.includes('Saheeh_International'));
        if (saheeh) setSecondaryTranslation(saheeh);
      } catch (e) {
        console.error('Error loading initial Quran data:', e);
      }
    }
    loadData();
  }, []);

  // Update Ayahs when Surah, range, script, or translations change
  useEffect(() => {
    if (!selectedSurah || !selectedReciter || !primaryTranslation) return;

    let isMounted = true;
    async function loadAyahs() {
      setIsLoadingAyahs(true);
      try {
        const promises = [];
        for (let a = fromAyah; a <= toAyah; a++) {
          const ayahNum = a;
          promises.push(
            (async (): Promise<AyahData> => {
              const [arText, bnText, audioUrl] = await Promise.all([
                fetchAyahArabicText(scriptType, selectedSurah!.id, ayahNum).catch(() => ''),
                fetchAyahTranslation(primaryTranslation!.full_path, selectedSurah!.id, ayahNum).catch(() => ''),
                getAyahAudioUrl(selectedReciter!.link, selectedSurah!.id, ayahNum).catch(() => ''),
              ]);

              let enText: string | undefined = undefined;
              if (showSecondary && secondaryTranslation) {
                enText = await fetchAyahTranslation(secondaryTranslation.full_path, selectedSurah!.id, ayahNum).catch(() => undefined);
              }

              return {
                surah: selectedSurah!.id,
                ayah: ayahNum,
                arabicText: arText || '',
                primaryTranslationText: bnText || '',
                secondaryTranslationText: enText,
                audioUrl,
                duration: 5.0, // default estimation until probed
              };
            })()
          );
        }

        const items = await Promise.all(promises);

        if (isMounted) {
          setAyahs(items);
          setCurrentAyahIndex(0);
        }
      } catch (err) {
        console.error('Error loading ayahs:', err);
      } finally {
        if (isMounted) {
          setIsLoadingAyahs(false);
        }
      }
    }

    loadAyahs();
    return () => {
      isMounted = false;
    };
  }, [
    selectedSurah,
    fromAyah,
    toAyah,
    selectedReciter,
    scriptType,
    primaryTranslation,
    secondaryTranslation,
    showSecondary,
  ]);

  // Apply Presets
  const applyPreset = (preset: 'annaffee' | 'minimal' | 'traditional') => {
    if (preset === 'annaffee') {
      setStyling((prev) => ({
        ...prev,
        arabicFont: 'KFGQPC Hafs',
        arabicColor: '#FFFFFF',
        arabicFontSize: 46,
        translationColor: '#FFE27D',
        showDivider: true,
        dividerColor: '#FFE27D',
        scrimDarkness: 0.65,
        scrimHeight: 0.55,
        showSurahBadge: true,
        showWatermark: true,
        watermarkText: 'An Nafee',
      }));
    } else if (preset === 'minimal') {
      setStyling((prev) => ({
        ...prev,
        arabicFont: 'KFGQPC Hafs',
        arabicColor: '#FFFFFF',
        arabicFontSize: 44,
        translationColor: '#FFFFFF',
        showDivider: false,
        scrimDarkness: 0.5,
        scrimHeight: 0.45,
        showSurahBadge: true,
        showWatermark: false,
      }));
    } else if (preset === 'traditional') {
      setStyling((prev) => ({
        ...prev,
        arabicFont: 'Indopak Nastaleeq',
        arabicColor: '#FFFFFF',
        arabicFontSize: 48,
        translationColor: '#FCD34D',
        showDivider: true,
        dividerColor: '#34D399',
        scrimDarkness: 0.75,
        scrimHeight: 0.6,
        showSurahBadge: true,
      }));
      setScriptType('indopak');
    }
  };

  const handleScriptTypeChange = (type: 'hafs' | 'indopak') => {
    setScriptType(type);
    setStyling((prev) => ({
      ...prev,
      arabicFont: type === 'hafs' ? 'KFGQPC Hafs' : 'AlQuran Neo',
      arabicFontSize: type === 'hafs' ? 46 : 50,
    }));
  };

  const handleStylingChange = (newStyling: StylingConfig) => {
    if (newStyling.arabicFont !== styling.arabicFont) {
      if (
        newStyling.arabicFont === 'AlQuran Neo' ||
        newStyling.arabicFont === 'Al Qalam' ||
        newStyling.arabicFont === 'Indopak Nastaleeq'
      ) {
        if (scriptType !== 'indopak') {
          setScriptType('indopak');
        }
      } else if (newStyling.arabicFont === 'KFGQPC Hafs') {
        if (scriptType !== 'hafs') {
          setScriptType('hafs');
        }
      }
    }
    setStyling(newStyling);
  };

  // Start Video Render via Tauri / FFmpeg
  const handleStartExport = async (resolution: string, fps: number, outputPath: string) => {
    if (!selectedSurah || !selectedReciter || !primaryTranslation) return;

    setRenderProgress({
      status: 'preparing',
      percent: 0,
      fps: 0,
      message: 'Downloading and caching audio files...',
    });

    try {
      // 1. Download all required Ayah audio files locally
      const ayahsWithLocalAudio = [];
      for (let i = 0; i < ayahs.length; i++) {
        const item = ayahs[i];
        setRenderProgress({
          status: 'preparing',
          percent: Math.round(((i + 1) / ayahs.length) * 30),
          fps: 0,
          message: `Downloading audio for Ayah ${item.ayah} (${i + 1}/${ayahs.length})...`,
        });
        const localPath = await downloadAyahAudio(selectedReciter.link, item.surah, item.ayah);
        ayahsWithLocalAudio.push({
          surah: item.surah,
          ayah: item.ayah,
          arabic_text: item.arabicText,
          primary_translation: item.primaryTranslationText,
          secondary_translation: item.secondaryTranslationText || null,
          audio_path: localPath,
          duration: item.duration || 5.0,
        });
      }

      // 2. Prepare render request payload
      const requestPayload = {
        surah_id: selectedSurah.id,
        surah_name_ar: selectedSurah.name_ar,
        surah_name_en: selectedSurah.name_en,
        surah_name_bn: selectedSurah.name_bn,
        ayahs: ayahsWithLocalAudio,
        background_path: backgroundMedia.localPath || backgroundMedia.url,
        background_type: backgroundMedia.type,
        output_path: outputPath,
        styling: {
          aspect_ratio: styling.aspectRatio,
          resolution,
          fps,
          arabic_font: styling.arabicFont,
          arabic_font_size: styling.arabicFontSize,
          arabic_color: styling.arabicColor,
          translation_font: styling.translationFont,
          translation_font_size: styling.translationFontSize,
          translation_color: styling.translationColor,
          show_divider: styling.showDivider,
          show_secondary_translation: styling.showSecondaryTranslation,
          secondary_font_size: styling.secondaryFontSize,
          secondary_color: styling.secondaryColor,
          scrim_darkness: styling.scrimDarkness,
          scrim_height: styling.scrimHeight,
          show_surah_badge: styling.showSurahBadge,
          surah_badge_size: styling.surahBadgeSize,
          show_surah_subtitle: styling.showSurahSubtitle,
          show_watermark: styling.showWatermark,
          watermark_text: styling.watermarkText,
          watermark_size: styling.watermarkSize,
          watermark_opacity: styling.watermarkOpacity,
          text_position_y: styling.textPositionY,
        },
      };

      await renderVideoExport(requestPayload, (prog) => {
        setRenderProgress(prog);
      });
    } catch (err: any) {
      console.error('Export error:', err);
      setRenderProgress({
        status: 'error',
        percent: 0,
        fps: 0,
        message: String(err?.message || err),
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070b12] text-white">
      {/* Top Navbar */}
      <Navbar
        styling={styling}
        onStylingChange={setStyling}
        onExportClick={() => {
          setRenderProgress(null);
          setIsExportModalOpen(true);
        }}
        isRendering={renderProgress?.status === 'rendering'}
        onApplyPreset={applyPreset}
      />

      {/* Main Studio Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar (Surah, Reciter, Media) */}
        <SidebarLeft
          surahs={surahs}
          selectedSurah={selectedSurah}
          onSurahChange={setSelectedSurah}
          fromAyah={fromAyah}
          toAyah={toAyah}
          onRangeChange={(from, to) => {
            setFromAyah(from);
            setToAyah(to);
          }}
          reciters={reciters}
          selectedReciter={selectedReciter}
          onReciterChange={setSelectedReciter}
          scriptType={scriptType}
          onScriptTypeChange={handleScriptTypeChange}
          translationsList={translationsList}
          primaryTranslation={primaryTranslation}
          onPrimaryTranslationChange={setPrimaryTranslation}
          secondaryTranslation={secondaryTranslation}
          onSecondaryTranslationChange={setSecondaryTranslation}
          showSecondary={showSecondary}
          onToggleSecondary={(show) => {
            setShowSecondary(show);
            setStyling((prev) => ({ ...prev, showSecondaryTranslation: show }));
          }}
          backgroundMedia={backgroundMedia}
          onBackgroundMediaChange={setBackgroundMedia}
        />

        {/* Center Canvas Viewport */}
        <CanvasEditor
          surah={selectedSurah}
          ayahs={ayahs}
          currentAyahIndex={currentAyahIndex}
          onAyahIndexChange={setCurrentAyahIndex}
          backgroundMedia={backgroundMedia}
          styling={styling}
          onStylingChange={handleStylingChange}
          isLoading={isLoadingAyahs}
        />

        {/* Right Sidebar (Layer Inspector & Style) */}
        <SidebarRight styling={styling} onStylingChange={handleStylingChange} />
      </div>

      {/* Bottom Timeline Sequencer */}
      <Timeline
        ayahs={ayahs}
        currentAyahIndex={currentAyahIndex}
        onAyahClick={setCurrentAyahIndex}
      />

      {/* Export Progress / Settings Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onStartExport={handleStartExport}
        renderProgress={renderProgress}
      />
    </div>
  );
};

export default App;

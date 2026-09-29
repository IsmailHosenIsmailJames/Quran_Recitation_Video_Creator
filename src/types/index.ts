export interface Surah {
  id: number;
  name_ar: string;
  name_en: string;
  name_bn: string;
  meaning_en: string;
  meaning_bn: string;
  ayah_count: number;
}

export interface Reciter {
  name: string;
  style: string;
  link: string;
  segments_url?: string;
  source: string;
}

export interface TranslationBook {
  language: string;
  language_code: string;
  language_native: string;
  name: string;
  english_name: string;
  file_name: string;
  full_path: string;
  type?: string;
}

export interface AyahData {
  surah: number;
  ayah: number;
  arabicText: string;
  primaryTranslationText: string;
  secondaryTranslationText?: string;
  audioUrl?: string;
  localAudioPath?: string;
  duration?: number;
}

export interface BackgroundMedia {
  type: 'video' | 'image';
  url: string;
  localPath?: string;
  name: string;
  duration?: number;
  loop: boolean;
}

export interface StylingConfig {
  aspectRatio: '16:9' | '9:16' | '1:1';
  // Arabic Script
  arabicFont: string;
  arabicFontSize: number;
  arabicColor: string;
  arabicGlow: boolean;
  arabicGlowColor: string;
  arabicShadowBlur: number;
  
  // Decorative Divider
  showDivider: boolean;
  dividerStyle: 'line' | 'ornament' | 'dots';
  dividerColor: string;
  dividerOpacity: number;

  // Primary Translation (e.g. Bengali)
  translationFont: string;
  translationFontSize: number;
  translationColor: string;
  translationShadow: boolean;

  // Secondary Translation (e.g. English)
  showSecondaryTranslation: boolean;
  secondaryFont: string;
  secondaryFontSize: number;
  secondaryColor: string;

  // Overlay Scrim / Darkness
  scrimDarkness: number;
  scrimHeight: number;

  // Branding / Corner Badges
  showSurahBadge: boolean;
  surahBadgeColor: string;
  surahBadgeSize: number;
  showSurahSubtitle: boolean;
  
  showWatermark: boolean;
  watermarkText: string;
  watermarkFont: string;
  watermarkOpacity: number;
  watermarkSize: number;

  // Position
  textPositionY: number; // Percentage (e.g. 68 for lower-third)
}

export interface RenderProgress {
  status: 'idle' | 'preparing' | 'rendering' | 'completed' | 'error';
  percent: number;
  fps: number;
  timeRemaining?: string;
  message: string;
  outputPath?: string;
}

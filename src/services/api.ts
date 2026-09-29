import { invoke } from '@tauri-apps/api/core';
import { Surah, Reciter, TranslationBook, RenderProgress } from '../types';
import { listen } from '@tauri-apps/api/event';

// Check if running inside Tauri
export const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

export async function fetchSurahs(): Promise<Surah[]> {
  if (isTauri()) {
    return await invoke<Surah[]>('get_surahs');
  }
  // Web fallback
  const res = await fetch('/data/surahs.json');
  return await res.json();
}

export async function fetchReciters(): Promise<Reciter[]> {
  if (isTauri()) {
    return await invoke<Reciter[]>('get_reciters');
  }
  const res = await fetch('/data/reciters.json');
  return await res.json();
}

export async function fetchTranslationsList(): Promise<TranslationBook[]> {
  if (isTauri()) {
    return await invoke<TranslationBook[]>('get_translations_list');
  }
  const res = await fetch('/data/translations_index.json');
  return await res.json();
}

export async function fetchAyahArabicText(script: string, surah: number, ayah: number): Promise<string> {
  if (isTauri()) {
    const text = await invoke<string | null>('get_ayah_text', { script, surah, ayah });
    if (text) return text;
  }
  
  // Fallback to static scripts in public
  const scriptFile = script.toLowerCase().includes('indo') ? '/data/quran_indopak.json' : '/data/quran_hafs.json';
  try {
    const res = await fetch(scriptFile);
    const data = await res.json();
    return data[`${surah}:${ayah}`] || '';
  } catch (e) {
    return '';
  }
}

export async function fetchAyahTranslation(fullPath: string, surah: number, ayah: number): Promise<string> {
  if (isTauri()) {
    try {
      return await invoke<string>('get_ayah_translation', { fullPath, surah, ayah });
    } catch (e) {
      console.warn('Tauri get_ayah_translation error:', e);
    }
  }

  // Pre-cached local fallbacks for Taisirul Quran and Saheeh International
  const isBengali = fullPath.includes('Bengali') || fullPath.includes('Taisirul');
  const cacheFile = isBengali ? '/data/translations/Taisirul_Quran.json' : '/data/translations/Saheeh_International.json';
  try {
    const res = await fetch(cacheFile);
    const data = await res.json();
    return data[`${surah}:${ayah}`]?.t || data[`${surah}:${ayah}`] || '';
  } catch (e) {
    return '';
  }
}

export async function fetchAyahRangeTranslations(
  fullPath: string,
  surah: number,
  fromAyah: number,
  toAyah: number
): Promise<string[]> {
  if (isTauri()) {
    try {
      return await invoke<string[]>('get_ayah_range_translations', { fullPath, surah, fromAyah, toAyah });
    } catch (e) {
      console.warn('Tauri get_ayah_range_translations error:', e);
    }
  }

  const results: string[] = [];
  for (let a = fromAyah; a <= toAyah; a++) {
    const text = await fetchAyahTranslation(fullPath, surah, a);
    results.push(text);
  }
  return results;
}

export async function getAyahAudioUrl(reciterLink: string, surah: number, ayah: number): Promise<string> {
  if (isTauri()) {
    return await invoke<string>('get_audio_url', { reciterLink, surah, ayah });
  }
  const ayahId = `${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}`;
  const base = reciterLink.replace(/\/+$/, '');
  return `${base}/${ayahId}.mp3`;
}

export async function downloadAyahAudio(reciterLink: string, surah: number, ayah: number): Promise<string> {
  if (isTauri()) {
    return await invoke<string>('download_ayah_audio', { reciterLink, surah, ayah });
  }
  return getAyahAudioUrl(reciterLink, surah, ayah);
}

export async function getAudioDuration(filePath: string): Promise<number | null> {
  if (isTauri()) {
    return await invoke<number | null>('get_audio_duration', { filePath });
  }
  return null;
}

export async function renderVideoExport(request: any, onProgress: (progress: RenderProgress) => void): Promise<string> {
  if (!isTauri()) {
    throw new Error('Video rendering requires the desktop app runtime (FFmpeg).');
  }

  const unlisten = await listen<any>('render-progress', (event) => {
    onProgress(event.payload);
  });

  try {
    const result = await invoke<string>('render_video', { req: request });
    unlisten();
    return result;
  } catch (err) {
    unlisten();
    throw err;
  }
}

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::OnceLock;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Surah {
    pub id: u32,
    pub name_ar: String,
    pub name_en: String,
    pub name_bn: String,
    pub meaning_en: String,
    pub meaning_bn: String,
    pub ayah_count: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Reciter {
    pub name: String,
    #[serde(default)]
    pub style: String,
    pub link: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub segments_url: Option<String>,
    #[serde(default)]
    pub source: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TranslationBook {
    pub language: String,
    #[serde(default)]
    pub language_code: String,
    #[serde(default)]
    pub language_native: String,
    pub name: String,
    pub english_name: String,
    pub file_name: String,
    pub full_path: String,
    #[serde(default)]
    pub r#type: String,
}

static SURAHS: OnceLock<Vec<Surah>> = OnceLock::new();
static RECITERS: OnceLock<Vec<Reciter>> = OnceLock::new();
static TRANSLATIONS: OnceLock<Vec<TranslationBook>> = OnceLock::new();
static HAFS_SCRIPT: OnceLock<HashMap<String, String>> = OnceLock::new();
static INDOPAK_SCRIPT: OnceLock<HashMap<String, String>> = OnceLock::new();

pub fn init_data() {
    let _ = SURAHS.get_or_init(|| {
        serde_json::from_str(include_str!("../data/surahs.json")).unwrap_or_default()
    });
    let _ = RECITERS.get_or_init(|| {
        serde_json::from_str(include_str!("../data/reciters.json")).unwrap_or_default()
    });
    let _ = TRANSLATIONS.get_or_init(|| {
        serde_json::from_str(include_str!("../data/translations_index.json")).unwrap_or_default()
    });
    let _ = HAFS_SCRIPT.get_or_init(|| {
        serde_json::from_str(include_str!("../data/quran_hafs.json")).unwrap_or_default()
    });
    let _ = INDOPAK_SCRIPT.get_or_init(|| {
        serde_json::from_str(include_str!("../data/quran_indopak.json")).unwrap_or_default()
    });
}

#[tauri::command]
pub fn get_surahs() -> Vec<Surah> {
    SURAHS.get().cloned().unwrap_or_else(|| {
        serde_json::from_str(include_str!("../data/surahs.json")).unwrap_or_default()
    })
}

#[tauri::command]
pub fn get_reciters() -> Vec<Reciter> {
    RECITERS.get().cloned().unwrap_or_else(|| {
        serde_json::from_str(include_str!("../data/reciters.json")).unwrap_or_default()
    })
}

#[tauri::command]
pub fn get_translations_list() -> Vec<TranslationBook> {
    TRANSLATIONS.get().cloned().unwrap_or_else(|| {
        serde_json::from_str(include_str!("../data/translations_index.json")).unwrap_or_default()
    })
}

#[tauri::command]
pub fn get_ayah_text(script: String, surah: u32, ayah: u32) -> Option<String> {
    let key = format!("{}:{}", surah, ayah);
    if script.to_lowercase().contains("indo") {
        INDOPAK_SCRIPT.get()?.get(&key).cloned()
    } else {
        HAFS_SCRIPT.get()?.get(&key).cloned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quran_data() {
        init_data();
        let reciters_res: Result<Vec<Reciter>, _> = serde_json::from_str(include_str!("../data/reciters.json"));
        if let Err(e) = reciters_res {
            println!("Reciters JSON parse error: {:?}", e);
        }
        let surahs = get_surahs();
        assert_eq!(surahs.len(), 114);
        let reciters = get_reciters();
        assert!(!reciters.is_empty());

        let translations = get_translations_list();
        assert!(!translations.is_empty());

        let text_hafs = get_ayah_text("hafs".into(), 1, 1);
        println!("Hafs 1:1: {:?}", text_hafs);
        assert!(text_hafs.is_some());

        let text_indo = get_ayah_text("indopak".into(), 1, 1);
        println!("Indopak 1:1: {:?}", text_indo);
        assert!(text_indo.is_some());
    }
}


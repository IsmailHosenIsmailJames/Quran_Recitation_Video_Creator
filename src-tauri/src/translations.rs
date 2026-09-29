use base64::Engine;
use bzip2::read::BzDecoder;
use serde_json::Value;
use std::collections::HashMap;
use std::fs;
use std::io::Read;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

static CACHE: Mutex<Option<HashMap<String, HashMap<String, String>>>> = Mutex::new(None);
static TAISIRUL_MAP: OnceLock<HashMap<String, String>> = OnceLock::new();
static SAHEEH_MAP: OnceLock<HashMap<String, String>> = OnceLock::new();

fn parse_raw_translation_map(raw_json: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    if let Ok(Value::Object(obj)) = serde_json::from_str::<Value>(raw_json) {
        for (k, v) in obj {
            if let Value::Object(sub_obj) = v {
                if let Some(Value::String(text)) = sub_obj.get("t") {
                    map.insert(k, text.clone());
                }
            } else if let Value::String(s) = v {
                map.insert(k, s);
            }
        }
    }
    map
}

fn get_cache_dir() -> PathBuf {
    let mut dir = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    dir.push("quran_video_creator");
    dir.push("translations");
    let _ = fs::create_dir_all(&dir);
    dir
}

fn sanitize_filename(path: &str) -> String {
    path.replace('/', "_").replace('\\', "_")
}

pub async fn load_translation_map(full_path: &str) -> Result<HashMap<String, String>, String> {
    // Check bundled translations first (instant offline)
    if full_path.contains("Taisirul_Quran") {
        let map = TAISIRUL_MAP.get_or_init(|| {
            parse_raw_translation_map(include_str!("../data/translations/Taisirul_Quran.json"))
        });
        return Ok(map.clone());
    }
    if full_path.contains("Saheeh_International") {
        let map = SAHEEH_MAP.get_or_init(|| {
            parse_raw_translation_map(include_str!("../data/translations/Saheeh_International.json"))
        });
        return Ok(map.clone());
    }

    // Check in-memory cache next
    {
        let mut cache = CACHE.lock().map_err(|e| e.to_string())?;
        if let Some(ref m) = *cache {
            if let Some(map) = m.get(full_path) {
                return Ok(map.clone());
            }
        } else {
            *cache = Some(HashMap::new());
        }
    }

    // Check disk cache
    let cache_dir = get_cache_dir();
    let file_name = sanitize_filename(full_path);
    let disk_file = cache_dir.join(format!("{}.json", file_name));

    if disk_file.exists() {
        if let Ok(content) = fs::read_to_string(&disk_file) {
            if let Ok(map) = serde_json::from_str::<HashMap<String, String>>(&content) {
                let mut cache = CACHE.lock().map_err(|e| e.to_string())?;
                if let Some(ref mut c) = *cache {
                    c.insert(full_path.to_string(), map.clone());
                }
                return Ok(map);
            }
        }
    }

    // Fetch from backend
    let url = format!("https://quran-backend-delta.vercel.app/{}", full_path);
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 QuranVideoCreator")
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("Failed to download translation: HTTP {}", resp.status()));
    }

    let raw_text = resp.text().await.map_err(|e| e.to_string())?;
    let compressed_bytes = base64::engine::general_purpose::STANDARD
        .decode(raw_text.trim())
        .map_err(|e| format!("Base64 decode error: {}", e))?;

    let mut decoder = BzDecoder::new(&compressed_bytes[..]);
    let mut decompressed_json = String::new();
    decoder
        .read_to_string(&mut decompressed_json)
        .map_err(|e| format!("BZip2 decompression error: {}", e))?;

    let raw_val: Value = serde_json::from_str(&decompressed_json)
        .map_err(|e| format!("JSON parse error: {}", e))?;

    let mut result_map: HashMap<String, String> = HashMap::new();
    if let Value::Object(obj) = raw_val {
        for (k, v) in obj {
            if let Value::Object(sub_obj) = v {
                if let Some(Value::String(text)) = sub_obj.get("t") {
                    result_map.insert(k, text.clone());
                }
            } else if let Value::String(s) = v {
                result_map.insert(k, s);
            }
        }
    }

    // Save to disk cache
    if let Ok(ser) = serde_json::to_string(&result_map) {
        let _ = fs::write(&disk_file, ser);
    }

    // Save to in-memory cache
    {
        let mut cache = CACHE.lock().map_err(|e| e.to_string())?;
        if let Some(ref mut c) = *cache {
            c.insert(full_path.to_string(), result_map.clone());
        }
    }

    Ok(result_map)
}

#[tauri::command]
pub async fn get_ayah_translation(
    full_path: String,
    surah: u32,
    ayah: u32,
) -> Result<String, String> {
    let map = load_translation_map(&full_path).await?;
    let key = format!("{}:{}", surah, ayah);
    map.get(&key)
        .cloned()
        .ok_or_else(|| format!("Translation for {} not found", key))
}

#[tauri::command]
pub async fn get_ayah_range_translations(
    full_path: String,
    surah: u32,
    from_ayah: u32,
    to_ayah: u32,
) -> Result<Vec<String>, String> {
    let map = load_translation_map(&full_path).await?;
    let mut list = Vec::new();
    for a in from_ayah..=to_ayah {
        let key = format!("{}:{}", surah, a);
        let text = map.get(&key).cloned().unwrap_or_default();
        list.push(text);
    }
    Ok(list)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_load_translation() {
        let full_path = "quranic_universal_library/translation_v2/compressed_translation_simple/Bengali/Taisirul_Quran.json.txt";
        let res = get_ayah_translation(full_path.to_string(), 1, 1).await;
        println!("Test translation result: {:?}", res);
        assert!(res.is_ok());
    }
}


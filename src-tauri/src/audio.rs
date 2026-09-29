use std::fs;
use std::path::PathBuf;
use std::process::Command;

fn get_audio_cache_dir() -> PathBuf {
    let mut dir = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    dir.push("quran_video_creator");
    dir.push("audio");
    let _ = fs::create_dir_all(&dir);
    dir
}

pub fn format_ayah_id(surah: u32, ayah: u32) -> String {
    format!("{:03}{:03}", surah, ayah)
}

pub fn build_audio_url(reciter_link: &str, surah: u32, ayah: u32) -> String {
    let ayah_id = format_ayah_id(surah, ayah);
    let base = reciter_link.trim_end_matches('/');
    format!("{}/{}.mp3", base, ayah_id)
}

#[tauri::command]
pub fn get_audio_url(reciter_link: String, surah: u32, ayah: u32) -> String {
    build_audio_url(&reciter_link, surah, ayah)
}

#[tauri::command]
pub async fn download_ayah_audio(
    reciter_link: String,
    surah: u32,
    ayah: u32,
) -> Result<String, String> {
    let ayah_id = format_ayah_id(surah, ayah);
    let subfolder = reciter_link
        .split('/')
        .filter(|s| !s.is_empty())
        .last()
        .unwrap_or("reciter");

    let mut cache_path = get_audio_cache_dir();
    cache_path.push(subfolder);
    let _ = fs::create_dir_all(&cache_path);
    cache_path.push(format!("{}.mp3", ayah_id));

    if cache_path.exists() {
        return Ok(cache_path.to_string_lossy().to_string());
    }

    let url = build_audio_url(&reciter_link, surah, ayah);
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 QuranVideoCreator")
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client.get(&url).send().await.map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("Failed to download audio: HTTP {}", resp.status()));
    }

    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    fs::write(&cache_path, &bytes).map_err(|e| e.to_string())?;

    Ok(cache_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_audio_duration(file_path: String) -> Option<f64> {
    probe_duration(&file_path)
}

pub fn probe_duration(file_path: &str) -> Option<f64> {
    let output = Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            file_path,
        ])
        .output()
        .ok()?;

    let s = String::from_utf8_lossy(&output.stdout);
    s.trim().parse::<f64>().ok()
}

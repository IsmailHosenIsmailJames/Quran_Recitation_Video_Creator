mod audio;
mod quran_data;
mod render;
mod translations;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    quran_data::init_data();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            quran_data::get_surahs,
            quran_data::get_reciters,
            quran_data::get_translations_list,
            quran_data::get_ayah_text,
            translations::get_ayah_translation,
            translations::get_ayah_range_translations,
            audio::get_audio_url,
            audio::download_ayah_audio,
            audio::get_audio_duration,
            render::render_video,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

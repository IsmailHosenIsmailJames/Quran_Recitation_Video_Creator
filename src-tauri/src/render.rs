use serde::{Deserialize, Serialize};
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tauri::Emitter;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RenderStyling {
    pub aspect_ratio: String,        // "16:9" or "9:16"
    pub resolution: String,          // "1080p", "720p", "4k"
    pub fps: u32,                    // 24, 30, 60
    pub arabic_font: String,         // "KFGQPC Hafs", "Indopak Nastaleeq", "Amiri"
    pub arabic_font_size: u32,       // e.g. 52
    pub arabic_color: String,        // hex e.g. "#FFFFFF"
    pub translation_font: String,    // "Li Alinur Nakkhatra", "Kalpurush"
    pub translation_font_size: u32,  // e.g. 38
    pub translation_color: String,   // hex e.g. "#FFE27D"
    pub show_divider: bool,
    pub show_secondary_translation: bool,
    pub secondary_font_size: u32,
    pub secondary_color: String,
    pub scrim_darkness: f32,         // 0.0 - 1.0 (e.g. 0.65)
    pub scrim_height: f32,           // 0.0 - 1.0 (e.g. 0.55)
    pub show_surah_badge: bool,
    pub surah_badge_size: u32,       // e.g. 36
    pub show_surah_subtitle: bool,
    pub show_watermark: bool,
    pub watermark_text: String,
    pub watermark_size: u32,
    pub watermark_opacity: f32,
    pub text_position_y: f32,        // percentage e.g. 68.0
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AyahRenderItem {
    pub surah: u32,
    pub ayah: u32,
    pub arabic_text: String,
    pub primary_translation: String,
    pub secondary_translation: Option<String>,
    pub audio_path: String,
    pub duration: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RenderRequest {
    pub surah_id: u32,
    pub surah_name_ar: String,
    pub surah_name_en: String,
    pub surah_name_bn: String,
    pub ayahs: Vec<AyahRenderItem>,
    pub background_path: String,
    pub background_type: String,     // "video" or "image"
    pub output_path: String,
    pub styling: RenderStyling,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RenderProgressPayload {
    pub percent: f32,
    pub fps: f32,
    pub current_time_sec: f64,
    pub total_time_sec: f64,
    pub status: String,
    pub message: String,
}

fn hex_to_ass_color(hex: &str, alpha: f32) -> String {
    let clean = hex.trim_start_matches('#');
    let (r, g, b) = if clean.len() >= 6 {
        (
            &clean[0..2],
            &clean[2..4],
            &clean[4..6],
        )
    } else {
        ("FF", "FF", "FF")
    };
    let a_int = ((1.0 - alpha.clamp(0.0, 1.0)) * 255.0) as u8;
    // ASS format: &HAABBGGRR
    format!("&H{:02X}{}{}{}", a_int, b, g, r)
}

fn format_ass_time(sec: f64) -> String {
    let hours = (sec / 3600.0).floor() as u32;
    let minutes = ((sec % 3600.0) / 60.0).floor() as u32;
    let seconds = (sec % 60.0).floor() as u32;
    let centis = ((sec - sec.floor()) * 100.0).round() as u32;
    format!("{}:{:02}:{:02}.{:02}", hours, minutes, seconds, centis)
}

pub fn generate_ass_subtitles(
    req: &RenderRequest,
    width: u32,
    height: u32,
    total_duration: f64,
    _fonts_dir: &Path,
) -> String {
    let mut ass = String::new();
    ass.push_str("[Script Info]\n");
    ass.push_str("Title: Quran Recitation Video\n");
    ass.push_str("ScriptType: v4.00+\n");
    ass.push_str(&format!("PlayResX: {}\n", width));
    ass.push_str(&format!("PlayResY: {}\n", height));
    ass.push_str("ScaledBorderAndShadow: yes\n\n");

    ass.push_str("[V4+ Styles]\n");
    ass.push_str("Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n");

    let arabic_color = hex_to_ass_color(&req.styling.arabic_color, 1.0);
    let trans_color = hex_to_ass_color(&req.styling.translation_color, 1.0);
    let sec_color = hex_to_ass_color(&req.styling.secondary_color, 0.85);

    let ass_arabic_font = match req.styling.arabic_font.as_str() {
        "KFGQPC Hafs" | "QPC Hafs" => "KFGQPC HAFS Uthmanic Script",
        "AlQuran Neo" | "Indopak Nastaleeq" | "AlQuran IndoPak" => "AlQuran Neo v5x1",
        "Amiri" => "Amiri",
        "Al Qalam" => "Al Qalam Quran Majeed Web",
        "Lateef" => "Lateef",
        other => other,
    };

    let ass_trans_font = match req.styling.translation_font.as_str() {
        "Li Alinur Nakkhatra" => "Li Alinur Nakkhatra Unicode",
        other => other,
    };

    // Style for Arabic
    ass.push_str(&format!(
        "Style: Arabic,{},{},{},&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,3,2,60,60,20,1\n",
        ass_arabic_font,
        req.styling.arabic_font_size,
        arabic_color
    ));

    // Style for Primary Translation (Bengali)
    ass.push_str(&format!(
        "Style: Bengali,{},{},{},&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,2,2,80,80,20,1\n",
        ass_trans_font,
        req.styling.translation_font_size,
        trans_color
    ));

    // Style for Secondary Translation (English)
    ass.push_str(&format!(
        "Style: English,sans-serif,{},{},&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,1,2,2,100,100,20,1\n",
        req.styling.secondary_font_size,
        sec_color
    ));

    // Style for Surah Emblem Badge (top left)
    ass.push_str(&format!(
        "Style: SurahBadge,surah-name-v1,{},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,1,2,7,50,50,40,1\n",
        req.styling.surah_badge_size
    ));

    // Style for Surah Subtitle (below emblem)
    ass.push_str(&format!(
        "Style: SurahSub,{},{},&H20FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,1,1,7,50,50,85,1\n",
        ass_trans_font,
        req.styling.surah_badge_size / 2
    ));

    // Style for Channel Watermark (top right)
    let wm_color = hex_to_ass_color("#FFFFFF", req.styling.watermark_opacity);
    ass.push_str(&format!(
        "Style: Watermark,Brush Script MT,{},{},&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,1,2,9,50,50,40,1\n\n",
        req.styling.watermark_size,
        wm_color
    ));

    ass.push_str("[Events]\n");
    ass.push_str("Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n");

    // Static overlays for whole duration
    let end_str = format_ass_time(total_duration);
    if req.styling.show_surah_badge {
        let badge_code = format!("surah{:03}", req.surah_id);
        ass.push_str(&format!("Dialogue: 2,0:00:00.00,{},SurahBadge,,0,0,0,,{}\n", end_str, badge_code));
        if req.styling.show_surah_subtitle && !req.surah_name_bn.is_empty() {
            ass.push_str(&format!("Dialogue: 2,0:00:00.00,{},SurahSub,,0,0,0,,{}\n", end_str, req.surah_name_bn));
        }
    }

    if req.styling.show_watermark && !req.styling.watermark_text.is_empty() {
        ass.push_str(&format!("Dialogue: 2,0:00:00.00,{},Watermark,,0,0,0,,{}\n", end_str, req.styling.watermark_text));
    }

    // Dynamic Ayah verses
    let mut current_time = 0.0;
    let pos_y = (height as f32 * (req.styling.text_position_y / 100.0)) as u32;

    for item in &req.ayahs {
        let start_time_str = format_ass_time(current_time);
        let end_time = current_time + item.duration;
        let end_time_str = format_ass_time(end_time);

        // Combined text block with fade effect
        let mut text_block = String::new();
        text_block.push_str(r"{\fad(250,250)}"); // 250ms crossfade in/out
        
        // Position on canvas
        text_block.push_str(&format!(r"{{\pos({},{})}}", width / 2, pos_y));

        // Arabic text
        text_block.push_str(&format!(r"{{\r(Arabic)}}{}\N", item.arabic_text));

        // Optional decorative separator line
        if req.styling.show_divider {
            text_block.push_str(r"{\fscx150\fscy50\alpha&H80&}──── ✦ ────{\r}\N");
        }

        // Bengali translation
        text_block.push_str(&format!(r"{{\r(Bengali)}}{}", item.primary_translation));

        // Optional English translation
        if req.styling.show_secondary_translation {
            if let Some(ref sec) = item.secondary_translation {
                if !sec.is_empty() {
                    text_block.push_str(&format!(r"\N{{\r(English)}}{}", sec));
                }
            }
        }

        ass.push_str(&format!("Dialogue: 1,{},{},Arabic,,0,0,0,,{}\n", start_time_str, end_time_str, text_block));

        current_time = end_time;
    }

    ass
}

#[tauri::command]
pub async fn render_video(
    req: RenderRequest,
    window: tauri::Window,
) -> Result<String, String> {
    // 1. Calculate total duration from ayahs
    let total_duration: f64 = req.ayahs.iter().map(|a| a.duration).sum();
    if total_duration <= 0.0 {
        return Err("Total duration of recitations is 0. Please verify audio files.".to_string());
    }

    // 2. Prepare temp working directory
    let temp_dir = tempfile::Builder::new()
        .prefix("quran_render_")
        .tempdir()
        .map_err(|e| e.to_string())?;
    let temp_path = temp_dir.path();

    // 3. Prepare audio concat list
    let audio_list_file = temp_path.join("audio_list.txt");
    let mut audio_list_content = String::new();
    for item in &req.ayahs {
        let abs_audio = fs::canonicalize(&item.audio_path)
            .map_err(|e| format!("Audio path error ({}): {}", item.audio_path, e))?;
        audio_list_content.push_str(&format!("file '{}'\n", abs_audio.to_string_lossy()));
    }
    fs::write(&audio_list_file, audio_list_content).map_err(|e| e.to_string())?;

    // 4. Target dimensions
    let (width, height) = match req.styling.aspect_ratio.as_str() {
        "9:16" => match req.styling.resolution.as_str() {
            "4k" => (2160, 3840),
            "720p" => (720, 1280),
            _ => (1080, 1920),
        },
        _ => match req.styling.resolution.as_str() {
            "4k" => (3840, 2160),
            "720p" => (1280, 720),
            _ => (1920, 1080),
        },
    };

    // 5. Generate ASS Subtitle File
    let fonts_dir = [
        PathBuf::from("fonts"),
        PathBuf::from("../fonts"),
        PathBuf::from("public/fonts"),
        PathBuf::from("../public/fonts"),
    ]
    .into_iter()
    .find(|p| p.exists())
    .unwrap_or_else(|| PathBuf::from("fonts"));

    let ass_content = generate_ass_subtitles(&req, width, height, total_duration, &fonts_dir);
    let ass_file = temp_path.join("subtitles.ass");
    fs::write(&ass_file, ass_content).map_err(|e| e.to_string())?;

    // 6. Build bottom gradient shadow (scrim) filter
    let scrim_dark = req.styling.scrim_darkness.clamp(0.0, 1.0);
    let scrim_h_ratio = req.styling.scrim_height.clamp(0.1, 1.0);
    let scrim_start_y = (height as f32 * (1.0 - scrim_h_ratio)) as u32;
    let scrim_h = height - scrim_start_y;

    // Filtergraph:
    // Scale and crop background to exact dimension
    // Apply bottom gradient shadow via drawbox or geq/color
    // Apply ASS subtitles
    let ass_path_escaped = ass_file.to_string_lossy().replace('\\', "/").replace(':', "\\:");
    let fonts_path_escaped = fs::canonicalize(&fonts_dir)
        .unwrap_or(fonts_dir)
        .to_string_lossy()
        .replace('\\', "/")
        .replace(':', "\\:");

    let vf_filter = format!(
        "scale={}:{}:force_original_aspect_ratio=increase,crop={}:{},drawbox=y={}:color=black@{}:height={}:t=fill,ass=filename='{}':fontsdir='{}'",
        width, height, width, height, scrim_start_y, scrim_dark * 0.7, scrim_h, ass_path_escaped, fonts_path_escaped
    );

    // Resolve background path safely (supporting web paths like /backgrounds/default.jpg)
    let bg_clean = req.background_path.trim_start_matches('/');
    let bg_candidates = [
        PathBuf::from(&req.background_path),
        PathBuf::from(bg_clean),
        PathBuf::from("public").join(bg_clean),
        PathBuf::from("../public").join(bg_clean),
        PathBuf::from("dist").join(bg_clean),
        PathBuf::from("../dist").join(bg_clean),
    ];
    let resolved_bg = bg_candidates.into_iter().find(|p| p.exists())
        .ok_or_else(|| format!("Background file not found: {}", req.background_path))?;
    let abs_bg = fs::canonicalize(&resolved_bg)
        .map_err(|e| format!("Canonicalize background path error ({}): {}", resolved_bg.display(), e))?;
    let bg_path_str = abs_bg.to_string_lossy().to_string();

    // Resolve output path safely (default to user Videos/Downloads/Home if relative)
    let resolved_output = if Path::new(&req.output_path).is_relative() {
        let base = dirs::video_dir()
            .or_else(dirs::download_dir)
            .or_else(dirs::home_dir)
            .unwrap_or_else(|| PathBuf::from("."));
        base.join(&req.output_path)
    } else {
        PathBuf::from(&req.output_path)
    };
    if let Some(parent) = resolved_output.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let output_path_str = resolved_output.to_string_lossy().to_string();

    // 7. Assemble FFmpeg arguments
    let mut args = vec![
        "-y".to_string(),
    ];

    if req.background_type == "video" {
        args.extend([
            "-stream_loop".to_string(), "-1".to_string(),
            "-i".to_string(), bg_path_str,
        ]);
    } else {
        args.extend([
            "-loop".to_string(), "1".to_string(),
            "-i".to_string(), bg_path_str,
        ]);
    }

    // Audio input (concat)
    args.extend([
        "-f".to_string(), "concat".to_string(),
        "-safe".to_string(), "0".to_string(),
        "-i".to_string(), audio_list_file.to_string_lossy().to_string(),
    ]);

    // Duration limit and video filters
    args.extend([
        "-t".to_string(), format!("{:.3}", total_duration),
        "-vf".to_string(), vf_filter,
        "-c:v".to_string(), "libx264".to_string(),
        "-preset".to_string(), "fast".to_string(),
        "-crf".to_string(), "21".to_string(),
        "-pix_fmt".to_string(), "yuv420p".to_string(),
        "-r".to_string(), req.styling.fps.to_string(),
        "-c:a".to_string(), "aac".to_string(),
        "-b:a".to_string(), "192k".to_string(),
        "-shortest".to_string(),
        "-progress".to_string(), "pipe:1".to_string(),
        output_path_str.clone(),
    ]);

    let _ = window.emit(
        "render-progress",
        RenderProgressPayload {
            percent: 0.0,
            fps: 0.0,
            current_time_sec: 0.0,
            total_time_sec: total_duration,
            status: "rendering".to_string(),
            message: "Starting FFmpeg encoder...".to_string(),
        },
    );

    let mut child = Command::new("ffmpeg")
        .args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn ffmpeg: {}. Ensure ffmpeg is installed.", e))?;

    let stdout = child.stdout.take().ok_or("Failed to capture ffmpeg stdout")?;
    let stderr = child.stderr.take();
    let stderr_handle = std::thread::spawn(move || {
        let mut err_msg = String::new();
        if let Some(pipe) = stderr {
            let r = BufReader::new(pipe);
            for line in r.lines().flatten() {
                err_msg.push_str(&line);
                err_msg.push('\n');
            }
        }
        err_msg
    });

    let reader = BufReader::new(stdout);
    let mut current_out_time_sec;
    let mut current_fps = 0.0;

    for line in reader.lines() {
        if let Ok(l) = line {
            if l.starts_with("out_time_us=") {
                let us_str = l.trim_start_matches("out_time_us=").trim();
                if let Ok(us) = us_str.parse::<f64>() {
                    current_out_time_sec = us / 1_000_000.0;
                    let pct = ((current_out_time_sec / total_duration) * 100.0).clamp(0.0, 99.0);
                    let _ = window.emit(
                        "render-progress",
                        RenderProgressPayload {
                            percent: pct as f32,
                            fps: current_fps,
                            current_time_sec: current_out_time_sec,
                            total_time_sec: total_duration,
                            status: "rendering".to_string(),
                            message: format!("Encoding: {:.1}% ({:.1}s / {:.1}s)", pct, current_out_time_sec, total_duration),
                        },
                    );
                }
            } else if l.starts_with("fps=") {
                let fps_str = l.trim_start_matches("fps=").trim();
                if let Ok(f) = fps_str.parse::<f32>() {
                    current_fps = f;
                }
            }
        }
    }

    let status = child.wait().map_err(|e| e.to_string())?;
    let stderr_text = stderr_handle.join().unwrap_or_default();
    if !status.success() {
        let err_preview = if stderr_text.trim().is_empty() {
            "FFmpeg exited with non-zero status code.".to_string()
        } else {
            let lines: Vec<&str> = stderr_text.lines().collect();
            let last_lines = if lines.len() > 6 { &lines[lines.len() - 6..] } else { &lines[..] };
            last_lines.join(" | ")
        };

        let _ = window.emit(
            "render-progress",
            RenderProgressPayload {
                percent: 0.0,
                fps: 0.0,
                current_time_sec: 0.0,
                total_time_sec: total_duration,
                status: "error".to_string(),
                message: format!("FFmpeg error: {}", err_preview),
            },
        );
        return Err(format!("FFmpeg error: {}", err_preview));
    }

    let _ = window.emit(
        "render-progress",
        RenderProgressPayload {
            percent: 100.0,
            fps: current_fps,
            current_time_sec: total_duration,
            total_time_sec: total_duration,
            status: "completed".to_string(),
            message: format!("Video saved to {}", output_path_str),
        },
    );

    Ok(output_path_str)
}

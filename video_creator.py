import json
from moviepy import *
import json
import os
import traceback
import sys
import numpy as np


class Logger(object):

    def __init__(self):
        self.terminal = sys.stdout
        self.log = open("execution_log.txt", "w", encoding="utf-8")

    def write(self, message):
        self.terminal.write(message)
        self.log.write(message)
        self.log.flush()  # Ensure it's written immediately

    def flush(self):
        self.terminal.flush()
        self.log.flush()


def get_quran_data(
    audio_folder,
    translation_path,
    script_path="indopak_script/indopak-nastaleeq.json"
) -> dict[str, list[str]]:
    """
    Returns a dictionary containing audio files, Quran scripts, and translations.
    """
    if not os.path.exists(audio_folder):
        raise FileNotFoundError(f"Audio path does not exist: {audio_folder}")

    if not os.path.exists(translation_path):
        raise FileNotFoundError(
            f"Translation path does not exist: {translation_path}")

    if not os.path.exists(script_path):
        raise FileNotFoundError(f"Script path does not exist: {script_path}")

    # Get and sort audio files to ensure sequential order
    list_of_audio_files = sorted([
        f for f in os.listdir(audio_folder)
        if f.endswith(('.mp3', '.wav', '.m4a'))
    ])

    with open(script_path, "r", encoding="utf-8") as script_file:
        script_data = json.load(script_file)

    with open(translation_path, "r", encoding="utf-8") as translation_file:
        translation_data = json.load(translation_file)

    list_of_quran_ayah_text = []
    list_of_quran_ayah_translation_text = []

    for audio_file in list_of_audio_files:
        ayah_id = audio_file.split(".")[0]
        # Assuming filename format: SSSTTT (e.g., 001001.mp3)
        surah_number = int(ayah_id[0:3])
        ayah_number = int(ayah_id[3:6])

        key = f"{surah_number}:{ayah_number}"
        list_of_quran_ayah_text.append(script_data[key]["text"])
        list_of_quran_ayah_translation_text.append(translation_data[key]["t"])

    return {
        "audio_files":
        [os.path.join(audio_folder, f) for f in list_of_audio_files],
        "quran_script": list_of_quran_ayah_text,
        "translations": list_of_quran_ayah_translation_text
    }


def cropped_and_resized_background_image(img_path,
                                         expected_width=1920,
                                         expected_height=1080):
    img = ImageClip(img_path)

    # 1. Calculate ratios
    target_ratio = expected_width / expected_height
    img_ratio = img.w / img.h

    if img_ratio > target_ratio:
        # Image is too wide (Landscape) - Crop the sides
        new_width = img.h * target_ratio
        # Center crop horizontally
        img = img.cropped(x_center=img.w / 2, width=new_width)
    else:
        # Image is too tall (Portrait) - Crop the top/bottom
        new_height = img.w / target_ratio
        # Center crop vertically
        img = img.cropped(y_center=img.h / 2, height=new_height)

    # 2. Now that the ratio is exactly 16:9, resize to 1920x1080
    return img.resized(width=expected_width)


def add_bottom_shadow(bg_clip: ImageClip,
                      darkness=0.7,
                      shadow_height=0.5) -> CompositeVideoClip:
    """
    Adds a gradient shadow to the bottom of the image.

    Args:
        bg_clip: The source ImageClip.
        darkness: The opacity of the shadow at the very bottom (0.0 to 1.0).
        shadow_height: The percentage of height the shadow covers (0.0 to 1.0).
    """
    # 1. Get dimensions
    w, h = bg_clip.size

    # 2. Calculate the height of the shadow in pixels
    h_shadow = int(h * shadow_height)
    h_clear = h - h_shadow

    # 3. Create the vertical gradient array (0 to darkness)
    # The top part is fully transparent (0.0)
    # The bottom part fades from 0.0 to 'darkness'
    top_part = np.zeros(h_clear)
    gradient_part = np.linspace(0, darkness, h_shadow)

    # Combine them into one vertical column
    vertical_mask = np.concatenate((top_part, gradient_part))

    # 4. Expand the column to the full image width
    # We repeat the vertical column across the width of the image
    # Shape becomes (Height, Width)
    mask_arr = np.tile(vertical_mask[:, None], (1, w))

    # 5. Create the Shadow Overlay
    # Create a black clip covering the whole screen
    shadow_layer = ColorClip(size=(w, h),
                             color=(0, 0, 0),
                             duration=bg_clip.duration)

    # Create a mask Clip from our numpy array
    # is_mask=True tells MoviePy this is a grayscale alpha mask
    mask_clip = ImageClip(mask_arr, is_mask=True)

    # Apply the mask to the black layer
    shadow_layer = shadow_layer.with_mask(mask_clip)

    # 6. Composite the shadow on top of the background
    final_clip = CompositeVideoClip([bg_clip, shadow_layer])

    return final_clip


def create_video(
        audio_files: list[str],
        quran_script: list[str],
        quran_font: str,
        translations: list[str],
        translation_font: str,
        backgroundImg: str,
        height: int = 1080,
        width: int = 1920,
        outputPath="video.mp4",
        bottom_margin: float = 0.1  # 0.1 = 10% up from the bottom
) -> None:
    # 1. Prepare Audio
    listOfAudioClips = [AudioFileClip(f) for f in audio_files]
    finalAudioClip = concatenate_audioclips(listOfAudioClips)

    # 2. Prepare Background
    bgImage = cropped_and_resized_background_image(img_path=backgroundImg,
                                                   expected_width=width,
                                                   expected_height=height)
    bgImage = bgImage.with_duration(finalAudioClip.duration)
    # Apply shadow so text pops
    bgImage = add_bottom_shadow(bgImage, darkness=0.8, shadow_height=0.6)
    bgImage.audio = finalAudioClip

    # 3. Text Configuration
    # We constrain width to 90% of screen so text wraps, height is Auto
    text_box_width = width * 0.90
    vertical_gap = 40  # Pixels between Quran and Translation

    # Calculate the Y pixel where the text block should END
    # e.g., if Height 1920 and margin 0.1, bottom_limit is 1728
    bottom_limit_y = height * (1.0 - bottom_margin)

    all_text_clips = []
    current_start_time = 0

    # 4. Create and Position Clips Loop
    for index in range(len(audio_files)):
        duration = listOfAudioClips[index].duration

        # --- A. Create Translation Clip (Bottom Text) ---
        # Note: We set size=(text_box_width, None) to let height auto-expand
        trans_clip = TextClip(
            text=translations[index],
            font_size=40,
            font=translation_font,
            text_align="center",
            color="white",
            method='caption',  # Wraps text
            size=(int(text_box_width),
                  None)).with_duration(duration).with_start(current_start_time)

        # --- B. Create Quran Clip (Top Text) ---
        quran_clip = TextClip(
            text=quran_script[index] + "\n ",  # Padding for descenders
            font_size=55,  # Quran usually needs to be slightly larger
            font=quran_font,
            text_align="center",
            color="white",
            method='caption',
            size=(int(text_box_width),
                  None)).with_duration(duration).with_start(current_start_time)

        # --- C. Calculate Positions (Stacking Upwards) ---
        # 1. Place Translation first (Bottom element)
        # Y = Limit - Text Height
        trans_y_pos = bottom_limit_y - trans_clip.h

        # 2. Place Quran above Translation
        # Y = Translation Y - Gap - Quran Height
        quran_y_pos = trans_y_pos - vertical_gap - quran_clip.h

        # Apply positions (Center X, Calculated Y)
        # 'center' for X automatically centers it horizontally
        trans_clip = trans_clip.with_position(('center', trans_y_pos))
        quran_clip = quran_clip.with_position(('center', quran_y_pos))

        all_text_clips.extend([quran_clip, trans_clip])

        # Update start time for next verse
        current_start_time += duration

    # 5. Composite and Render
    final_video = CompositeVideoClip([bgImage] + all_text_clips,
                                     size=(width, height))

    # final_video.preview(fps=5)

    # Write to file
    final_video.write_videofile(outputPath,
                                fps=24,
                                codec="libx264",
                                audio_codec="aac")


if __name__ == "__main__":
    # Redirect stdout and stderr to logging
    sys.stdout = Logger()
    sys.stderr = sys.stdout

    audioPath = "Abdul_Basit_Murattal_192kbps"  ## input("Target Folder Path of Audio: ")
    translationPath = "quran_translations/bn-taisirul-quran-simple.json"  ## input("Target Folder Path of Translation: ")

    try:
        data = get_quran_data(audioPath, translationPath)
        print(f"Successfully loaded {len(data['audio_files'])} ayahs.")

        create_video(
            audio_files=data["audio_files"],
            translations=data["translations"],
            translation_font="fonts/Li Alinur Nakkhatra Unicode.ttf",
            quran_script=data["quran_script"],
            quran_font="indopak_script/Indopak Nastaleeq font.ttf",
            outputPath="output_quran_recitation.mp4",
            backgroundImg=
            "default_background_images/preparation-ramadan-tradition.jpg")

    except Exception:
        traceback.print_exc()

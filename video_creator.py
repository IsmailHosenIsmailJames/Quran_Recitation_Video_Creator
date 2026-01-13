import json
from typing import final

from moviepy import *
import json
import os
import traceback
import sys


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


def cropped_and_resized_background_image(img_path, height=1920, width=1080):
    img = ImageClip(img_path)

    # 1. Calculate ratios
    target_ratio = height / width
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
    return img.resized(width=height)

def create_video(
        audio_files: list[str],
        quran_script: list[str],
        quran_font: str,
        translations: list[str],
        translation_font: str,
        backgroundImg: str,
        height: int = 1920,
        width: int = 1080,
        outputPath="video.mp4",
) -> None:
    # make single audio clips
    listOfAudioClips = []
    for audio_file in audio_files:
        listOfAudioClips.append(AudioFileClip(audio_file))

    # make translation and quran clips list
    listOfQuranClips: list[TextClip] = []
    listOfTranslationClips: list[TextClip] = []

    to_start = 0
    for index in range(len(audio_files)):
        listOfTranslationClips.append(
            TextClip(text=translations[index],
                     font_size=48,
                     font=translation_font,
                     text_align="center",
                     color="white",
                     method='caption',
                     size=(height, width),
                     duration=listOfAudioClips[index].duration).with_start(to_start))

        listOfQuranClips.append(
            TextClip(text=quran_script[index],
                     font_size=48,
                     font=quran_font,
                     text_align="center",
                     color="white",
                     method='caption',
                     size=(height, width),
                     duration=listOfAudioClips[index].duration).with_start(to_start))
        to_start += listOfAudioClips[index].duration

    # set positions of the text clips
    for index in range(len(audio_files)):
        gap = 50
        total_text_height = listOfQuranClips[index].h + gap + listOfTranslationClips[index].h
        start_y = (height - total_text_height) / 2
        listOfQuranClips[index] = listOfQuranClips[index].with_position("center", start_y)
        listOfTranslationClips[index] = listOfTranslationClips[index].with_position("center",
                                                                                    start_y + listOfQuranClips[
                                                                                        index].h + gap)

    # combine a single text clip for apply
    all_text_clips: list[TextClip] = []
    for index in range(len(audio_files)):
        all_text_clips.extend([listOfTranslationClips[index]])

    finalAudioClip = concatenate_audioclips(listOfAudioClips)
    blakScreenClip =cropped_and_resized_background_image(img_path=backgroundImg, height=height, width=width)
    blakScreenClip = blakScreenClip.with_duration(finalAudioClip.duration)

    blakScreenClip.audio = finalAudioClip
    final_video = CompositeVideoClip([blakScreenClip] + all_text_clips)
    final_video.preview()
    # final_video.write_videofile(outputPath, fps=30)


if __name__ == "__main__":
    # Redirect stdout and stderr to logging
    sys.stdout = Logger()
    sys.stderr = sys.stdout

    audioPath = "Abdul_Basit_Mujawwad_128kbps"  ## input("Target Folder Path of Audio: ")
    translationPath = "quran_translations/bn-taisirul-quran-simple.json"  ## input("Target Folder Path of Translation: ")

    try:
        data = get_quran_data(audioPath, translationPath)
        print(f"Successfully loaded {len(data['audio_files'])} ayahs.")

        create_video(audio_files=data["audio_files"],
                     translations=data["translations"],
                     translation_font="fonts/Li Alinur Nakkhatra Unicode.ttf",
                     quran_script=data["quran_script"],
                     quran_font="indopak_script/Indopak Nastaleeq font.ttf",
                     outputPath="output_quran_recitation.mp4",
                     backgroundImg="default_background_images/preparation-ramadan-tradition.jpg")

    except Exception:
        traceback.print_exc()

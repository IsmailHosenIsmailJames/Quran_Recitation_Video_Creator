import requests
import json
import os

with open("recitation_info.json", "r") as f:
    data = json.load(f)
    listOfAyah = data["ayahCount"]

surahToDownload = int(input("Enter the surah number: "))
ayahLimit = int(input("O for All. Enter the ayah limit: "))
ayahNumber = listOfAyah[surahToDownload - 1]

if ayahLimit == 0: ayahLimit = ayahNumber
elif ayahLimit > ayahNumber:
    print(f"Ayah limit exceeded. Using {ayahNumber} ayahs")
    ayahLimit = ayahNumber
reciterId = input("Enter the reciter id: ")

reciterSubFolder = data["recitation"][reciterId]["subfolder"]

# check if the folder exists
if not os.path.exists(reciterSubFolder):
    os.makedirs(reciterSubFolder)
else:
    print("Folder already exists")
    # check inside file ends with .mp3
    countOfMP3 = 0
    for file in os.listdir(reciterSubFolder):
        if file.endswith(".mp3"):
            countOfMP3 += 1
    if countOfMP3 == ayahNumber:
        print("All recitation already downloaded")
        exit()

for i in range(ayahLimit):
    ayahId = str(surahToDownload).zfill(3) + str(i + 1).zfill(3)
    fullDownloadURL = "https://everyayah.com/data/" + reciterSubFolder + "/" + ayahId + ".mp3"
    if os.path.exists(reciterSubFolder + "/" + ayahId + ".mp3"):
        print("Skipped as already downloaded : " + fullDownloadURL)
        continue
    print("Downloading : " + fullDownloadURL)
    response = requests.get(fullDownloadURL)
    with open(reciterSubFolder + "/" + ayahId + ".mp3", "wb") as f:
        f.write(response.content)

from pathlib import Path

from PIL import Image, ImageOps


SOURCES = {
    "e3500-01": Path(
        r"E:/YandexDisk/Фотокамера/Завод/Premium E - 3500/P1280025.jpg"
    ),
    "e3500-02": Path(
        r"E:/YandexDisk/Фотокамера/Завод/Premium E - 3500/P1280032.1.jpg"
    ),
    "e7000-01": Path(
        r"E:/YandexDisk/Фотокамера/Завод/Premium E - 7000 (07_10_2025)/Premium E - 7000.3.jpg"
    ),
    "e7000-02": Path(
        r"E:/YandexDisk/Фотокамера/Завод/Premium E - 7000 (07_10_2025)/Premium E - 7000.4.jpg"
    ),
    "e7000-03": Path(
        r"E:/YandexDisk/Фотокамера/Завод/Premium E - 7000 (07_10_2025)/Premium E - 7000.5.jpg"
    ),
    "e7000-04": Path(
        r"E:/YandexDisk/Фотокамера/Завод/Premium E - 7000 (07_10_2025)/Premium E - 7000.30.jpg"
    ),
    "e7000-05": Path(
        r"E:/YandexDisk/Фотокамера/Завод/Premium E - 7000 (07_10_2025)/Premium E - 7000.jpg"
    ),
    "e6000-01": Path(
        r"E:/YandexDisk/Фотокамера/Завод/Premium E - 6000/Premium E - 6000.2.jpg"
    ),
    "e6000-02": Path(
        r"E:/YandexDisk/Фотокамера/Завод/Premium E - 6000/Premium E - 6000.3.jpg"
    ),
    "e6000-03": Path(
        r"E:/YandexDisk/Фотокамера/Завод/Premium E - 6000/Premium E.jpg"
    ),
    "e4000-01": Path(
        r"E:/YandexDisk/Фотокамера/Завод/Premium E - 4000/Premium E - 4000.1.jpg"
    ),
    "e4000-02": Path(
        r"E:/YandexDisk/Фотокамера/Завод/Premium E - 4000/Premium E - 4000.2.jpg"
    ),
}

OUTPUT_DIR = Path(__file__).resolve().parents[1] / "assets" / "boilers"
PROJECT_DIR = Path(__file__).resolve().parents[1]
PRODUCTION_SOURCES = {
    "stage-01": PROJECT_DIR / "uploads" / "photo_2026-02-26_18-52-18.jpg",
    "stage-02": PROJECT_DIR / "uploads" / "вальцевание.jpg",
    "stage-03": PROJECT_DIR / "uploads" / "IMG_4178.jpg",
    "stage-04": PROJECT_DIR / "uploads" / "IMG_3913.jpg",
    "stage-05": PROJECT_DIR / "uploads" / "2026-03-23_19-55-07.png",
    "stage-06": PROJECT_DIR / "uploads" / "IMG_6690.00_01_00_52.Still002.png",
    "stage-07": PROJECT_DIR / "uploads" / "IMG_7670.00_00_02_58.Still006.jpg",
}
PRODUCTION_OUTPUT_DIR = PROJECT_DIR / "assets" / "production"


def resized_width(image: Image.Image, width: int) -> Image.Image:
    if image.width <= width:
        return image.copy()
    height = round(image.height * width / image.width)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def optimize() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for stem, source in SOURCES.items():
        if not source.exists():
            raise FileNotFoundError(source)

        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            for width in (960, 1600):
                resized = resized_width(image, width)
                target = OUTPUT_DIR / f"{stem}-{width}.webp"
                resized.save(target, "WEBP", quality=80, method=6)

    PRODUCTION_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for stem, source in PRODUCTION_SOURCES.items():
        if not source.exists():
            raise FileNotFoundError(source)
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            resized = resized_width(image, 720)
            resized.save(
                PRODUCTION_OUTPUT_DIR / f"{stem}.webp",
                "WEBP",
                quality=76,
                method=6,
            )


if __name__ == "__main__":
    optimize()

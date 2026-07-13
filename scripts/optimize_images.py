from pathlib import Path

from PIL import Image, ImageOps


SOURCES = {
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


def optimize() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for stem, source in SOURCES.items():
        if not source.exists():
            raise FileNotFoundError(source)

        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            for width in (960, 1600):
                if image.width <= width:
                    resized = image.copy()
                else:
                    height = round(image.height * width / image.width)
                    resized = image.resize((width, height), Image.Resampling.LANCZOS)

                target = OUTPUT_DIR / f"{stem}-{width}.webp"
                resized.save(target, "WEBP", quality=80, method=6)


if __name__ == "__main__":
    optimize()


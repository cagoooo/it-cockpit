"""把各週 NotebookLM 簡報 PDF 預先轉成逐頁 WebP，讓播放頁不必下載整份 13~24 MB PDF。

輸出：week-XX/<deck>-pages/01.webp（全尺寸）與 01-thumb.webp（總覽縮圖）。
用法：python gifted-ai-lab/tools/build-slide-images.py
"""
import io
import json
from pathlib import Path

import fitz
from PIL import Image

LAB = Path(__file__).resolve().parent.parent
DECKS = ('notebooklm-kai-slides', 'notebooklm-kai-slides-v2')
FULL_WIDTH = 1600
THUMB_WIDTH = 400


def page_image(page):
    """優先取頁面內嵌的原圖（NotebookLM PDF 每頁就是一張圖），否則以 2x 解析度點陣化。"""
    images = page.get_images(full=True)
    if len(images) == 1:
        data = page.parent.extract_image(images[0][0])
        return Image.open(io.BytesIO(data['image'])).convert('RGB')
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    return Image.frombytes('RGB', (pix.width, pix.height), pix.samples)


def resize(image, width):
    if image.width <= width:
        return image
    return image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)


summary = {}
for week_dir in sorted(LAB.glob('week-[0-9][0-9]')):
    for deck in DECKS:
        pdf = week_dir / f'{deck}.pdf'
        if not pdf.exists():
            continue
        out = week_dir / f'{deck}-pages'
        out.mkdir(exist_ok=True)
        for old in out.glob('*.webp'):
            old.unlink()
        with fitz.open(pdf) as doc:
            for number, page in enumerate(doc, start=1):
                image = page_image(page)
                resize(image, FULL_WIDTH).save(out / f'{number:02d}.webp', 'WEBP', quality=82, method=6)
                resize(image, THUMB_WIDTH).save(out / f'{number:02d}-thumb.webp', 'WEBP', quality=70, method=6)
            pages = doc.page_count
        size = sum(f.stat().st_size for f in out.glob('*.webp'))
        summary[f'{week_dir.name}/{deck}'] = {'pages': pages, 'pdf_bytes': pdf.stat().st_size, 'webp_bytes': size}
        print(f'{week_dir.name}/{deck}: {pages} 頁, PDF {pdf.stat().st_size / 1e6:.1f} MB -> WebP {size / 1e6:.2f} MB')

(LAB / 'slide-image-manifest.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

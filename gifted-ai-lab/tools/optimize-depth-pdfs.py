"""Compress image-based NotebookLM slide PDFs for iPad delivery.

NotebookLM 匯出的 PDF 每頁是一張無壓縮大圖（每份 13~24 MB），這裡把每頁重存成 JPEG。
已壓縮過的檔案（平均每頁 < 500 KB）會跳過，避免重跑時一再降低畫質。
"""

from pathlib import Path

import fitz


LAB_DIR = Path(__file__).resolve().parent.parent
PATTERNS = (
    "week-*/depth-slides.pdf",
    "week-*/notebooklm-kai-slides.pdf",
    "week-*/notebooklm-kai-slides-v2.pdf",
    "materials/NotebookLM-年度課程簡報.pdf",
)
ALREADY_OPTIMIZED_BYTES_PER_PAGE = 500 * 1024


for source_path in sorted(path for pattern in PATTERNS for path in LAB_DIR.glob(pattern)):
    source = fitz.open(source_path)
    before = source_path.stat().st_size
    if before / source.page_count < ALREADY_OPTIMIZED_BYTES_PER_PAGE:
        source.close()
        print(f"Skipped {source_path.relative_to(LAB_DIR)}: already optimized ({before / 1024 / 1024:.2f} MB)")
        continue
    output = fitz.open()
    for page in source:
        width = page.rect.width
        scale = max(1.0, 1440 / width)
        pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
        image = pixmap.tobytes("jpeg", jpg_quality=84)
        target = output.new_page(width=page.rect.width, height=page.rect.height)
        target.insert_image(target.rect, stream=image)

    temp_path = source_path.with_suffix(".optimized.pdf")
    output.save(temp_path, garbage=4, deflate=True)
    output.close()
    source.close()
    temp_path.replace(source_path)
    print(f"Optimized {source_path.relative_to(LAB_DIR)}: {before / 1024 / 1024:.1f} MB -> {source_path.stat().st_size / 1024 / 1024:.2f} MB")

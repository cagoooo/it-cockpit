"""Compress image-based NotebookLM slide PDFs for iPad delivery."""

from pathlib import Path

import fitz


LAB_DIR = Path(__file__).resolve().parent.parent


for source_path in sorted(LAB_DIR.glob("week-*/depth-slides.pdf")):
    source = fitz.open(source_path)
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
    print(f"Optimized {source_path.parent.name}: {source_path.stat().st_size / 1024 / 1024:.2f} MB")

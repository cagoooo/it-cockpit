"""為資優班首頁的小卡片產生小尺寸縮圖（*-sm.webp），首頁不必再下載全尺寸大圖。

- week-XX/week-illustration-sm.webp：側邊欄週次小圖、繪本卡片
- week-XX/notebooklm-kai-slides-v2-thumb-sm.webp：簡報卡片
- lesson-videos/week-XX/lesson-video-card-sm.webp：小影片卡片
用法：python gifted-ai-lab/tools/build-home-thumbs.py
"""
from pathlib import Path

from PIL import Image

LAB = Path(__file__).resolve().parent.parent
TARGETS = (
    ('week-[0-9][0-9]/week-illustration.webp', 480),
    ('week-[0-9][0-9]/notebooklm-kai-slides-v2-thumb.webp', 640),
    ('lesson-videos/week-[0-9][0-9]/lesson-video-card.webp', 480),
)

for pattern, width in TARGETS:
    for source in sorted(LAB.glob(pattern)):
        target = source.with_name(f'{source.stem}-sm.webp')
        image = Image.open(source).convert('RGB')
        if image.width > width:
            image = image.resize((width, round(image.height * width / image.width)), Image.LANCZOS)
        image.save(target, 'WEBP', quality=78, method=6)
        print(f'{target.relative_to(LAB)}: {source.stat().st_size // 1024}K -> {target.stat().st_size // 1024}K')

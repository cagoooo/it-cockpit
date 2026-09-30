"""Generate original, source-checked PNG assets for the sixth-grade cockpit."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).resolve().parent
ASSETS = HERE / "assets"
ASSETS.mkdir(exist_ok=True)
FONT_BOLD = r"C:\Windows\Fonts\msjhbd.ttc"
FONT_REGULAR = r"C:\Windows\Fonts\msjh.ttc"
INK = "#252735"
RED = "#d84657"
BLUE = "#256cbb"
GOLD = "#f6bb43"
GREEN = "#237a61"
PAPER = "#fff9f1"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REGULAR, size)


def rounded(draw, box, fill, radius=22, outline=INK, width=4):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(draw, xy, value, size, fill=INK, bold=False):
    draw.text(xy, value, fill=fill, font=font(size, bold))


def og():
    im = Image.new("RGB", (1200, 630), PAPER)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 1200, 15), fill=RED)
    d.rectangle((300, 0, 600, 15), fill=GOLD)
    d.rectangle((600, 0, 900, 15), fill=BLUE)
    d.rectangle((900, 0, 1200, 15), fill=GREEN)
    rounded(d, (55, 60, 493, 115), GOLD, 14)
    text(d, (78, 69), "石門國小 · 六年級彈性資訊", 28, bold=True)
    text(d, (58, 161), "數位真相", 96, bold=True)
    text(d, (58, 270), "調查局", 108, RED, True)
    text(d, (62, 416), "AI 幻覺 × 訊息擴散 × 橫向閱讀", 37, bold=True)
    text(d, (62, 489), "先停 · 再查 · 看脈絡 · 慎分享", 30, BLUE, True)
    rounded(d, (820, 160, 1100, 468), "#e4f1ff", 30, width=6)
    d.ellipse((865, 205, 1008, 348), outline=BLUE, width=22)
    d.line((981, 329, 1065, 417), fill=BLUE, width=28)
    d.ellipse((901, 242, 972, 313), fill=PAPER)
    d.ellipse((1070, 150, 1140, 220), fill=GOLD, outline=INK, width=4)
    text(d, (1086, 161), "?", 48, bold=True)
    im.save(HERE / "og-image.png", optimize=True)


def checklist():
    im = Image.new("RGB", (1600, 900), PAPER)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 1600, 17), fill=RED)
    text(d, (66, 58), "數位小偵探｜五步查證卡", 67, bold=True)
    text(d, (70, 150), "遇到驚人訊息，不必急著猜真假。先提出問題，再找證據。", 32)
    steps = [
        ("01", "先停", "情緒越強，越值得停一下。", RED),
        ("02", "查來源", "找原始發布者與日期。", BLUE),
        ("03", "看脈絡", "確認地點、時間、完整畫面。", GREEN),
        ("04", "比證據", "比對獨立來源，不算轉貼。", "#a46b0b"),
        ("05", "慎分享", "仍不確定就先不轉傳。", RED),
    ]
    for i, (n, title, detail, color) in enumerate(steps):
        y = 240 + i * 111
        rounded(d, (65, y, 1535, y + 93), "#ffffff", 18)
        rounded(d, (80, y + 12, 151, y + 80), color, 13, width=2)
        text(d, (89, y + 20), n, 35, "#ffffff", True)
        text(d, (176, y + 18), title, 38, color, True)
        text(d, (430, y + 23), detail, 30)
    text(d, (66, 810), "課堂案例：阿波羅 11 號、臺灣金門大橋與舊金山金門大橋", 26, bold=True)
    text(d, (66, 847), "來源：NASA、金門觀光旅遊網、交通部高公局、Golden Gate Bridge 管理局", 21)
    im.save(ASSETS / "checklist.png", optimize=True)


if __name__ == "__main__":
    og()
    checklist()
    print("Created og-image.png and assets/checklist.png")

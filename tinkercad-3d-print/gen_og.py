# -*- coding: utf-8 -*-
"""
Tinkercad 3D列印單元 OG 圖片生成器 - circuit-glow 風格
"""
from PIL import Image, ImageDraw, ImageFont
import os
import sys
import io
import math

# 設定 UTF-8 輸出
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# === circuit-glow 配色 ===
BG = (10, 31, 26)          # #0a1f1a PCB 深綠板底
SURFACE = (14, 42, 34)     # #0e2a22
PANEL = (20, 56, 50)       # #143832
C1 = (76, 217, 100)        # #4cd964 LED 螢光綠 (主色)
C2 = (255, 179, 0)         # #ffb300 焊點金黃
C3 = (255, 61, 61)         # #ff3d3d LED 紅 (ghost)
TEXT_COL = (224, 240, 232) # #e0f0e8 絲印白
DIM = (90, 125, 112)       # #5a7d70 暗綠灰

FONT_ZH_B = r"C:\Windows\Fonts\msjhbd.ttc"
FONT_ZH   = r"C:\Windows\Fonts\msjh.ttc"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"

def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def draw_cx(d, text, font, y, W, fill):
    bb = d.textbbox((0, 0), text, font=font)
    tw = bb[2] - bb[0]
    th = bb[3] - bb[1]
    d.text(((W - tw) // 2, y), text, font=font, fill=fill)
    return th

def make_glow_og(out_path, title, subtitle, tags, url):
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(img)
    
    # 1. 繪製 PCB 走線格紋與焊點圓
    grid_size = 40
    for x in range(0, W, grid_size):
        d.line([(x, 0), (x, H)], fill=(13, 40, 33), width=1)
    for y in range(0, H, grid_size):
        d.line([(0, y), (W, y)], fill=(13, 40, 33), width=1)
        
    # 繪製裝飾電路走線
    走線 = [
        [(80, 100), (200, 100), (250, 150)],
        [(W-80, H-100), (W-200, H-100), (W-250, H-150)],
        [(80, H-120), (150, H-120), (180, H-90)],
        [(W-100, 120), (W-150, 120), (W-180, 90)]
    ]
    for line in 走線:
        d.line(line, fill=(24, 75, 62), width=2)
        # 走線端點畫小圓圈 (焊點)
        ex, ey = line[-1]
        d.ellipse([ex-4, ey-4, ex+4, ey+4], fill=C2)
        
    # 在卡片四個角落繪製金色焊點
    solder_points = [(15, 15), (W-15, 15), (15, H-15), (W-15, H-15)]
    for (cx, cy) in solder_points:
        d.ellipse([cx-6, cy-6, cx+6, cy+6], fill=C2, outline=(139, 106, 0))
    
    # 2. 螢光綠外框
    border_w = 6
    d.rectangle([0, 0, W, H], outline=C1, width=border_w)
    
    # 3. 左上年級 badge
    fb = load_font(FONT_ZH_B, 22)
    badge_txt = "五年級 資訊科技"
    bb = d.textbbox((0, 0), badge_txt, font=fb)
    bw = bb[2] - bb[0] + 24
    bh = bb[3] - bb[1] + 12
    d.rectangle([24, 24, 24+bw, 24+bh], fill=C1)
    d.text((36, 30), badge_txt, font=fb, fill=BG)
    
    # 4. 右上浮水印
    fm = load_font(FONT_MONO, 20)
    d.text((W-24-120, 30), "IT COCKPIT", font=fm, fill=C1)
    
    # 5. 主標題 (雙描邊, 橘/紅鬼影在右下，主色螢光綠在上)
    ft = load_font(FONT_ZH_B, 76)
    bb = d.textbbox((0, 0), title, font=ft)
    tw = bb[2] - bb[0]
    tx = (W - tw) // 2
    ty = 170
    
    # 繪製 ghost
    d.text((tx+4, ty+4), title, font=ft, fill=C3)
    # 繪製主標題
    d.text((tx, ty), title, font=ft, fill=C1)
    
    # 6. 副標題
    fs = load_font(FONT_ZH, 36)
    sy = ty + 110
    draw_cx(d, subtitle, fs, sy, W, TEXT_COL)
    
    # 7. 分隔線 (雙色)
    div_y = sy + 65
    d.line([(120, div_y+2), (W-120, div_y+2)], fill=C3, width=2)
    d.line([(120, div_y), (W-120, div_y)], fill=C1, width=2)
    
    # 8. Tags (螢光綠框 + 深色底 + 絲印白字)
    ftag = load_font(FONT_ZH_B, 24)
    gap = 16
    tws = [d.textbbox((0, 0), t, font=ftag)[2] - d.textbbox((0, 0), t, font=ftag)[0] + 32 for t in tags]
    total_w = sum(tws) + gap * (len(tags) - 1)
    x0 = (W - total_w) // 2
    tag_y = div_y + 35
    tag_h = 48
    
    for i, (t, tw_) in enumerate(zip(tags, tws)):
        x = x0 + sum(tws[:i]) + gap * i
        d.rectangle([x, tag_y, x+tw_, tag_y+tag_h], fill=SURFACE, outline=C1, width=2)
        bb3 = d.textbbox((0, 0), t, font=ftag)
        lw = bb3[2] - bb3[0]
        lh = bb3[3] - bb3[1]
        d.text((x + (tw_-lw)//2, tag_y + (tag_h-lh)//2 - 2), t, font=ftag, fill=TEXT_COL)
        
    # 9. 網址
    fu = load_font(FONT_MONO, 22)
    draw_cx(d, url, fu, tag_y + tag_h + 35, W, DIM)
    
    img.save(out_path, 'PNG')
    print(f"Successfully generated: {out_path}")

if __name__ == '__main__':
    out_dir = r"c:\Users\smes\Desktop\Cowork\2-教學備課\NBLM\it-cockpit\tinkercad-3d-print"
    make_glow_og(
        out_path=os.path.join(out_dir, "og-image.png"),
        title="Tinkercad 3D列印",
        subtitle="從3D空間建模到實體列印的創客冒險",
        tags=["3D空間與建模", "尺寸形狀微調", "對齊與群組化", "切片支撐原理"],
        url="cagoooo.github.io/it-cockpit/tinkercad-3d-print/"
    )

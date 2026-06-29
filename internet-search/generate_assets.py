# -*- coding: utf-8 -*-
import os
import sys
from PIL import Image, ImageDraw, ImageFont

# 漫畫風格配色 (comic-soft)
BG_COLOR = (254, 249, 240)    # #fef9f0 米黃
BORDER_COLOR = (44, 44, 44)   # #2c2c2c 印刷黑
ACCENT_C1 = (255, 107, 107)   # #ff6b6b 漫畫紅
ACCENT_C2 = (255, 169, 77)    # #ffa94d 漫畫橘
ACCENT_C3 = (81, 207, 102)    # #51cf66 漫畫綠
ACCENT_C4 = (51, 154, 240)    # #339af0 漫畫藍
TEXT_COLOR = (44, 44, 44)     # #2c2c2c
DIM_COLOR = (134, 134, 134)   # #868686

FONT_PATH_ZH_B = r"C:\Windows\Fonts\msjhbd.ttc"
FONT_PATH_ZH   = r"C:\Windows\Fonts\msjh.ttc"
FONT_PATH_MONO = r"C:\Windows\Fonts\consola.ttf"

def load_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def draw_centered_text(d, text, font, y, W, fill):
    bb = d.textbbox((0,0), text, font=font)
    w = bb[2] - bb[0]
    h = bb[3] - bb[1]
    d.text(((W - w) // 2, y), text, font=font, fill=fill)
    return h

def generate_og_image(out_path, url_suffix):
    W, H = 1200, 630
    img = Image.new('RGB', (W, H), BG_COLOR)
    d = ImageDraw.Draw(img)
    
    # 漫畫粗邊框 (2.5px inline border)
    d.rectangle([10, 10, W-10, H-10], outline=BORDER_COLOR, width=5)
    
    # 左上角 年級標誌 badge
    badge_text = "三年級 資訊科技"
    fb = load_font(FONT_PATH_ZH_B, 24)
    bb = d.textbbox((0,0), badge_text, font=fb)
    btw, bth = bb[2]-bb[0] + 24, bb[3]-bb[1] + 16
    
    # 畫 badge 橘色背景
    d.rectangle([25, 25, 25+btw, 25+bth], fill=ACCENT_C2, outline=BORDER_COLOR, width=3)
    d.text((37, 31), badge_text, font=fb, fill=BORDER_COLOR)
    
    # 右上角 IT COCKPIT
    fwm = load_font(FONT_PATH_MONO, 22)
    wm_text = "IT COCKPIT"
    bb2 = d.textbbox((0,0), wm_text, font=fwm)
    d.text((W - 25 - (bb2[2]-bb2[0]), 31), wm_text, font=fwm, fill=BORDER_COLOR)
    
    # 裝飾性漫畫大圓點
    d.ellipse([50, 120, 80, 150], fill=ACCENT_C4, outline=BORDER_COLOR, width=3)
    d.ellipse([W-80, 110, W-50, 140], fill=ACCENT_C1, outline=BORDER_COLOR, width=3)
    
    # 主標題 (紅色 offset 雙影)
    ft = load_font(FONT_PATH_ZH_B, 68)
    title = "網路搜查特攻隊"
    bb_title = d.textbbox((0,0), title, font=ft)
    tx = (W - (bb_title[2]-bb_title[0])) // 2
    ty = 135
    
    # 陰影
    d.text((tx+6, ty+6), title, font=ft, fill=ACCENT_C2)
    # 描邊
    d.text((tx, ty), title, font=ft, fill=ACCENT_C1)
    d.text((tx+1, ty), title, font=ft, fill=BORDER_COLOR) # 簡單黑邊模擬
    d.text((tx, ty), title, font=ft, fill=ACCENT_C1)
    
    # 副標題 (墨黑)
    fs = load_font(FONT_PATH_ZH_B, 34)
    subtitle = "認識網際網路與搜尋高手"
    sy = ty + 105
    draw_centered_text(d, subtitle, fs, sy, W, TEXT_COLOR)
    
    # 雙色分割線
    dy = sy + 65
    d.line([(100, dy), (W-100, dy)], fill=BORDER_COLOR, width=3)
    d.line([(102, dy+3), (W-102, dy+3)], fill=ACCENT_C2, width=2)
    
    # Tags (3個)
    ftag = load_font(FONT_PATH_ZH_B, 24)
    tags = ["🌐 網際網路", "🚢 瀏覽器網址", "🔑 關鍵字搜尋"]
    tag_colors = [ACCENT_C4, ACCENT_C2, ACCENT_C3]
    
    gap = 20
    tws = []
    for t in tags:
        bb_tag = d.textbbox((0,0), t, font=ftag)
        tws.append(bb_tag[2]-bb_tag[0] + 32)
        
    total_tags_w = sum(tws) + gap * (len(tags) - 1)
    x0 = (W - total_tags_w) // 2
    tag_y = dy + 35
    tag_h = 50
    
    for i, (t, tw, col) in enumerate(zip(tags, tws, tag_colors)):
        x = x0 + sum(tws[:i]) + gap * i
        # 漫畫卡片效果
        d.rectangle([x+4, tag_y+4, x+tw+4, tag_y+tag_h+4], fill=BORDER_COLOR)
        d.rectangle([x, tag_y, x+tw, tag_y+tag_h], fill=BG_COLOR, outline=BORDER_COLOR, width=3)
        # 文字
        bb_t = d.textbbox((0,0), t, font=ftag)
        tx_ = x + (tw - (bb_t[2]-bb_t[0])) // 2
        ty_ = tag_y + (tag_h - (bb_t[3]-bb_t[1])) // 2 - 2
        d.text((tx_, ty_), t, font=ftag, fill=BORDER_COLOR)
        
    # URL
    fu = load_font(FONT_PATH_MONO, 20)
    url = "cagoooo.github.io/it-cockpit/" + url_suffix
    draw_centered_text(d, url, fu, tag_y + tag_h + 35, W, DIM_COLOR)
    
    img.save(out_path, 'PNG')
    print("[OG-IMAGE] Generated at " + out_path)

def optimize_infographic(in_path, out_path):
    if not os.path.exists(in_path):
        print("[INFOGRAPHIC] File not found: " + in_path)
        return
    img = Image.open(in_path).convert('RGB')
    # Resize to 1920x1080
    img = img.resize((1920, 1080), Image.Resampling.LANCZOS)
    img.save(out_path, 'JPEG', quality=85)
    print("[INFOGRAPHIC] Optimized and saved to " + out_path)
    
if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. 產生 OG Image
    og_path = os.path.join(current_dir, "og-image.png")
    generate_og_image(og_path, "internet-search/")
    
    # 2. 優化 Infographic
    info_in = os.path.join(current_dir, "assets", "infographic.png")
    info_out = os.path.join(current_dir, "assets", "01_安全上網秘笈.jpg")
    optimize_infographic(info_in, info_out)
    if os.path.exists(info_in):
        os.remove(info_in) # 刪除原始檔

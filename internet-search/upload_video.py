# -*- coding: utf-8 -*-
import json
import sys
import time
import tempfile
import os
import subprocess
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# 確保輸出支援 utf-8
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    assets_dir = os.path.join(current_dir, "assets")
    
    video_path = os.path.join(assets_dir, "影片概覽.mp4")
    cover_png = os.path.join(current_dir, "og-image.png")
    cover_jpg = os.path.join(assets_dir, "cover_temp.jpg")
    srt_zh = os.path.join(assets_dir, "zh-TW.srt")
    srt_en = os.path.join(assets_dir, "en.srt")
    
    if not os.path.exists(video_path):
        print(f"[ERR] 找不到影片檔案：{video_path}")
        return

    # Step 1: 讀取 Token 並進行 Hard Gate 頻道驗證 (個人台優先)
    token_path = os.path.expanduser("~/.youtube_auth/token_personal.json")
    if not os.path.exists(token_path):
        print("[WARN] 找不到 token_personal.json，嘗試使用 token.json...")
        token_path = os.path.expanduser("~/.youtube_auth/token.json")
        
    if not os.path.exists(token_path):
        print("[ERR] 找不到任何 YouTube 驗證 token！")
        return
        
    print(f"使用憑證：{token_path}")
    creds = Credentials.from_authorized_user_file(token_path)
    if creds.expired and creds.refresh_token:
        print("重新整理 Token 授權...")
        creds.refresh(Request())
        
    yt = build("youtube", "v3", credentials=creds)
    
    # 頻道安全驗證 (Hard Gate)
    res = yt.channels().list(mine=True, part="snippet").execute()
    channel_title = res["items"][0]["snippet"]["title"]
    print(f"目標頻道：【{channel_title}】")
    
    if "token_personal" in token_path:
        if "Kai" not in channel_title and "阿凱" not in channel_title:
            print(f"[ERR] 頻道名稱 '{channel_title}' 與個人台憑證預期不符！")
            return
    else:
        if "石門" not in channel_title:
            print(f"[ERR] 頻道名稱 '{channel_title}' 與學校官方台憑證預期不符！")
            return
            
    print("✅ 頻道驗證通過，準備開始上傳！")
    
    # 說明欄配置 (不含 Made with ❤️ 署名，僅大綱與章節)
    title = "網路搜查特攻隊：認識網際網路與搜尋高手｜三年級資訊科技自學影片"
    desc = """🕵️ 網路搜查特攻隊：認識網際網路與搜尋高手｜三年級資訊科技自學影片

本影片為國小三年級資訊科技自學教材，由 NotebookLM 協作生成。
引導孩子理解無形的網際網路、操作瀏覽器魔法船、輸入精準門牌網址，並掌握關鍵字 AND/OR 組合搜尋及安全防禦守則。

📖 影片章節目錄
00:00 🔍 網路搜查特攻隊：開場暖身
01:30 🌐 網際網路是什麼？看不見的大漁網
03:00 🚢 上網魔法船與門牌網址
05:00 🔑 關鍵字搜尋技巧與 AND/OR 組合
07:30 🛡️ 開啟安全防護罩與網路禮儀
09:15 🎓 結語與冒險啟航
"""

    body = {
        "snippet": {
            "title": title,
            "description": desc,
            "tags": ["網際網路", "瀏覽器", "網址", "關鍵字搜尋", "網路安全", "資訊科技", "三年級"],
            "categoryId": "27",
            "defaultLanguage": "zh-TW",
            "defaultAudioLanguage": "zh-TW",
        },
        "status": {"privacyStatus": "unlisted", "selfDeclaredMadeForKids": False},
    }
    
    # 開始分塊上傳
    media = MediaFileUpload(video_path, chunksize=64 * 1024 * 1024, resumable=True, mimetype="video/mp4")
    req = yt.videos().insert(part="snippet,status", body=body, media_body=media)
    
    print("開始上傳影片...", flush=True)
    resp = None
    while resp is None:
        try:
            status, resp = req.next_chunk()
        except Exception as e:
            print(f"上傳中斷重試: {e}", flush=True)
            time.sleep(5)
            continue
        if status:
            pct = int(status.progress() * 100)
            print(f"  上傳進度: {pct}%", flush=True)
            
    vid = resp["id"]
    print(f"🎉 影片上傳成功！VIDEO_ID={vid}")
    print(f"觀看網址: https://youtu.be/{vid}")
    
    # Step 3: 上傳封面 (雷 6: 轉 JPG 壓縮)
    if os.path.exists(cover_png):
        print("正在壓縮封面圖片為 JPG 以符合 2MB 限制...")
        try:
            subprocess.run(["ffmpeg", "-y", "-i", cover_png, "-q:v", "2", cover_jpg], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if os.path.exists(cover_jpg) and os.path.getsize(cover_jpg) < 2 * 1024 * 1024:
                yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(cover_jpg)).execute()
                print("✅ 封面自訂成功！")
            else:
                print("[WARN] 轉檔 JPG 後大小仍大於 2MB 或不存在，跳過自訂封面。")
        except Exception as e:
            print(f"[WARN] 自訂封面設定失敗: {e}")
        finally:
            if os.path.exists(cover_jpg):
                os.remove(cover_jpg)
                
    # Step 4: 上傳繁中字幕
    if os.path.exists(srt_zh):
        print("上傳繁體中文（台灣）字幕軌...")
        try:
            # 轉換為 UTF-8 with BOM
            with open(srt_zh, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
            tmp_zh = os.path.join(tempfile.gettempdir(), f"zh_tw_{vid}.srt")
            with open(tmp_zh, 'w', encoding='utf-8-sig') as f:
                f.write(text)
                
            yt.captions().insert(
                part="snippet",
                body={"snippet": {"videoId": vid, "language": "zh-TW", "name": "中文（台灣）", "isDraft": False}},
                media_body=MediaFileUpload(tmp_zh, mimetype="application/octet-stream"),
            ).execute()
            print("✅ 繁體中文字幕 OK")
            os.remove(tmp_zh)
        except Exception as e:
            print(f"[WARN] 繁中字幕上傳失敗: {e}")
            
    # Step 5: 上傳英文字幕
    if os.path.exists(srt_en):
        print("上傳英文字幕軌...")
        try:
            with open(srt_en, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
            tmp_en = os.path.join(tempfile.gettempdir(), f"en_{vid}.srt")
            with open(tmp_en, 'w', encoding='utf-8-sig') as f:
                f.write(text)
                
            yt.captions().insert(
                part="snippet",
                body={"snippet": {"videoId": vid, "language": "en", "name": "English", "isDraft": False}},
                media_body=MediaFileUpload(tmp_en, mimetype="application/octet-stream"),
            ).execute()
            print("✅ 英文字幕 OK")
            os.remove(tmp_en)
        except Exception as e:
            print(f"[WARN] 英文字幕上傳失敗: {e}")
            
    # 寫入結果 txt
    res_path = os.path.join(assets_dir, "youtube_video_id.txt")
    result_data = {
        "video_id": vid,
        "watch_url": f"https://www.youtube.com/watch?v={vid}",
        "embed_url": f"https://www.youtube.com/embed/{vid}",
        "title": title,
        "privacy": "unlisted"
    }
    with open(res_path, 'w', encoding='utf-8') as f:
        json.dump(result_data, f, ensure_ascii=False, indent=2)
        
    # Step 6: 回填寫入 index.html 中的 YOUTUBE_VIDEO_ID
    index_html_path = os.path.join(current_dir, "index.html")
    if os.path.exists(index_html_path):
        with open(index_html_path, 'r', encoding='utf-8') as f:
            html = f.read()
        # 尋找 let YOUTUBE_VIDEO_ID = ""; 並替換之
        old_str = 'let YOUTUBE_VIDEO_ID = "";'
        new_str = f'let YOUTUBE_VIDEO_ID = "{vid}";'
        if old_str in html:
            html = html.replace(old_str, new_str)
            with open(index_html_path, 'w', encoding='utf-8') as f:
                f.write(html)
            print("✅ 已將 YOUTUBE_VIDEO_ID 自動回填 index.html")
        else:
            print("[WARN] 無法在 index.html 中找到 YOUTUBE_VIDEO_ID 的宣告預留行！")
            
    print("\n🎉 ALL DONE! YouTube 影片部署一條龍完成！")

if __name__ == '__main__':
    main()

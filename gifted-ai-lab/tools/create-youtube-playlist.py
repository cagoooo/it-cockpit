# -*- coding: utf-8 -*-
"""Create or repair the public Kai A playlist for the gifted AI course."""

from __future__ import annotations

import io
import json
import sys
import time
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "youtube" / "manifest.json"
STATE = ROOT / "youtube" / "playlist.json"
TOKEN = Path.home() / ".youtube_auth" / "token_personal.diesel-yt-up.json"
CHANNEL_ID = "UCPXF_pIyPI4652zPGlr6ieg"
CHANNEL_TITLE = "Kai A"
PLAYLIST_TITLE = "石門智繪客｜創造力資優 AI 素養資訊科技課程"


def load(path: Path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def save(path: Path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def client():
    data = load(TOKEN)
    creds = Credentials(
        token=data["token"], refresh_token=data.get("refresh_token"),
        token_uri=data["token_uri"], client_id=data["client_id"],
        client_secret=data["client_secret"], scopes=data.get("scopes"),
    )
    if not creds.valid:
        creds.refresh(Request())
        data["token"] = creds.token
        if creds.expiry:
            data["expiry"] = creds.expiry.isoformat()
        save(TOKEN, data)
    return build("youtube", "v3", credentials=creds, cache_discovery=False)


def verify_channel(youtube):
    items = youtube.channels().list(part="id,snippet", mine=True).execute().get("items", [])
    if len(items) != 1 or items[0]["id"] != CHANNEL_ID or items[0]["snippet"]["title"] != CHANNEL_TITLE:
        raise RuntimeError("Authenticated YouTube channel is not the verified Kai A channel")
    print(f"[CHANNEL] {CHANNEL_TITLE} ({CHANNEL_ID})")


def find_playlist(youtube):
    token = None
    while True:
        response = youtube.playlists().list(part="id,snippet,status", mine=True, maxResults=50, pageToken=token).execute()
        for item in response.get("items", []):
            if item["snippet"]["title"] == PLAYLIST_TITLE:
                return item["id"]
        token = response.get("nextPageToken")
        if not token:
            return None


def playlist_items(youtube, playlist_id):
    items = []
    token = None
    while True:
        response = None
        for attempt in range(8):
            try:
                response = youtube.playlistItems().list(part="id,snippet", playlistId=playlist_id, maxResults=50, pageToken=token).execute()
                break
            except HttpError as error:
                if error.resp.status != 404 or attempt == 7:
                    raise
                delay = 2 + attempt * 2
                print(f"[WAIT] playlist propagation {delay}s")
                time.sleep(delay)
        items.extend(response.get("items", []))
        token = response.get("nextPageToken")
        if not token:
            return items


def main():
    youtube = client()
    verify_channel(youtube)
    manifest = load(MANIFEST)
    playlist_id = find_playlist(youtube)
    description = (
        "桃園市龍潭區石門國民小學創造力資優資訊科技課程。\n"
        "包含年度總覽與 W03 至 W30 十個週次，搭配教學駕駛艙、NotebookLM、繁體中文 CC 與時間軸章節。\n"
        "https://cagoooo.github.io/it-cockpit/gifted-ai-lab/"
    )
    if not playlist_id:
        response = youtube.playlists().insert(
            part="snippet,status",
            body={"snippet": {"title": PLAYLIST_TITLE, "description": description, "defaultLanguage": "zh-Hant"}, "status": {"privacyStatus": "public"}},
        ).execute()
        playlist_id = response["id"]
        print(f"[CREATE] {playlist_id}")
    else:
        youtube.playlists().update(
            part="snippet,status",
            body={"id": playlist_id, "snippet": {"title": PLAYLIST_TITLE, "description": description, "defaultLanguage": "zh-Hant"}, "status": {"privacyStatus": "public"}},
        ).execute()
        print(f"[REUSE] {playlist_id}")

    existing = {item["snippet"]["resourceId"]["videoId"]: item for item in playlist_items(youtube, playlist_id)}
    for position, video in enumerate(manifest):
        video_id = video["video_id"]
        resource = {"kind": "youtube#video", "videoId": video_id}
        if video_id in existing:
            youtube.playlistItems().update(
                part="snippet",
                body={"id": existing[video_id]["id"], "snippet": {"playlistId": playlist_id, "position": position, "resourceId": resource}},
            ).execute()
            print(f"[ORDER] {position:02d} {video['slug']}")
        else:
            youtube.playlistItems().insert(
                part="snippet",
                body={"snippet": {"playlistId": playlist_id, "position": position, "resourceId": resource}},
            ).execute()
            print(f"[ADD] {position:02d} {video['slug']}")

    expected = [item["video_id"] for item in manifest]
    actual = []
    for attempt in range(8):
        final_items = playlist_items(youtube, playlist_id)
        ordered = sorted(final_items, key=lambda item: item["snippet"].get("position", 0))
        actual = [item["snippet"]["resourceId"]["videoId"] for item in ordered]
        if actual[:len(expected)] == expected:
            break
        delay = 2 + attempt * 2
        print(f"[WAIT] playlist order propagation {delay}s")
        time.sleep(delay)
    if actual[:len(expected)] != expected:
        print(f"[EXPECTED] {expected}")
        print(f"[ACTUAL] {actual}")
        raise RuntimeError("Playlist order verification failed")
    state = {
        "playlist_id": playlist_id,
        "playlist_url": f"https://www.youtube.com/playlist?list={playlist_id}",
        "title": PLAYLIST_TITLE,
        "privacy": "public",
        "video_count": len(expected),
        "ordered_video_ids": expected,
    }
    save(STATE, state)
    print(f"[VERIFY] public playlist with {len(expected)} videos")
    print(state["playlist_url"])


if __name__ == "__main__":
    main()

# -*- coding: utf-8 -*-
"""Publish the gifted AI course videos and captions to the verified Kai A channel."""

from __future__ import annotations

import argparse
import io
import json
import random
import sys
import time
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaFileUpload

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = ROOT / "youtube" / "manifest.json"
VERIFICATION_PATH = ROOT / "youtube" / "verification.json"
DEFAULT_TOKEN = Path.home() / ".youtube_auth" / "token_personal.diesel-yt-up.json"
EXPECTED_CHANNEL_ID = "UCPXF_pIyPI4652zPGlr6ieg"
EXPECTED_CHANNEL_TITLE = "Kai A"
RETRYABLE_STATUS_CODES = {500, 502, 503, 504}


def load_json(path: Path):
    with path.open(encoding="utf-8-sig") as handle:
        return json.load(handle)


def save_json(path: Path, value) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def youtube_client(token_path: Path):
    data = load_json(token_path)
    credentials = Credentials(
        token=data["token"],
        refresh_token=data.get("refresh_token"),
        token_uri=data["token_uri"],
        client_id=data["client_id"],
        client_secret=data["client_secret"],
        scopes=data.get("scopes"),
    )
    if not credentials.valid:
        credentials.refresh(Request())
        data["token"] = credentials.token
        if credentials.expiry:
            data["expiry"] = credentials.expiry.isoformat()
        save_json(token_path, data)
    return build("youtube", "v3", credentials=credentials, cache_discovery=False)


def execute_with_retry(request, label: str, attempts: int = 8):
    for retry in range(attempts):
        try:
            return request.execute()
        except HttpError as error:
            if error.resp.status not in RETRYABLE_STATUS_CODES or retry == attempts - 1:
                raise
            delay = min(60, (2**retry) + random.random())
            print(f"[RETRY] {label}: HTTP {error.resp.status}, {delay:.1f}s")
            time.sleep(delay)


def verify_channel(youtube) -> dict:
    response = execute_with_retry(
        youtube.channels().list(part="id,snippet", mine=True), "verify channel"
    )
    items = response.get("items", [])
    if len(items) != 1:
        raise RuntimeError(f"Expected one authenticated channel, got {len(items)}")
    channel = items[0]
    actual_id = channel["id"]
    actual_title = channel["snippet"]["title"]
    if actual_id != EXPECTED_CHANNEL_ID or actual_title != EXPECTED_CHANNEL_TITLE:
        raise RuntimeError(
            f"Channel mismatch: {actual_title} ({actual_id}); publishing is blocked"
        )
    print(f"[CHANNEL] {actual_title} ({actual_id})")
    return {"id": actual_id, "title": actual_title}


def upload_video(youtube, item: dict) -> str:
    video_path = ROOT / item["video"]
    if not video_path.exists():
        raise FileNotFoundError(video_path)
    body = {
        "snippet": {
            "title": item["title"],
            "description": item["description"],
            "tags": item.get("tags", []),
            "categoryId": "27",
            "defaultLanguage": "zh-Hant",
            "defaultAudioLanguage": "zh-Hant",
        },
        "status": {
            "privacyStatus": "public",
            "selfDeclaredMadeForKids": False,
            "containsSyntheticMedia": True,
        },
    }
    media = MediaFileUpload(
        str(video_path), mimetype="video/mp4", chunksize=8 * 1024 * 1024, resumable=True
    )
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
    response = None
    retry = 0
    while response is None:
        try:
            progress, response = request.next_chunk()
            if progress:
                print(f"  upload {item['slug']}: {int(progress.progress() * 100)}%")
        except HttpError as error:
            if error.resp.status not in RETRYABLE_STATUS_CODES or retry >= 7:
                raise
            delay = min(60, (2**retry) + random.random())
            retry += 1
            print(f"  retry {item['slug']}: HTTP {error.resp.status}, {delay:.1f}s")
            time.sleep(delay)
    return response["id"]


def upload_caption(youtube, item: dict) -> str:
    caption_path = ROOT / item["caption"]
    if not caption_path.exists():
        raise FileNotFoundError(caption_path)
    body = {
        "snippet": {
            "videoId": item["video_id"],
            "language": "zh-TW",
            "name": "繁體中文",
            "isDraft": False,
        }
    }
    media = MediaFileUpload(str(caption_path), mimetype="application/octet-stream")
    response = execute_with_retry(
        youtube.captions().insert(part="snippet", body=body, media_body=media),
        f"caption {item['slug']}",
    )
    return response["id"]


def get_video(youtube, video_id: str) -> dict:
    response = execute_with_retry(
        youtube.videos().list(part="snippet,status,processingDetails", id=video_id),
        f"verify video {video_id}",
    )
    if not response.get("items"):
        raise RuntimeError(f"Video not found after upload: {video_id}")
    return response["items"][0]


def publish(youtube, manifest: list[dict], selected: set[str] | None) -> None:
    for item in manifest:
        if selected and item["slug"] not in selected:
            continue
        if not item.get("video_id"):
            print(f"[UPLOAD] {item['slug']}: {item['title']}")
            item["video_id"] = upload_video(youtube, item)
            item["watch_url"] = f"https://www.youtube.com/watch?v={item['video_id']}"
            save_json(MANIFEST_PATH, manifest)
            print(f"[VIDEO] {item['watch_url']}")

            uploaded = get_video(youtube, item["video_id"])
            privacy = uploaded["status"]["privacyStatus"]
            if privacy != "public":
                raise RuntimeError(
                    f"{item['slug']} was not public after upload (privacy={privacy}); stopped"
                )
        else:
            print(f"[SKIP VIDEO] {item['slug']}: {item['video_id']}")

        if not item.get("caption_id"):
            print(f"[CAPTION] {item['slug']}")
            item["caption_id"] = upload_caption(youtube, item)
            save_json(MANIFEST_PATH, manifest)
            print(f"[CC] {item['caption_id']}")
        else:
            print(f"[SKIP CC] {item['slug']}: {item['caption_id']}")


def verify_all(youtube, manifest: list[dict]) -> list[dict]:
    checks = []
    for item in manifest:
        video = get_video(youtube, item["video_id"])
        snippet = video["snippet"]
        status = video["status"]
        captions = execute_with_retry(
            youtube.captions().list(part="id,snippet", videoId=item["video_id"]),
            f"list captions {item['slug']}",
        ).get("items", [])
        cc = next(
            (caption for caption in captions if caption["snippet"].get("language") == "zh-TW"),
            None,
        )
        check = {
            "slug": item["slug"],
            "video_id": item["video_id"],
            "watch_url": f"https://www.youtube.com/watch?v={item['video_id']}",
            "title_matches": snippet["title"] == item["title"],
            "privacy": status["privacyStatus"],
            "has_cockpit_link": "https://cagoooo.github.io/it-cockpit/gifted-ai-lab/" in snippet.get("description", ""),
            "has_chapters": "00:00" in snippet.get("description", ""),
            "caption_language": cc["snippet"].get("language") if cc else None,
            "caption_status": cc["snippet"].get("status") if cc else None,
        }
        checks.append(check)
        print(
            f"[VERIFY] {item['slug']}: public={check['privacy'] == 'public'} "
            f"links={check['has_cockpit_link']} chapters={check['has_chapters']} "
            f"cc={check['caption_language']} ({check['caption_status']})"
        )
    save_json(VERIFICATION_PATH, checks)
    failures = [
        check
        for check in checks
        if not (
            check["title_matches"]
            and check["privacy"] == "public"
            and check["has_cockpit_link"]
            and check["has_chapters"]
            and check["caption_language"] == "zh-TW"
        )
    ]
    if failures:
        raise RuntimeError(f"Verification failed for: {[item['slug'] for item in failures]}")
    return checks


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--token", type=Path, default=DEFAULT_TOKEN)
    parser.add_argument("--only", action="append", default=[])
    parser.add_argument("--verify-only", action="store_true")
    args = parser.parse_args()

    youtube = youtube_client(args.token)
    verify_channel(youtube)
    manifest = load_json(MANIFEST_PATH)
    if not args.verify_only:
        publish(youtube, manifest, set(args.only) if args.only else None)
    if all(item.get("video_id") for item in manifest):
        verify_all(youtube, manifest)
    else:
        print("[VERIFY] Deferred until every manifest item has a video_id")


if __name__ == "__main__":
    main()

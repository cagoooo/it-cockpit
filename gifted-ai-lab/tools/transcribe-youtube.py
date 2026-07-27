from __future__ import annotations

import argparse
import json
from datetime import timedelta
from pathlib import Path

import srt
from faster_whisper import WhisperModel
from opencc import OpenCC


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_ROOT = ROOT / "youtube"
VIDEOS = [
    ("annual", ROOT / "materials" / "notebooklm-course-video.mp4"),
    *[(f"week-{week}", ROOT / f"week-{week}" / "video.mp4")
      for week in ("03", "06", "09", "12", "15", "18", "21", "24", "27", "30")],
]
PROMPT = (
    "桃園市龍潭區石門國民小學，石門智繪客，黃凱揚老師，創造力資優，"
    "人工智慧，AI 素養，NotebookLM，Scratch，Canva，資料集，演算法，"
    "提示工程，原型設計，MVP，形成評量。"
)


def split_caption(text: str, start: float, end: float, max_chars: int = 22):
    if len(text) <= max_chars:
        return [(text, start, end)]

    pieces = []
    current = ""
    for char in text:
        current += char
        if len(current) >= max_chars and char in "，。！？；：,.!?;:":
            pieces.append(current.strip())
            current = ""
    if current.strip():
        pieces.append(current.strip())
    if len(pieces) == 1:
        pieces = [text[index:index + max_chars] for index in range(0, len(text), max_chars)]

    duration = max(0.2, end - start)
    total = sum(len(piece) for piece in pieces)
    cursor = start
    result = []
    for index, piece in enumerate(pieces):
        piece_end = end if index == len(pieces) - 1 else cursor + duration * len(piece) / total
        result.append((piece, cursor, piece_end))
        cursor = piece_end
    return result


def transcribe_video(model: WhisperModel, converter: OpenCC, slug: str, video: Path):
    output_dir = OUTPUT_ROOT / slug
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"[START] {slug}: {video}", flush=True)

    stream, info = model.transcribe(
        str(video),
        language="zh",
        beam_size=5,
        vad_filter=True,
        vad_parameters={"min_silence_duration_ms": 350},
        condition_on_previous_text=False,
        initial_prompt=PROMPT,
    )
    segments = []
    subtitles = []
    subtitle_index = 1
    for segment in stream:
        text = converter.convert(segment.text.strip())
        if not text:
            continue
        segments.append({"start": round(segment.start, 3), "end": round(segment.end, 3), "text": text})
        for caption, start, end in split_caption(text, segment.start, segment.end):
            subtitles.append(srt.Subtitle(
                index=subtitle_index,
                start=timedelta(seconds=start),
                end=timedelta(seconds=end),
                content=caption,
            ))
            subtitle_index += 1

    (output_dir / "transcript.json").write_text(
        json.dumps({"duration": info.duration, "segments": segments}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (output_dir / "transcript.txt").write_text(
        "\n".join(f"[{item['start']:07.2f}] {item['text']}" for item in segments) + "\n",
        encoding="utf-8",
    )
    (output_dir / "zh-TW.srt").write_text(srt.compose(subtitles), encoding="utf-8-sig")
    print(f"[DONE] {slug}: {len(segments)} segments, {len(subtitles)} captions", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", default="medium")
    parser.add_argument("--only", action="append", help="Only process a slug such as week-21")
    args = parser.parse_args()

    selected = [(slug, video) for slug, video in VIDEOS if not args.only or slug in args.only]
    model = WhisperModel(
        args.model,
        device="cpu",
        compute_type="int8",
        download_root=str(Path.home() / ".cache" / "whisper-models"),
    )
    converter = OpenCC("s2twp")
    for slug, video in selected:
        if not video.exists():
            raise FileNotFoundError(video)
        transcribe_video(model, converter, slug, video)


if __name__ == "__main__":
    main()

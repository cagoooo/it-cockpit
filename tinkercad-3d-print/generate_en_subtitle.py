# -*- coding: utf-8 -*-
"""
generate_en_subtitle.py — 中文語音 → 英文翻譯 SRT 字幕 (faster-whisper)
"""
import sys
import io
import os
from datetime import timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from faster_whisper import WhisperModel
except ImportError:
    print("[ERR] 缺少相依套件 faster-whisper", file=sys.stderr)
    sys.exit(1)

try:
    import srt
except ImportError:
    print("[ERR] 缺少相依套件 srt", file=sys.stderr)
    sys.exit(1)

def split_long_segment(seg_text, seg_start, seg_end, max_chars=40):
    # 英文以單字/長度切分，上限設 40 字元
    if len(seg_text) <= max_chars:
        return [(seg_text, seg_start, seg_end)]
    
    words = seg_text.split()
    pieces = []
    current = []
    
    for w in words:
        current.append(w)
        cur_str = " ".join(current)
        if len(cur_str) >= max_chars:
            pieces.append(cur_str)
            current = []
    if current:
        pieces.append(" ".join(current))
        
    if not pieces:
        return [(seg_text, seg_start, seg_end)]
        
    total_len = sum(len(p) for p in pieces)
    duration = seg_end - seg_start
    result = []
    cursor = seg_start
    for p in pieces:
        d = duration * (len(p) / total_len)
        result.append((p, cursor, cursor + d))
        cursor += d
    return result

def transcribe_en(input_path, output_path, model_size='base'):
    if not os.path.exists(input_path):
        print(f"[ERR] 找不到輸入檔：{input_path}", file=sys.stderr)
        sys.exit(1)

    print(f"[1/3] 載入 faster-whisper 模型：{model_size}...")
    model = WhisperModel(
        model_size,
        device='cpu',
        compute_type='int8',
        download_root=os.path.expanduser('~/.cache/whisper-models'),
    )

    print(f"[2/3] 翻譯轉錄 {input_path} 為英文...")
    segments, info = model.transcribe(
        input_path,
        task='translate',  # 翻譯為英文
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        word_timestamps=False,
        condition_on_previous_text=False,
        initial_prompt='This is an educational video about Tinkercad 3D printing in Chinese, translated to English.',
    )

    print(f"  影片時長：{info.duration:.1f} 秒")

    subs = []
    idx = 1
    for seg in segments:
        text = seg.text.strip()
        if not text:
            continue

        for piece, s, e in split_long_segment(text, seg.start, seg.end):
            subs.append(srt.Subtitle(
                index=idx,
                start=timedelta(seconds=s),
                end=timedelta(seconds=e),
                content=piece.strip(),
            ))
            idx += 1
            if idx % 10 == 0:
                print(f"  已處理 {idx} 段 / {s:.1f}s ...")

    print(f"[3/3] 寫入英文 SRT：{output_path}")
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(srt.compose(subs))

    print(f"[OK] 完成！共 {len(subs)} 段字幕，輸出 {output_path}")

if __name__ == '__main__':
    transcribe_en("assets/video_overview.mp4", "assets/en.srt", model_size='base')

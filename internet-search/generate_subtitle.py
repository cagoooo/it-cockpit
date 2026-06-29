# -*- coding: utf-8 -*-
"""
generate_subtitle.py — MP4/MP3 → SRT 字幕（faster-whisper + OpenCC 簡轉繁 + 英文翻譯支援）
"""
import argparse
import os
import sys
import io
from datetime import timedelta

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    from faster_whisper import WhisperModel
except ImportError:
    print("[ERR] 需要安裝 faster-whisper：pip install faster-whisper", file=sys.stderr)
    sys.exit(1)

try:
    import srt
except ImportError:
    print("[ERR] 需要安裝 srt：pip install srt", file=sys.stderr)
    sys.exit(1)

# OpenCC 簡轉繁
try:
    from opencc import OpenCC
    _cc = OpenCC('s2twp')
    def to_traditional(text):
        return _cc.convert(text)
except ImportError:
    print("[WARN] 沒有安裝 opencc-python-reimplemented，跳過簡轉繁", file=sys.stderr)
    def to_traditional(text):
        return text

def split_long_segment(seg_text, seg_start, seg_end, max_chars=25):
    """把過長字幕段切成多個短段（國小學生易讀）。"""
    if len(seg_text) <= max_chars:
        return [(seg_text, seg_start, seg_end)]

    pieces = []
    current = ""
    # 判斷是否為英文（以英文字母比例判斷）
    is_english = sum(1 for c in seg_text if c.isalpha()) / max(1, len(seg_text)) > 0.6
    
    if is_english:
        # 英文按單字切
        words = seg_text.split()
        current_words = []
        current_len = 0
        for w in words:
            current_words.append(w)
            current_len += len(w) + 1
            if current_len >= max_chars:
                pieces.append(" ".join(current_words))
                current_words = []
                current_len = 0
        if current_words:
            pieces.append(" ".join(current_words))
    else:
        # 中文按字數或標點切
        for ch in seg_text:
            current += ch
            if len(current) >= max_chars and ch in '，。！？、；：,.!?;:':
                pieces.append(current)
                current = ""
        if current:
            pieces.append(current)
        if len(pieces) == 1:
            pieces = [seg_text[i:i+max_chars] for i in range(0, len(seg_text), max_chars)]

    # 按比例分配時間
    total_chars = sum(len(p) for p in pieces)
    duration = seg_end - seg_start
    result = []
    cursor = seg_start
    for p in pieces:
        d = duration * (len(p) / total_chars)
        result.append((p, cursor, cursor + d))
        cursor += d
    return result

def transcribe(input_path, output_path, model_size='large-v3', do_convert=True, task='transcribe'):
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

    print(f"[2/3] 執行 Whisper 任務 ({task}) 處理 {input_path}...")
    
    # 準備 prompt
    initial_prompt = '以下是國小資訊科技教學影片的繁體中文旁白，介紹網際網路、瀏覽器與搜尋高手。'
    if task == 'translate':
        initial_prompt = 'Translate the following elementary school IT technology lesson video to English.'

    segments, info = model.transcribe(
        input_path,
        language='zh',
        task=task,
        beam_size=5,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        word_timestamps=False,
        condition_on_previous_text=False,
        initial_prompt=initial_prompt,
    )

    print(f"  偵測語音語言：{info.language}")
    print(f"  影片時長：{info.duration:.1f} 秒")

    subs = []
    idx = 1
    for seg in segments:
        text = seg.text.strip()
        if not text:
            continue
            
        # 只有在 transcribe 且要求簡轉繁時才轉換
        if task == 'transcribe' and do_convert:
            text = to_traditional(text)

        # 切過長段 (中文 25 字，英文 45 字)
        max_c = 45 if task == 'translate' else 25
        for piece, s, e in split_long_segment(text, seg.start, seg.end, max_chars=max_c):
            subs.append(srt.Subtitle(
                index=idx,
                start=timedelta(seconds=s),
                end=timedelta(seconds=e),
                content=piece.strip(),
            ))
            idx += 1
            if idx % 15 == 0:
                print(f"  已處理 {idx} 段 / {s:.1f}s ...")

    print(f"[3/3] 寫入 SRT：{output_path}")
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(srt.compose(subs))

    print(f"[OK] 完成！共 {len(subs)} 段字幕，輸出 {output_path}")
    return output_path

def main():
    parser = argparse.ArgumentParser(description='MP4 → SRT 字幕')
    parser.add_argument('input', help='輸入影片或音訊檔（mp4/mp3/wav/m4a）')
    parser.add_argument('output', help='輸出 SRT 檔路徑')
    parser.add_argument('--model', default='large-v3',
                        choices=['tiny', 'base', 'small', 'medium', 'large-v2', 'large-v3'],
                        help='Whisper 模型大小（預設 large-v3）')
    parser.add_argument('--task', default='transcribe', choices=['transcribe', 'translate'],
                        help='Whisper 任務 (transcribe/translate)')
    parser.add_argument('--no-convert', action='store_true',
                        help='不要簡轉繁')
    args = parser.parse_args()

    transcribe(args.input, args.output, model_size=args.model, 
               do_convert=not args.no_convert, task=args.task)

if __name__ == '__main__':
    main()

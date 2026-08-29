#!/usr/bin/env python3
"""Create smaller WebP assets and update local website image references.

Original JPG/PNG files remain in place as fallbacks. Social preview images,
favicons, Apple touch icons, GIFs, vendor files, and QA captures are left as-is.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from urllib.parse import unquote

try:
    from PIL import Image, ImageOps
except ImportError as exc:  # pragma: no cover - clear CLI error path
    raise SystemExit('Pillow is required: python -m pip install Pillow') from exc


ROOT = Path(__file__).resolve().parents[1]
TEXT_EXTENSIONS = {'.html', '.css', '.js', '.mjs'}
SOURCE_EXTENSIONS = {'.jpg', '.jpeg', '.png'}
EXCLUDED_DIRS = {'.git', 'node_modules', 'vendor'}
EXCLUDED_FILE_MARKERS = ('favicon', 'apple-touch-icon', 'og-image')
EXCLUDED_STEM_RE = re.compile(r'(?:^|[-_])og(?:$|[-_])', re.IGNORECASE)
IMAGE_REFERENCE_RE = re.compile(
    r'(?P<ref>(?:\.\.?/|/)?[^"\'\s<>()=;]+?\.(?:jpe?g|png)(?:[?#][^"\'\s<>()=;]*)?)',
    re.IGNORECASE,
)
IMG_TAG_RE = re.compile(r'<img\b(?P<attrs>[^>]*?)>', re.IGNORECASE | re.DOTALL)
SRC_ATTR_RE = re.compile(r'\bsrc\s*=\s*(["\'])(?P<value>[^"\']+)\1', re.IGNORECASE)
EXTENSION_RE = re.compile(r'\.(?:jpe?g|png)(?=\b|[?#"\'`\s),;])', re.IGNORECASE)
DYNAMIC_MARKERS = (
    'assets/', 'slide_', 'infographic', 'illustration', 'thumbnail',
    'cover', 'poster', 'image_', 'student-video',
)


def relative(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def write_text_preserving_newlines(path: Path, text: str) -> None:
    raw = path.read_bytes()
    newline = '\r\n' if b'\r\n' in raw else '\n'
    normalized = text.replace('\r\n', '\n').replace('\n', newline)
    path.write_bytes(normalized.encode('utf-8'))


def excluded_path(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    if any(part in EXCLUDED_DIRS or part.startswith('.qa-') for part in rel.parts):
        return True
    name = path.name.lower()
    if any(marker in name for marker in EXCLUDED_FILE_MARKERS):
        return True
    return bool(EXCLUDED_STEM_RE.search(path.stem))


def source_files() -> list[Path]:
    return [
        path for path in ROOT.rglob('*')
        if path.is_file()
        and path.suffix.lower() in SOURCE_EXTENSIONS
        and not excluded_path(path)
    ]


def normalize_image(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)
    if 'A' in image.getbands():
        return image.convert('RGBA')
    return image.convert('RGB')


def convert_image(source: Path, quality: int, force: bool) -> dict:
    target = source.with_suffix('.webp')
    source_bytes = source.stat().st_size

    if target.exists() and not force and target.stat().st_size < source_bytes:
        return {
            'source': relative(source),
            'webp': relative(target),
            'source_bytes': source_bytes,
            'webp_bytes': target.stat().st_size,
            'status': 'existing',
        }

    temporary = target.with_name(f'.{target.name}.tmp')
    try:
        with Image.open(source) as opened:
            image = normalize_image(opened)
            image.save(temporary, 'WEBP', quality=quality, method=6)
        webp_bytes = temporary.stat().st_size
        if webp_bytes >= source_bytes:
            temporary.unlink(missing_ok=True)
            target.unlink(missing_ok=True)
            return {
                'source': relative(source),
                'source_bytes': source_bytes,
                'webp_bytes': webp_bytes,
                'status': 'skipped_larger',
            }
        temporary.replace(target)
        return {
            'source': relative(source),
            'webp': relative(target),
            'source_bytes': source_bytes,
            'webp_bytes': webp_bytes,
            'status': 'created',
        }
    except Exception as exc:  # pragma: no cover - asset-specific error path
        temporary.unlink(missing_ok=True)
        return {
            'source': relative(source),
            'source_bytes': source_bytes,
            'status': 'error',
            'error': str(exc),
        }


def build_maps(results: list[dict]) -> tuple[dict[str, str], dict[str, set[str]]]:
    source_map: dict[str, str] = {}
    basename_map: dict[str, set[str]] = defaultdict(set)
    for result in results:
        if 'webp' not in result:
            continue
        source_key = result['source'].lower()
        target = result['webp']
        source_map[source_key] = target
        basename_map[Path(source_key).name].add(target)
    return source_map, basename_map


def reference_target(
    raw_reference: str,
    source_file: Path,
    source_map: dict[str, str],
    basename_map: dict[str, set[str]],
) -> str | None:
    if raw_reference.startswith(('http:', 'https:', '//', 'data:', 'mailto:', '#')):
        return None

    match = re.match(r'^(.*?)([?#].*)?$', raw_reference)
    if not match:
        return None
    image_path = unquote(match.group(1)).replace('\\', '/')
    suffix = match.group(2) or ''
    if not re.search(r'\.(?:jpe?g|png)$', image_path, re.IGNORECASE):
        return None

    candidate = (source_file.parent / image_path).resolve()
    try:
        candidate_key = relative(candidate).lower()
    except ValueError:
        candidate_key = ''
    target = source_map.get(candidate_key)
    if target:
        target_path = Path(target)
        new_reference = Path(
            __import__('os').path.relpath(target_path, start=source_file.parent.relative_to(ROOT))
        ).as_posix()
        if not new_reference.startswith(('.', '/')):
            new_reference = './' + new_reference
        if raw_reference.startswith('../') and new_reference.startswith('./'):
            new_reference = new_reference[2:]
        return new_reference + suffix

    if '/' not in image_path.lstrip('./'):
        targets = basename_map.get(Path(image_path).name.lower(), set())
        if targets:
            return re.sub(r'\.(?:jpe?g|png)$', '.webp', raw_reference, flags=re.IGNORECASE)

    suffix_matches = [
        mapped for source, mapped in source_map.items()
        if source.endswith('/' + image_path.lstrip('./').lower())
    ]
    if len(set(suffix_matches)) == 1:
        return re.sub(r'\.(?:jpe?g|png)$', '.webp', raw_reference, flags=re.IGNORECASE)
    return None


def rewrite_img_tag(
    match: re.Match,
    source_file: Path,
    source_map: dict[str, str],
    basename_map: dict[str, set[str]],
) -> tuple[str, bool]:
    original_attrs = match.group('attrs')
    src_match = SRC_ATTR_RE.search(original_attrs)
    if not src_match:
        return match.group(0), False

    original_src = src_match.group('value')
    optimized_src = reference_target(original_src, source_file, source_map, basename_map)
    attrs = original_attrs
    changed = False
    if optimized_src:
        attrs = (
            attrs[:src_match.start('value')]
            + optimized_src
            + attrs[src_match.end('value'):]
        )
        if not re.search(r'\bdata-fallback-src\s*=', attrs, re.IGNORECASE):
            fallback = html.escape(original_src, quote=True)
            attrs = f'{attrs[:src_match.start()]}data-fallback-src="{fallback}" {attrs[src_match.start():]}'
        changed = True

    if changed and not re.search(r'\bdecoding\s*=', attrs, re.IGNORECASE):
        attrs += ' decoding="async"'
    if changed and not re.search(r'\bloading\s*=', attrs, re.IGNORECASE):
        low = original_src.lower()
        priority = any(marker in low for marker in ('slide_01', 'week-illustration', 'cover', 'favicon'))
        attrs += f' loading="{"eager" if priority else "lazy"}"'

    if attrs == original_attrs:
        return match.group(0), False
    self_closing = attrs.rstrip().endswith('/')
    if self_closing:
        attrs = attrs.rstrip()[:-1].rstrip()
    return '<img' + attrs + (' /' if self_closing else '') + '>', True


def rewrite_dynamic_extensions(line: str) -> str:
    low = line.lower()
    if not any(marker in low for marker in DYNAMIC_MARKERS):
        return line

    def replace(match: re.Match) -> str:
        before = low[max(0, match.start() - 90):match.start()]
        if (
            'data-fallback-src' in before
            or any(marker in before for marker in EXCLUDED_FILE_MARKERS)
            or 'gifted-og' in before
        ):
            return match.group(0)
        return '.webp'

    return EXTENSION_RE.sub(replace, line)


def rewrite_file(path: Path, source_map: dict[str, str], basename_map: dict[str, set[str]]) -> bool:
    try:
        text = path.read_text(encoding='utf-8')
    except UnicodeDecodeError:
        return False
    original = text

    if path.suffix.lower() == '.html':
        changed_tags = 0

        def replace_tag(match: re.Match) -> str:
            nonlocal changed_tags
            replacement, changed = rewrite_img_tag(match, path, source_map, basename_map)
            changed_tags += int(changed)
            return replacement

        text = IMG_TAG_RE.sub(replace_tag, text)

    def replace_reference(match: re.Match) -> str:
        ref = match.group('ref')
        context = text[max(0, match.start() - 50):match.start()].lower()
        if 'data-fallback-src' in context:
            return ref
        if any(marker in ref.lower() for marker in EXCLUDED_FILE_MARKERS) or 'gifted-og' in ref.lower():
            return ref
        return reference_target(ref, path, source_map, basename_map) or ref

    text = IMAGE_REFERENCE_RE.sub(replace_reference, text)
    text = ''.join(rewrite_dynamic_extensions(line) for line in text.splitlines(keepends=True))

    changed = text != original
    if changed:
        write_text_preserving_newlines(path, text)
    return changed


def add_fallback_script(path: Path) -> bool:
    if path.suffix.lower() != '.html':
        return False
    text = path.read_text(encoding='utf-8')
    if 'webp-fallback.js' in text or '</head>' not in text.lower():
        return False
    fallback = Path('assets/webp-fallback.js')
    rel = __import__('os').path.relpath(fallback, start=path.relative_to(ROOT).parent).replace('\\', '/')
    tag = f'<script src="{rel}" defer></script>\n'
    text = re.sub(r'</head>', tag + '</head>', text, count=1, flags=re.IGNORECASE)
    write_text_preserving_newlines(path, text)
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--quality', type=int, default=88, choices=range(60, 96))
    parser.add_argument('--force', action='store_true', help='Regenerate existing WebP files.')
    parser.add_argument('--rewrite', action='store_true', help='Rewrite local website references to WebP.')
    parser.add_argument('--report', default='image-optimization-report.json')
    args = parser.parse_args()

    sources = source_files()
    results = [convert_image(source, args.quality, args.force) for source in sources]
    source_map, basename_map = build_maps(results)
    changed_files: list[str] = []
    if args.rewrite:
        text_files = [
            path for path in ROOT.rglob('*')
            if path.is_file()
            and path.suffix.lower() in TEXT_EXTENSIONS
            and not any(part in EXCLUDED_DIRS or part.startswith('.qa-') for part in path.relative_to(ROOT).parts)
        ]
        for path in text_files:
            changed = rewrite_file(path, source_map, basename_map)
            changed = add_fallback_script(path) or changed
            if changed:
                changed_files.append(relative(path))

    created = [result for result in results if result['status'] in {'created', 'existing'}]
    source_bytes = sum(result.get('source_bytes', 0) for result in created)
    webp_bytes = sum(result.get('webp_bytes', 0) for result in created)
    report = {
        'quality': args.quality,
        'source_count': len(sources),
        'webp_count': len(created),
        'original_bytes': source_bytes,
        'webp_bytes': webp_bytes,
        'saving_bytes': source_bytes - webp_bytes,
        'saving_percent': round((1 - webp_bytes / source_bytes) * 100, 2) if source_bytes else 0,
        'rewritten_files': len(changed_files),
        'rewritten_file_list': changed_files,
        'skipped_larger': [result['source'] for result in results if result['status'] == 'skipped_larger'],
        'errors': [result for result in results if result['status'] == 'error'],
    }
    (ROOT / args.report).write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    print(json.dumps({key: report[key] for key in ('quality', 'source_count', 'webp_count', 'original_bytes', 'webp_bytes', 'saving_bytes', 'saving_percent', 'rewritten_files', 'skipped_larger')}, ensure_ascii=False))
    if report['errors']:
        for error in report['errors']:
            print(f"ERROR {error['source']}: {error['error']}", file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

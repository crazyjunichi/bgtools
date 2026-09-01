#!/usr/bin/env python
"""从 BGG 抓桌游封面图。

三步链路：名字 --DDG--> BGG id --geekdo JSON--> 图片 URL --下载--> 方形 PNG。
BGG 官方 xmlapi2 自 2026 起要求注册应用 token（无 token 一律 401），
这里走站点内部 JSON 端点绕开 —— 它不是公开契约，字段随时可能变，
所以 metadata 解析处的 KeyError 就让它抛出来，别静默兜底成空图。

用法见 ../SKILL.md。
"""

from __future__ import annotations

import argparse
import difflib
import io
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

# Windows 控制台默认 cp936，中文提示和法语游戏名都会编码失败/乱码
for _s in (sys.stdout, sys.stderr):
    _s.reconfigure(encoding='utf-8', errors='replace')

UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
GEEKITEM = 'https://api.geekdo.com/api/geekitems?objectid={id}&objecttype=thing'
DDG = 'https://html.duckduckgo.com/html/?q={q}'
# BGG 明确要求限速；这三步都是别人的服务器，慢一点不会有人抱怨
DELAY = 0.6


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def search_ids(name: str, limit: int) -> list[tuple[int, str]]:
    """名字 → [(id, slug)]，按搜索引擎给的相关性保序去重。"""
    q = urllib.parse.quote(f'"{name}" site:boardgamegeek.com/boardgame')
    html = urllib.parse.unquote(get(DDG.format(q=q)).decode('utf-8', 'replace'))
    seen: dict[int, str] = {}
    for m in re.finditer(r'boardgamegeek\.com/boardgame/(\d+)/([a-z0-9-]+)', html):
        seen.setdefault(int(m.group(1)), m.group(2))
    return list(seen.items())[:limit]


def fetch_item(bgg_id: int) -> dict:
    raw = json.loads(get(GEEKITEM.format(id=bgg_id)))
    item = raw['item']
    return {
        'id': int(item['objectid']),
        'name': item['name'],
        'year': item.get('yearpublished') or '?',
        'href': 'https://boardgamegeek.com' + item['href'],
        'images': item['images'],
    }


def rank(items: list[dict], name: str) -> list[dict]:
    """精确同名优先：DDG 对 "Bomb Busters" 会把 5 个扩展一起排上来。"""
    key = name.strip().lower()
    return sorted(items, key=lambda i: -difflib.SequenceMatcher(None, key, i['name'].lower()).ratio())


def to_square(data: bytes, size: int, bg: str | None) -> bytes:
    from PIL import Image

    im = Image.open(io.BytesIO(data)).convert('RGBA')
    im.thumbnail((size, size), Image.LANCZOS)
    # 盒图不是方的，留白默认透明 —— 宫格卡片自带渐变底，糊一块不透明黑会出色差
    canvas = Image.new('RGBA', (size, size), bg or (0, 0, 0, 0))
    canvas.paste(im, ((size - im.width) // 2, (size - im.height) // 2), im)
    out = io.BytesIO()
    canvas.save(out, 'PNG', optimize=True)
    return out.getvalue()


def main() -> int:
    p = argparse.ArgumentParser(description='从 BGG 抓桌游封面')
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument('--name', help='桌游英文名（BGG 主名，中文搜不到）')
    src.add_argument('--id', type=int, help='BGG id，已知时首选')
    src.add_argument('--url', help='BGG 页面 URL，从里面取 id')
    p.add_argument('--tool', help='落盘用的 tool-id；给了它才写 --out，否则只暖场到 --stage-dir')
    p.add_argument('--variant', default='square200',
                   help='取哪张：square200(BGG 自家方裁,默认) / original / previewthumb / thumb')
    p.add_argument('--size', type=int, default=200, help='输出边长，默认 200')
    p.add_argument('--bg', help='留白底色（如 #0b0f17），默认透明')
    p.add_argument('--out', default='public/covers', help='落盘目录，默认 public/covers')
    p.add_argument('--stage-dir', default='.tmp-bgg', help='候选图暖场目录，默认 .tmp-bgg')
    p.add_argument('--stage', action='store_true', help='把所有 variant 下到暖场目录供人挑')
    p.add_argument('--limit', type=int, default=6, help='--name 时最多查几个候选')
    a = p.parse_args()

    if a.url:
        m = re.search(r'/boardgame/(\d+)', a.url)
        if not m:
            print(f'从 URL 里找不到 /boardgame/<id>：{a.url}', file=sys.stderr)
            return 2
        a.id = int(m.group(1))

    if a.id:
        items = [fetch_item(a.id)]
    else:
        pairs = search_ids(a.name, a.limit)
        if not pairs:
            print(f'搜不到「{a.name}」，换英文主名或直接给 --id', file=sys.stderr)
            return 1
        items = []
        for bgg_id, _slug in pairs:
            time.sleep(DELAY)
            items.append(fetch_item(bgg_id))
        items = rank(items, a.name)

    for n, i in enumerate(items):
        print(f'[{n}] {i["id"]:>7}  {i["name"]} ({i["year"]})  {i["href"]}')
        print(f'         {i["images"].get("previewthumb", "")}')

    if len(items) > 1:
        # 同名扩展/改版太多，挑错了比没抓到更糟 —— 交给人拍板
        print('\n多个候选：确认后用 --id <id> 重跑落盘', file=sys.stderr)
        return 0

    item = items[0]
    stage = Path(a.stage_dir)
    if a.stage:
        stage.mkdir(parents=True, exist_ok=True)
        for k, url in item['images'].items():
            time.sleep(DELAY)
            f = stage / f'{item["id"]}-{k}.png'
            f.write_bytes(get(url))
            print(f'暖场 {f}')
        print(f'\n挑完记得 rm -rf {a.stage_dir}')
        return 0

    if not a.tool:
        print('\n给 --tool <tool-id> 才落盘，或加 --stage 先看图', file=sys.stderr)
        return 0

    url = item['images'].get(a.variant)
    if not url:
        print(f'没有 variant「{a.variant}」，可选：{", ".join(item["images"])}', file=sys.stderr)
        return 2
    time.sleep(DELAY)
    png = to_square(get(url), a.size, a.bg)
    dest = Path(a.out) / f'{a.tool}.png'
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(png)
    print(f'\n写入 {dest}  ({len(png) // 1024}KB, {a.size}x{a.size}, 来源 {a.variant})')
    print(f'来源页 {item["href"]} —— 封面版权属出版商，署名见 SKILL.md')
    return 0


if __name__ == '__main__':
    sys.exit(main())

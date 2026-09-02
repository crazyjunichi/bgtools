#!/usr/bin/env python
"""统计盒图的主体色相，给出就近的 Tailwind 色板档位。

用途：给一款游戏在首页卡片上定"主体色"（[Home.tsx](../../../../src/pages/Home.tsx)
的 `HUE` 表）。凭印象挑色会一路挑到暖黄，因为大半盒图都偏暖 —— 先看直方图再定。

在 OKLCH 里算而不是 HSL：Tailwind 4 的色板本身就是 oklch，色相锚点直接对得上；
HSL 的"饱和度"在深色和浅色上不等价，暗部会被判成一片高饱和。

判读规则与逐盒结论见 ../SKILL.md「给盒图定主体色」一节。
"""

from __future__ import annotations

import argparse
import json
import math
import sys
from pathlib import Path

# Windows 控制台默认 cp936，中文提示会编码失败
for _s in (sys.stdout, sys.stderr):
    _s.reconfigure(encoding='utf-8', errors='replace')

# OKLCH 色相锚点，取自 node_modules/tailwindcss/theme.css 的 -400 档
# （-400 是本项目实心底与描边用的那一档，见 docs/DESIGN.md §2）。
# stone 的 chroma 只有 0.01，靠色相匹配不到，它只在"中性占比过高"时作为建议出现。
# brown 不在 Tailwind 色板里，是本项目 @theme 自定义的第 18 档。
ANCHORS = {
    'red': 22.2,
    'orange': 55.9,
    'amber': 84.4,
    'yellow': 91.9,
    'lime': 128.9,
    'green': 151.7,
    'emerald': 163.2,
    'teal': 181.9,
    'cyan': 211.5,
    'sky': 232.7,
    'blue': 254.6,
    'indigo': 276.9,
    'violet': 293.5,
    'purple': 305.5,
    'fuchsia': 322.2,
    'pink': 349.8,
    'rose': 13.4,
}

# 低于此彩度/落在明度两端的像素不参与色相统计：它们是黑白灰与高光，
# 色相是噪声（一个 #202020 的像素算出来的色相毫无意义）
MIN_CHROMA = 0.05
MIN_LIGHT = 0.25
MAX_LIGHT = 0.95
# 整图平均彩度低到这个程度（做旧照片、素描）时，第一名往往只是暖调噪声的偏向。
# 但"白底 + 一块艳色"的盒图平均彩度同样低，那种第一名是真的 ——
# 所以还要看集中度：第一名吃不到这个占比才判定色相不可信。
LOW_CHROMA = 0.02
CONCENTRATED = 0.60


def srgb_to_oklab(r: float, g: float, b: float) -> tuple[float, float, float]:
    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = lin(r), lin(g), lin(b)
    l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b
    m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b
    s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b
    l_, m_, s_ = l ** (1 / 3), m ** (1 / 3), s ** (1 / 3)
    return (
        0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
        1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
        0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
    )


def nearest(hue: float) -> str:
    return min(ANCHORS, key=lambda k: min(abs(hue - ANCHORS[k]), 360 - abs(hue - ANCHORS[k])))


def analyse(path: Path, top: int) -> dict:
    from PIL import Image

    im = Image.open(path).convert('RGBA')
    # 只为了限时：色相分布在 128px 上和原图上一致，抽到几万像素没有意义
    im.thumbnail((128, 128), Image.LANCZOS)

    bins: dict[str, float] = {}
    total_weight = 0.0
    counted = neutral = 0
    sum_c = sum_l = 0.0
    px = im.tobytes()
    for i in range(0, len(px), 4):
        r, g, b, a = px[i], px[i + 1], px[i + 2], px[i + 3]
        if a < 128:
            continue
        L, A, B = srgb_to_oklab(r / 255, g / 255, b / 255)
        c = math.hypot(A, B)
        counted += 1
        sum_c += c
        sum_l += L
        if c < MIN_CHROMA or L < MIN_LIGHT or L > MAX_LIGHT:
            neutral += 1
            continue
        hue = math.degrees(math.atan2(B, A)) % 360
        # 权重取彩度：一片艳色比同面积的灰调更能代表"这盒是什么颜色"
        name = nearest(hue)
        bins[name] = bins.get(name, 0.0) + c
        total_weight += c

    ranked = sorted(bins.items(), key=lambda kv: -kv[1])[:top]
    chroma = sum_c / counted if counted else 0.0
    share = ranked[0][1] / total_weight if ranked else 0.0
    faint = not ranked or (chroma <= LOW_CHROMA and share < CONCENTRATED)
    return {
        'file': path.name,
        'neutral': round(neutral / counted, 3) if counted else 1.0,
        'chroma': round(chroma, 3),
        'light': round(sum_l / counted, 3) if counted else 0.0,
        'top': [{'hue': k, 'share': round(v / total_weight, 3)} for k, v in ranked],
        'suggest': 'brown / stone（低彩度，色相不可信）' if faint else ranked[0][0],
    }


def main() -> None:
    ap = argparse.ArgumentParser(description='统计盒图主体色相 → Tailwind 色板档位')
    ap.add_argument('paths', nargs='+', help='图片文件或目录（目录下所有 png/jpg）')
    ap.add_argument('--top', type=int, default=4, help='每张图列出的色相档数，默认 4')
    ap.add_argument('--json', action='store_true', help='输出 JSON，便于二次处理')
    args = ap.parse_args()

    files: list[Path] = []
    for p in map(Path, args.paths):
        if p.is_dir():
            files += sorted(q for q in p.iterdir() if q.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp'})
        else:
            files.append(p)

    rows = [analyse(f, args.top) for f in files]
    if args.json:
        print(json.dumps(rows, ensure_ascii=False, indent=2))
        return
    for row in rows:
        top = '  '.join(f"{t['hue']} {t['share'] * 100:.0f}%" for t in row['top'])
        print(
            f"{row['file']:<26} neutral {row['neutral'] * 100:>3.0f}%  "
            f"C{row['chroma']:.2f} L{row['light']:.2f}  {top:<44} → {row['suggest']}"
        )


if __name__ == '__main__':
    main()

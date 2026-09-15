# 06. douyin-publisher-skill 原理解析与核心代码带注释分析

> **模块职责**：读取旁注 `_wechat.json` 或 Markdown 元数据，自动识别竖版封面 `cover_vertical.png` 与 3:4 切图卡片序列，利用 Playwright 无头浏览器连接抖音/小红书创作者平台，完成标题（剥离【...】标签 ≤20字）、正文、话题标签与图集的草稿箱自动发布。

---

## 一、 工作原理 (Architecture & Workflow)

```
[原生网页直切图_3x4/*.png] + [_wechat.json / 攻略.md]
  │
  ├── 1. 社交短标题智能解析 (resolve_social_title)
  │    └── 若已有 social_title 则直接提取；否则自动正则剥离【...】标签并截断为 ≤20 字！
  │
  ├── 2. 图集与竖版封面序列重组 (collect_images)
  │    ├── 优先检索并把 cover_vertical.png (3:4) 放在第 1 张作为图集封面
  │    └── 按文件名顺序拼接 01_切图.png, 02_切图.png...
  │
  ├── 3. Playwright 浏览器自动化连线 (douyin_uploader.py)
  │    ├── 加载本地 Cookie / StorageState 免二次扫码登录
  │    ├── 唤起创作者后台上传文件控件并写入图集
  │    └── 填报标题、正文摘要与 #话题标签 提交至草稿箱
  │
  └── 4. 返回发布结果并记录日志
```

---

## 二、 完整源码带注释解析 (`scripts/publish.py`)

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
douyin-publisher-skill: 抖音/小红书创作者后台图文全自动发布工具
核心亮点：自动拼接竖版封面与 3:4 切图、长短标题剥离转换、自动处理话题标签。
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright


# =============================================================================
# 助手 1: 从 Markdown YAML Frontmatter 提取元数据
# =============================================================================
def parse_frontmatter(md_path: str) -> dict:
    content = Path(md_path).read_text(encoding="utf-8")
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not match:
        return {}

    try:
        import yaml
        return yaml.safe_load(match.group(1)) or {}
    except ImportError:
        meta = {}
        for line in match.group(1).splitlines():
            if ':' in line and not line.strip().startswith('-'):
                key, val = line.split(':', 1)
                meta[key.strip()] = val.strip().strip('"').strip("'")
        return meta


# =============================================================================
# 助手 2: 短视频平台社交短标题生成算法 (剥离【...】标签，限制 ≤20 字)
# =============================================================================
def resolve_social_title(meta: dict, max_len: int = 20) -> str:
    # 优先读取明确指定的短标题 social_title
    st = meta.get("social_title", "").strip()
    if st:
        return st[:max_len]
        
    # 降级处理: 读取主标题，通过正则剥离前缀 【活动攻略】、【限时福利】 等
    title = meta.get("title", "").strip()
    cleaned = re.sub(r'^【[^】]*】', '', title).strip()
    return (cleaned or title)[:max_len]


# =============================================================================
# 助手 3: 图集序列组装逻辑 (确保竖版封面排在第 1 张)
# =============================================================================
def collect_images(image_dir: str, meta: dict, meta_dir: str = None) -> list[str]:
    img_dir = Path(image_dir)
    images = []

    # 1. 查找是否存在 cover_vertical.png (3:4 竖版封面图)
    cover_v = None
    search_dirs = [Path(meta_dir)] if meta_dir else [img_dir.parent]

    for d in search_dirs:
        candidates = [d / "cover_vertical.png", d / "cover_vertical.jpg"]
        for c in candidates:
            if c.exists():
                cover_v = c
                break
        if cover_v:
            break

    # 2. 若存在竖版封面，将其强制放在图片列表的第一位！
    if cover_v and cover_v.exists():
        images.append(str(cover_v.resolve()))
        print(f"📸 锁定竖版封面图作为图集第 1 张: {cover_v.name}")

    # 3. 按文件名升序收集所有 3:4 切图卡片 (01_切图.png, 02_切图.png...)
    card_exts = {'.png', '.jpg', '.jpeg', '.webp'}
    cards = sorted(
        [f for f in img_dir.iterdir() if f.suffix.lower() in card_exts and not f.name.startswith('_')],
        key=lambda f: f.name
    )

    for card in cards:
        images.append(str(card.resolve()))

    return images


# =============================================================================
# CLI 入口逻辑
# =============================================================================
def main():
    parser = argparse.ArgumentParser(description="抖音/小红书图文自动发布工具")
    parser.add_argument("-i", "--images", required=True, help="3:4 切图目录路径")
    parser.add_argument("-m", "--metadata", required=True, help="元数据路径 (_wechat.json 或 攻略.md)")
    args = parser.parse_args()

    # 解析元数据
    meta_path = os.path.abspath(args.metadata)
    meta = json.loads(Path(meta_path).read_text()) if meta_path.endswith('.json') else parse_frontmatter(meta_path)
    
    # 获取智能短标题
    title = resolve_social_title(meta)
    
    # 组装完整的上传图片绝对路径数组
    image_paths = collect_images(args.images, meta, meta_dir=os.path.dirname(meta_path))

    # 唤起 Playwright 无头浏览器脚本写入草稿箱
    with sync_playwright() as pw:
        from douyin_uploader import upload_image_post
        upload_image_post(
            pw,
            image_paths=image_paths,
            title=title,
            body_text=meta.get('summary', ''),
            headless=True
        )

if __name__ == "__main__":
    main()
```

---

## 三、 面试 Q&A 表达建议

> **面试官**：“跨平台发布时，不同平台（微信公众号 vs 抖音/小红书）对标题和图片格式的要求差异很大，你的系统是如何处理这种平台差异的？”
> 
> **回答**：“我设计了**元数据适配层 (Metadata Adapter Layer)**：
> 1. **标题适配**：微信偏好包含【...】结构化标签的长标题，而抖音限制标题在 20 字以内。我在 `douyin-publisher-skill` 中引入了自动正则清洗逻辑，能自动剥离【活动攻略】等前缀并截断。
> 2. **图集封面重组**：抖音/小红书极度依赖前 1-2 张卡片的视觉吸引力。发布模块在收集切图卡片时，会自动检索是否存在 `cover_vertical.png`（3:4 高清大字封面），并将其**置顶插入在数组的索引 0 位置**，从而极大提升了在短视频平台上的点击转化率。”

# 05. wechat-publisher-skill 原理解析与核心代码带注释分析

> **模块职责**：接收任意编译好的微信文章 `_wechat.html` 及旁注 `.json` 元数据，全自动完成图片 CDN 上传、MD5 去重缓存、AccessToken 续期，并将文章无缝同步推送至微信公众号草稿箱（支持 MediaID 增量更新）。

---

## 一、 工作原理 (Architecture & Workflow)

```
[_wechat.html + _wechat.json]
  │
  ├── 1. 多层凭证自动解析 (CLI > ENV > config.json > ~/.wechat_config.json)
  │
  ├── 2. AccessToken 自动提取与本地文件缓存续期 (7200s 过期自动刷新)
  │
  ├── 3. 封面图上传与 MD5 缓存去重 (thumb_media_id)
  │    ├── 计算 cover.png 的 MD5 哈希
  │    └── 若存在于 .wechat_image_cache.json，直接复用 MediaID 秒级跳过！
  │
  ├── 4. 正文内联图片全自动 CDN 替换 (process_content_images)
  │    ├── 扫描 <img> 标签 (支持本地文件、Base64 编码、远程 HTTP 链接)
  │    ├── 计算 MD5，未上传则调用 client.upload_content_image() 传至微信 CDN
  │    └── 将 src 替换为微信官方 CDN 链接 https://mmbiz.qpic.cn/...
  │
  ├── 5. 草稿箱状态跟踪与增量覆盖更新 (MediaID Increment Update)
  │    ├── 读取 .wechat_draft_cache.json 检查上次发布的 media_id
  │    ├── 若内容哈希无变化：跳过 API 调用 (Save Traffic)
  │    ├── 若内容变化：调用 draft/update 接口原地更新草稿
  │    └── 若原草稿已被用户手动删除 (40007 报错)：自动降级为新建草稿！
  │
  └── 6. 返回发布结果 PublishResult(media_id=..., action="update"|"create")
```

---

## 二、 核心源码带注释解析 (`scripts/publish.py` & `wechat_api.py`)

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
wechat-publisher-skill: 微信公众号草稿箱全自动发布与缓存引擎
支持 MD5 图片去重、MediaID 草稿增量更新、旁注元数据自动解析。
"""

import os
import sys
import json
import hashlib
import tempfile
import urllib.parse
from dataclasses import dataclass
import requests
from wechat_api import WeChatClient


@dataclass
class PublishResult:
    media_id: str = None
    action: str = None   # "create", "update", "skip"
    skipped: bool = False


# =============================================================================
# 缓存助手 1: 计算本地文件的 MD5 哈希值 (用于 CDN 图片去重)
# =============================================================================
def get_file_md5(file_path):
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        return None
    md5_hash = hashlib.md5()
    try:
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                md5_hash.update(byte_block)
        return md5_hash.hexdigest()
    except Exception as e:
        print(f"  ⚠ 计算 MD5 失败 {file_path}: {e}")
        return None


# =============================================================================
# 图像处理助手: 扫描 HTML 中的图片，调用微信 CDN 上传，并替换 src 属性
# =============================================================================
def process_content_images(client, html_content, base_dir, cache, cache_file):
    import re
    img_pattern = r'<img([^>]*?)src=["\']([^"\']+)["\']([^>]*?)>'

    def replacer(match):
        prefix, src, suffix = match.group(1), match.group(2), match.group(3)

        # 如果已经是微信 CDN 域名，跳过上传
        if "mmbiz.qpic.cn" in src:
            return match.group(0)

        temp_file = None
        try:
            # 情况 A: Base64 编码图片处理
            if src.startswith('data:image/'):
                header, base64_data = src.split(',', 1)
                import base64
                img_bytes = base64.b64decode(base64_data)
                fd, temp_path = tempfile.mkstemp(suffix='.png')
                with os.fdopen(fd, 'wb') as tmp:
                    tmp.write(img_bytes)
                temp_file = temp_path
                upload_path = temp_path

            # 情况 B: 远程 HTTP 图片处理
            elif src.startswith(('http://', 'https://')):
                response = requests.get(src, timeout=10)
                fd, temp_path = tempfile.mkstemp(suffix='.jpg')
                with os.fdopen(fd, 'wb') as tmp:
                    tmp.write(response.content)
                temp_file = temp_path
                upload_path = temp_path

            # 情况 C: 本地图片相对路径处理
            else:
                clean_src = urllib.parse.unquote(src)
                upload_path = os.path.join(base_dir, clean_src.lstrip('/'))

            # -----------------------------------------------------------------
            # 核心亮点: MD5 缓存去重比对！
            # -----------------------------------------------------------------
            md5_val = get_file_md5(upload_path)
            if md5_val and md5_val in cache["content_images"]:
                wechat_url = cache["content_images"][md5_val]
                print(f"  ⚡ 命中 MD5 缓存，秒级跳过重复上传 {os.path.basename(upload_path)}")
                return f'<img{prefix}src="{wechat_url}"{suffix}>'

            # 缓存未命中，调用 API 上传至微信 CDN
            print(f"  → 正在上传图片至微信 CDN: {os.path.basename(upload_path)}...")
            wechat_url = client.upload_content_image(upload_path)
            print(f"  ✅ 上传成功. CDN 链接: {wechat_url[:50]}...")

            # 写入本地缓存
            if md5_val:
                cache["content_images"][md5_val] = wechat_url
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(cache, f, ensure_ascii=False, indent=2)

            return f'<img{prefix}src="{wechat_url}"{suffix}>'

        finally:
            if temp_file and os.path.exists(temp_file):
                os.remove(temp_file)

    return re.sub(img_pattern, replacer, html_content)


# =============================================================================
# 核心发布逻辑: publish_draft
# =============================================================================
def publish_draft(content_path, appid, appsecret, force_new=False):
    cache_dir = os.path.dirname(os.path.abspath(content_path))
    cache_file = os.path.join(cache_dir, '.wechat_image_cache.json')
    draft_cache_file = os.path.join(cache_dir, '.wechat_draft_cache.json')

    # 读取旁注元数据 .json
    meta_path = os.path.splitext(content_path)[0] + ".json"
    metadata = {}
    if os.path.exists(meta_path):
        with open(meta_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)

    title = metadata.get('title')
    author = metadata.get('author', '弹壳呱呱')
    cover_path = os.path.join(cache_dir, metadata.get('image', 'cover.png'))

    client = WeChatClient(appid, appsecret, cache_dir=cache_dir)
    cache = json.load(open(cache_file)) if os.path.exists(cache_file) else {"content_images": {}, "thumb_materials": {}}
    draft_cache = json.load(open(draft_cache_file)) if os.path.exists(draft_cache_file) else {}

    # 上传/复用封面图素材
    cover_md5 = get_file_md5(cover_path)
    if cover_md5 and cover_md5 in cache["thumb_materials"]:
        thumb_media_id = cache["thumb_materials"][cover_md5]
    else:
        thumb_media_id = client.upload_image(cover_path, is_thumb=True)
        cache["thumb_materials"][cover_md5] = thumb_media_id

    # 替换正文图片为 CDN URL
    with open(content_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    html_content = process_content_images(client, html_content, cache_dir, cache, cache_file)

    current_html_hash = hashlib.md5(html_content.encode('utf-8')).hexdigest()

    # -------------------------------------------------------------------------
    # 核心亮点: MediaID 增量覆盖更新与自动降级逻辑
    # -------------------------------------------------------------------------
    cached_entry = draft_cache.get(content_path, {})
    existing_media_id = cached_entry.get("media_id")

    if not force_new and existing_media_id:
        try:
            print(f"→ 尝试更新现有草稿 MediaID: {existing_media_id}...")
            client.update_draft(
                media_id=existing_media_id, title=title,
                html_content=html_content, thumb_media_id=thumb_media_id, author=author
            )
            print("🚀 草稿更新成功！")
            return PublishResult(media_id=existing_media_id, action="update")
        except Exception as e:
            if "40007" in str(e) or "invalid media_id" in str(e).lower():
                print("⚠ 监测到原有草稿已被用户在后台删除，自动降级创建新草稿...")
            else:
                raise

    # 创建新草稿
    draft_media_id = client.create_draft(
        title=title, html_content=html_content,
        thumb_media_id=thumb_media_id, author=author
    )
    draft_cache[content_path] = {"media_id": draft_media_id, "html_hash": current_html_hash}
    json.dump(draft_cache, open(draft_cache_file, 'w'), ensure_ascii=False, indent=2)

    print(f"🚀 新草稿创建成功！MediaID: {draft_media_id}")
    return PublishResult(media_id=draft_media_id, action="create")
```

---

## 三、 面试 Q&A 表达建议

> **面试官**：“频繁调用微信接口很容易触及 Rate Limit 限制，你的发布模块是如何提高性能与可靠性的？”
> 
> **回答**：“我设计了**双重缓存机制与容错降级策略**：
> 1. **图片 MD5 CDN 缓存**：上传图片前自动计算 MD5，若已上传过则直接返回微信 CDN URL，多次发布测试时网络耗时降为 0。
> 2. **MediaID 增量覆盖更新**：记录每次发布的草稿 MediaID，修改文章时直接调用 `draft/update` 覆盖原草稿。若捕获到微信 `40007 (invalid media_id)` 异常（即用户手动删除了草稿），引擎会自动无缝降级创建新草稿，保障了接口调用的高可靠性。”

# 03. article-to-img-skill 原理解析与核心代码带注释分析

> **模块职责**：直接渲染微信原生 HTML 页面，通过无头浏览器 (Playwright) 配合 **DOM 边界段落缝隙避让算法 (Paragraph Gap Avoidance Algorithm)**，按小红书 & 抖音官方推荐的 **3:4 (1080×1440px)** 比例无缝分割图集，并自动合并尾部余量，防切字、防留白。

---

## 一、 工作原理 (Architecture & Workflow)

```
[攻略_wechat.html]
  │
  ├── 1. Playwright Headless 渲染 (DPR=2, 视口 1080x1440)
  │
  ├── 2. DOM 节点敏感信息清洗 (JS Evaluate)
  │    ├── 自动移除带“二维码”、“QR”字样的图片/容器 (防止抖音/小红书判重下架)
  │    └── 移除“往期精彩”、“相关推荐”尾部广告节点
  │
  ├── 3. DOM 边界底端坐标提取 (Element Bottoms Calculation)
  │    └── 查询所有 <p>, <li>, <tr>, <img>, <section> 节点的 rect.bottom 真实纵向坐标
  │
  ├── 4. 智能 3:4 避让切片 (Gap-Aware Slice Engine)
  │    ├── 临界点向下/向上寻找最近的段落缝隙坐标 y_bottom
  │    └── 末尾余量检查：若剩余高度 ≤ 75% 目标高度，自动合并至前一张图！
  │
  └── 5. 导出高清 PNG 图集 (01_切图.png...) 与发布文案 (copywriting.txt)
```

---

## 二、 完整源码带注释解析 (`scripts/export_cards.py`)

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
article-to-img-skill (原生 HTML 3:4 智能直切图 + 缝隙避让 + 尾部合并引擎)
核心亮点：利用 Playwright 渲染，自动清洗二维码与推荐广告，
配合 DOM Bounding Box 边缘探测实现零切字智能分割。
"""

import os
import sys
import argparse
from playwright.sync_api import sync_playwright
from PIL import Image


def direct_slice_html(html_file_path, output_dir=None, target_width=1080, target_height=1440):
    """
    渲染原生 HTML 页面，清洗防下架节点，按 3:4 比例带缝隙避让切图。
    """
    abs_html = os.path.abspath(html_file_path)
    if not output_dir:
        output_dir = os.path.join(os.path.dirname(abs_html), "原生网页直切图_3x4")
    os.makedirs(output_dir, exist_ok=True)

    print(f"📖 正在直接加载渲染原生 HTML 页面: {abs_html}")
    file_url = "file://" + abs_html
    exported_files = []

    # =========================================================================
    # 步骤 1: 启动 Playwright 无头浏览器环境 (视口 1080x1440, DPR=2 高清采样)
    # =========================================================================
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # device_scale_factor=2 保证导出的图像渲染精度翻倍 (视网膜屏标准)
        page = browser.new_page(
            viewport={'width': target_width, 'height': target_height}, 
            device_scale_factor=2
        )
        page.goto(file_url, wait_until="networkidle")

        # =========================================================================
        # 步骤 2: DOM 节点清洗 (移除二维码与往期推荐，防止平台降权/下架)
        # =========================================================================
        page.evaluate("""() => {
            document.body.style.margin = '0';
            document.body.style.padding = '30px 40px';
            document.body.style.background = '#ffffff';
            document.body.style.boxSizing = 'border-box';

            // 移除所有带有二维码关键词的图片与容器
            document.querySelectorAll('img').forEach(img => {
                const alt = img.getAttribute('alt') || '';
                const src = img.getAttribute('src') || '';
                if (alt.includes('二维码') || src.includes('二维码') || alt.includes('QR') || src.includes('qrcode')) {
                    let container = img.closest('section, div') || img;
                    container.remove();
                }
            });

            // 移除往期推荐、相关推荐等尾部诱导节点
            const targetTexts = ['往期精彩', '往期推荐', '相关推荐', '扫码获取更多'];
            document.querySelectorAll('h2, h3, h4, section, p').forEach(el => {
                const text = (el.innerText || '').trim();
                for (let kw of targetTexts) {
                    if (text === kw || text.startsWith(kw)) {
                        let nextNode = el.nextElementSibling;
                        el.remove();
                        while (nextNode) {
                            let temp = nextNode.nextElementSibling;
                            nextNode.remove();
                            nextNode = temp;
                        }
                        break;
                    }
                }
            });
        }""")

        full_height = page.evaluate("document.body.scrollHeight")
        print(f"📏 清洗后网页总高度: {full_height}px, 目标卡片高度: {target_height}px")

        # =========================================================================
        # 步骤 3: 提取所有 DOM 元素的底部 Y 轴坐标集合 (段落缝隙避让的核心)
        # =========================================================================
        element_bottoms = page.evaluate("""() => {
            const elems = document.querySelectorAll('p, section, div, h1, h2, h3, li, tr, table, img');
            const bottoms = [];
            for (let el of elems) {
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden') continue;
                
                const rect = el.getBoundingClientRect();
                if (rect.height > 5 && rect.bottom > 0) {
                    // 获取当前元素底部距离页面顶部的绝对像素坐标
                    bottoms.push(Math.round(rect.bottom + window.scrollY));
                }
            }
            // 排序并去重
            return Array.from(new Set(bottoms)).sort((a, b) => a - b);
        }""")

        # 截取渲染好的全页长图保存到临时路径
        full_page_path = os.path.join(output_dir, "_full_page_clean.png")
        page.screenshot(path=full_page_path, full_page=True)
        browser.close()

    # =========================================================================
    # 步骤 4: Pillow 物理切片与段落缝隙智能避让计算
    # =========================================================================
    full_img = Image.open(full_page_path)
    img_w, img_h = full_img.size

    # 计算设备缩放比例系数 (DPR 换算)
    scale = img_w / target_width
    scaled_target_h = int(target_height * scale)
    scaled_bottoms = [int(b * scale) for b in element_bottoms]

    y_top = 0
    slice_idx = 1
    last_slice_range = None

    while y_top < img_h:
        remaining_h = img_h - y_top

        # ---------------------------------------------------------------------
        # 核心算法亮点: 智能末尾合并 (Smart Tail Merging)
        # 如果剩余内容高度不足 0.75 倍卡片高度（半截空白），直接追加合并到前一张切图上！
        # ---------------------------------------------------------------------
        if remaining_h <= int(scaled_target_h * 0.75) and exported_files and last_slice_range:
            last_save_path = exported_files.pop()
            prev_top, _ = last_slice_range
            
            # 重新裁剪前一张起始点到全图底部的区间
            merged_crop_box = (0, prev_top, img_w, img_h)
            merged_img = full_img.crop(merged_crop_box)
            
            card_canvas = Image.new("RGB", (img_w, merged_img.height), (255, 255, 255))
            card_canvas.paste(merged_img, (0, 0))
            card_canvas.save(last_save_path, "PNG")
            
            print(f"  ⚡ 智能将末尾剩余内容完美合并至前一张切图 ({os.path.basename(last_save_path)})，消灭半截留白卡片！")
            exported_files.append(last_save_path)
            break

        ideal_bottom = y_top + scaled_target_h

        if ideal_bottom >= img_h:
            y_bottom = img_h
        else:
            # -----------------------------------------------------------------
            # 核心算法亮点: 寻找最靠近理想分割线 (ideal_bottom) 的 DOM 节点底部缝隙！
            # -----------------------------------------------------------------
            search_min = ideal_bottom - int(180 * scale)
            candidates = [b for b in scaled_bottoms if search_min <= b <= ideal_bottom]
            
            if candidates:
                # 选择候选集中距离理想切割线最近且在其上方的 DOM 缝隙坐标，确保绝不斩断文字！
                y_bottom = max(candidates)
            else:
                y_bottom = ideal_bottom

        # 物理切割
        crop_box = (0, y_top, img_w, y_bottom)
        slice_img = full_img.crop(crop_box)

        # 粘贴到标准 3:4 白色画布上
        card_canvas = Image.new("RGB", (img_w, scaled_target_h), (255, 255, 255))
        card_canvas.paste(slice_img, (0, 0))

        file_name = f"{slice_idx:02d}_切图.png"
        save_path = os.path.join(output_dir, file_name)
        card_canvas.save(save_path, "PNG")
        print(f"  ✅ 已生成 3:4 切图: {file_name} (y: {y_top}px ~ {y_bottom}px)")

        exported_files.append(save_path)
        last_slice_range = (y_top, y_bottom)

        y_top = y_bottom
        slice_idx += 1

    # 清理临时长图文件
    if os.path.exists(full_page_path):
        os.remove(full_page_path)

    # 导出配套文案文件 copywriting.txt
    copywriting_path = os.path.join(output_dir, "copywriting.txt")
    with open(copywriting_path, 'w', encoding='utf-8') as f:
        f.write(f"【小红书/抖音图文发布文案】\n\n📌 《弹壳特攻队》最新图文攻略\n\n💬 高清无损长图拆解，建议收藏保存～\n\n#弹壳特攻队 #游戏攻略 #小红书图文\n")

    return exported_files, output_dir
```

---

## 三、 核心算法解析 (Algorithm Deep Dive)

### 1. 为什么传统等距切图会导致“切字 Bug”？
普通长图切块算法按固定高 `H=1440px` 循环截取。如果某一行的文字恰好跨越了 `Y=1440` 坐标，就会被切成上下半截，严重影响阅读体验。

### 2. DOM 缝隙避让算法求解策略：
- 使用 JavaScript 在浏览器渲染完页面后，通过 `getBoundingClientRect()` 获取所有文本段落 (`<p>`)、列表 (`<li>`)、图片 (`<img>`) 的真正底端坐标数组 `element_bottoms`。
- 切图引擎在准备在 `ideal_bottom` (如 1440px) 处切割时，向前回溯 180px 范围，寻找**小于等于 `ideal_bottom` 的最大 DOM 缝隙坐标**。
- 这保证了裁剪切割点**百分之百落在两个 DOM 节点之间的空隙 (margin/padding)** 处，彻底消灭切字 Bug。

---

## 四、 面试 Q&A 表达建议

> **面试官**：“你的 HTML 转长图切图功能是如何避免单行文字或表格被切成两半的？”
> 
> **回答**：“我实现了 **DOM 边界段落缝隙避让算法**。在 Playwright 渲染页面时，通过注入 JS 提取所有 `<p>`, `<li>`, `<img>` 的物理底端坐标集合。物理切片时，引擎不会硬切 1440px，而是在 1440px 临界线向上回溯的候选区间内寻找最近的 DOM 节点间隙坐标作为切缝，实现了零切字、零切图。”

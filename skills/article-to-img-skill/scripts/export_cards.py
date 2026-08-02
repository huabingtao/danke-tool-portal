#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
article-to-img-skill (Direct Page Slicing Mode)
直接渲染微信 HTML 原生网页，按 3:4 (1080x1440) 比例带段落缝隙避让无缝切图
"""

import os
import sys
import argparse
from playwright.sync_api import sync_playwright
from PIL import Image


def direct_slice_html(html_file_path, output_dir=None, target_width=1080, target_height=1440):
    """
    直接渲染原生 HTML 页面，按 3:4 比例自动寻找缝隙切割为全套高清图片
    """
    abs_html = os.path.abspath(html_file_path)
    if not output_dir:
        output_dir = os.path.join(os.path.dirname(abs_html), "原生网页切图_3x4")
    os.makedirs(output_dir, exist_ok=True)

    print(f"📖 正在直接加载渲染原生 HTML 页面: {abs_html}")
    file_url = "file://" + abs_html

    exported_files = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 1080px 宽度，DPR=2 确保极高清晰度
        page = browser.new_page(viewport={'width': target_width, 'height': target_height}, device_scale_factor=2)
        
        # 设置页面样式，注入纯净切图背景与外边距重置
        page.goto(file_url, wait_until="networkidle")
        page.evaluate("""() => {
            document.body.style.margin = '0';
            document.body.style.padding = '30px 40px';
            document.body.style.background = '#ffffff';
            document.body.style.boxSizing = 'border-box';
        }""")

        # 获取网页滚动总高度与所有子块底边 y 坐标
        full_height = page.evaluate("document.body.scrollHeight")
        print(f"📏 原生网页总高度: {full_height}px, 目标卡片高度: {target_height}px")

        # 获取页面所有块级元素 (p, div, section, h1, h2, h3, li, tr) 的底部绝对 y 坐标
        element_bottoms = page.evaluate("""() => {
            const elems = document.querySelectorAll('p, section, div, h1, h2, h3, li, tr, table, img');
            const bottoms = [];
            for (let el of elems) {
                const rect = el.getBoundingClientRect();
                if (rect.height > 5 && rect.bottom > 0) {
                    bottoms.push(Math.round(rect.bottom + window.scrollY));
                }
            }
            return Array.from(new Set(bottoms)).sort((a, b) => a - b);
        }""")

        # 先截取一张完整的全长原图（超高清）
        full_page_path = os.path.join(output_dir, "_full_page.png")
        page.screenshot(path=full_page_path, full_page=True)
        browser.close()

    # 读取全长图片进行像素级精准 3:4 切割
    full_img = Image.open(full_page_path)
    img_w, img_h = full_img.size

    # 计算 DPR 转换比例
    scale = img_w / target_width
    scaled_target_h = int(target_height * scale)

    scaled_bottoms = [int(b * scale) for b in element_bottoms]

    y_top = 0
    slice_idx = 1

    while y_top < img_h:
        ideal_bottom = y_top + scaled_target_h

        if ideal_bottom >= img_h:
            y_bottom = img_h
        else:
            # 在 [ideal_bottom - 180*scale, ideal_bottom] 范围内寻找离 ideal_bottom 最近的段落缝隙
            search_min = ideal_bottom - int(180 * scale)
            candidates = [b for b in scaled_bottoms if search_min <= b <= ideal_bottom]
            
            if candidates:
                y_bottom = max(candidates)
            else:
                y_bottom = ideal_bottom

        # 切割此区间
        crop_box = (0, y_top, img_w, y_bottom)
        slice_img = full_img.crop(crop_box)

        # 调整至标准的 1080x1440 (3:4 比例)，居中或补齐白底
        card_canvas = Image.new("RGB", (img_w, scaled_target_h), (255, 255, 255))
        card_canvas.paste(slice_img, (0, 0))

        file_name = f"{slice_idx:02d}_切图.png"
        save_path = os.path.join(output_dir, file_name)
        card_canvas.save(save_path, "PNG")
        print(f"  ✅ 已生成 3:4 切图: {file_name} (y: {y_top}px ~ {y_bottom}px)")
        exported_files.append(save_path)

        y_top = y_bottom
        slice_idx += 1

    # 清理中间全长文件
    if os.path.exists(full_page_path):
        os.remove(full_page_path)

    # 导出文案
    copywriting_path = os.path.join(output_dir, "copywriting.txt")
    with open(copywriting_path, 'w', encoding='utf-8') as f:
        f.write(f"【小红书/抖音图文发布文案】\n\n")
        f.write(f"📌 《弹壳特攻队》最新图文攻略\n\n")
        f.write(f"💬 高清无损长图拆解，建议收藏保存～\n\n")
        f.write(f"关注公众号「弹壳呱呱」，获取最新活动计算器与防卷发车大厅！\n\n")
        f.write(f"#弹壳特攻队 #弹壳特攻队攻略 #游戏攻略 #小红书图文 #弹壳呱呱\n")

    print(f"\n🎉 原生网页 3:4 直切图制作完成！全套图片保存在:\n   {output_dir}\n")
    return exported_files, output_dir


def main():
    parser = argparse.ArgumentParser(description="微信原生 HTML 页面 3:4 直切图工具 (article-to-img-skill)")
    parser.add_argument("html_path", help="微信文章 _wechat.html 路径")
    parser.add_argument("-o", "--output", help="输出图片目录", default=None)

    args = parser.parse_args()
    direct_slice_html(args.html_path, args.output)


if __name__ == "__main__":
    main()

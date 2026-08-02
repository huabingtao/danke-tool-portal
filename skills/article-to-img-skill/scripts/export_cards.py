#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
article-to-img-skill
将微信公众号文章 / 本地编译 HTML 自动转换为小红书 & 抖音 3:4 (1080x1440) 高清图文卡片集
"""

import os
import sys
import re
import json
import argparse
import urllib.parse
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright


CARD_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700;900&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  width: 1080px;
  height: 1440px;
  overflow: hidden;
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  background: #0f172a;
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60px 50px;
  position: relative;
}

/* 装饰背景网格 */
body::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: 
    radial-gradient(circle at 15% 15%, rgba(56, 189, 248, 0.12) 0%, transparent 45%),
    radial-gradient(circle at 85% 85%, rgba(244, 63, 94, 0.1) 0%, transparent 45%),
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 100% 100%, 100% 100%, 40px 40px, 40px 40px;
  pointer-events: none;
  z-index: 0;
}

.card-container {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* 头部 Header */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 24px;
}

.badge {
  background: linear-gradient(135deg, #0284c7, #2563eb);
  color: #ffffff;
  font-size: 22px;
  font-weight: 900;
  padding: 8px 20px;
  border-radius: 30px;
  letter-spacing: 1px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
}

.page-indicator {
  font-size: 22px;
  font-weight: 700;
  color: #94a3b8;
  letter-spacing: 2px;
}

/* 核心内容区 */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 30px 0;
  gap: 24px;
}

/* 封面专用样式 */
.cover-title {
  font-size: 58px;
  font-weight: 900;
  line-height: 1.25;
  color: #ffffff;
  text-shadow: 0 4px 20px rgba(0,0,0,0.5);
  background: linear-gradient(135deg, #ffffff 30%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.cover-subtitle {
  font-size: 30px;
  font-weight: 700;
  color: #f59e0b;
  margin-top: 16px;
  line-height: 1.4;
}

.cover-hero-img {
  width: 100%;
  max-height: 720px;
  object-fit: cover;
  border-radius: 24px;
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}

/* 正文卡片样式 */
.section-title {
  font-size: 40px;
  font-weight: 900;
  color: #38bdf8;
  border-left: 8px solid #38bdf8;
  padding-left: 20px;
  margin-bottom: 12px;
  line-height: 1.3;
}

.content-box {
  background: rgba(30, 41, 59, 0.7);
  border: 1.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 32px;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.text-p {
  font-size: 28px;
  line-height: 1.65;
  color: #e2e8f0;
  margin-bottom: 16px;
}

.text-p:last-child {
  margin-bottom: 0;
}

.text-p img {
  vertical-align: middle;
  display: inline-block;
  height: 36px;
  margin: -4px 6px 0 6px;
}

.highlight {
  color: #fbbf24;
  font-weight: 700;
  background: rgba(251, 191, 36, 0.15);
  padding: 2px 8px;
  border-radius: 6px;
}

.list-item {
  font-size: 28px;
  line-height: 1.6;
  color: #cbd5e1;
  margin-bottom: 16px;
  padding-left: 28px;
  position: relative;
}

.list-item::before {
  content: "•";
  position: absolute;
  left: 8px;
  color: #38bdf8;
  font-size: 36px;
  top: -4px;
}

.list-item img {
  vertical-align: middle;
  display: inline-block;
  height: 34px;
  margin: -4px 6px 0 6px;
}

.body-img {
  width: 100%;
  max-height: 600px;
  object-fit: contain;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.1);
  margin: 16px 0;
  background: #020617;
}

/* 底部 Footer */
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
  padding-top: 20px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 14px;
}

.author-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #fff;
  font-size: 22px;
}

.author-name {
  font-size: 22px;
  font-weight: 700;
  color: #cbd5e1;
}

.tag-badge {
  font-size: 18px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 700;
}
"""

def parse_wechat_html(html_file_path):
    """解析微信 HTML，返回标题、图片与结构化卡片段落"""
    abs_html_path = os.path.abspath(html_file_path)
    html_dir = os.path.dirname(abs_html_path)

    with open(abs_html_path, 'r', encoding='utf-8') as f:
        soup = BeautifulSoup(f.read(), 'html.parser')

    # 提取标题
    title = ""
    title_tag = soup.find('title') or soup.find('h1')
    if title_tag:
        title = title_tag.get_text(strip=True)
    if not title:
        title = os.path.basename(html_dir)

    # 处理所有 <img> 标签的绝对路径
    for img in soup.find_all('img'):
        src = img.get('src', '')
        if src and not src.startswith(('http://', 'https://', 'data:')):
            if not os.path.isabs(src):
                abs_src = os.path.abspath(os.path.join(html_dir, src))
                img['src'] = 'file://' + abs_src

    # 分组解析段落与小标题
    sections = []
    current_section = {"title": "核心要点", "items": [], "images": []}

    # 查找主要内容块
    content_root = soup.find('body') or soup

    for elem in content_root.find_all(['h2', 'h3', 'p', 'ul', 'ol', 'table', 'img']):
        # 跳过顶部大图、二维码等全局元节点
        elem_text = elem.get_text(strip=True)
        
        if elem.name in ['h2', 'h3']:
            if current_section["items"] or current_section["images"]:
                sections.append(current_section)
            current_section = {"title": elem_text, "items": [], "images": []}
        elif elem.name == 'p':
            img_in_p = elem.find('img')
            if img_in_p and not elem_text:
                current_section["images"].append(img_in_p.get('src', ''))
            elif elem_text:
                current_section["items"].append({"type": "p", "html": str(elem)})
        elif elem.name in ['ul', 'ol']:
            for li in elem.find_all('li'):
                li_text = li.get_text(strip=True)
                if li_text:
                    current_section["items"].append({"type": "li", "html": str(li)})
        elif elem.name == 'img' and not elem.find_parent('p'):
            current_section["images"].append(elem.get('src', ''))

    if current_section["items"] or current_section["images"]:
        sections.append(current_section)

    return title, sections, soup


def generate_card_html(card_type, title, page_num, total_pages, data=None):
    """根据类型构建单张 1080x1440 页面 HTML"""
    if card_type == "cover":
        hero_img_html = ""
        if data and data.get("cover_image"):
            hero_img_html = f'<img class="cover-hero-img" src="{data["cover_image"]}" />'
        
        content_html = f"""
        <div style="display:flex; flex-direction:column; gap:24px; margin-top:40px;">
          <div class="cover-title">{title}</div>
          <div class="cover-subtitle">✨ 弹壳特攻队最新高胜率攻略 | 建议收藏</div>
          {hero_img_html}
        </div>
        """
    elif card_type == "ending":
        content_html = """
        <div style="display:flex; flex-direction:column; align-items:center; justify-center:center; gap:36px; text-align:center; height:100%;">
          <div style="font-size:48px; font-weight:900; color:#38bdf8;">感谢阅读！</div>
          <div style="font-size:30px; color:#cbd5e1; line-height:1.6;">
            更多《弹壳特攻队》最新活动、发车大厅、卖菜看板<br/>
            请搜索/关注公众号：<span style="color:#fbbf24; font-weight:900;">「弹壳呱呱」</span>
          </div>
          <div style="background:rgba(255,255,255,0.05); padding:24px; border-radius:24px; border:1px dashed rgba(255,255,255,0.2);">
            <div style="font-size:24px; color:#94a3b8; margin-top:12px;">🌟 赞 · 🌟 收藏 · 🌟 关注</div>
          </div>
        </div>
        """
    else:
        # 正文卡片
        sec_title = data.get("title", "攻略要点")
        items_html = ""
        for item in data.get("items", []):
            inner_html = item.get("html", "")
            # 清理原始 inline style 干扰，保留基本节点
            inner_soup = BeautifulSoup(inner_html, 'html.parser')
            for tag in inner_soup.find_all(True):
                if tag.name not in ['img']:
                    tag.attrs = {}
            clean_html = str(inner_soup)
            
            if item["type"] == "p":
                items_html += f'<div class="text-p">{clean_html}</div>'
            elif item["type"] == "li":
                items_html += f'<div class="list-item">{clean_html}</div>'
        
        imgs_html = ""
        for img_url in data.get("images", [])[:2]:
            imgs_html += f'<img class="body-img" src="{img_url}" />'

        content_html = f"""
        <div class="section-title">{sec_title}</div>
        <div class="content-box">
          {items_html}
          {imgs_html}
        </div>
        """

    full_html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>{CARD_CSS}</style>
</head>
<body>
  <div class="card-container">
    <div class="card-header">
      <div class="badge">弹壳呱呱 攻略</div>
      <div class="page-indicator">{page_num} / {total_pages}</div>
    </div>
    
    <div class="card-content">
      {content_html}
    </div>

    <div class="card-footer">
      <div class="author-info">
        <div class="author-avatar">呱</div>
        <div class="author-name">弹壳呱呱</div>
      </div>
      <div class="tag-badge">#弹壳特攻队 #游戏攻略</div>
    </div>
  </div>
</body>
</html>
"""
    return full_html


def export_article_to_cards(html_file_path, output_dir=None):
    """将 HTML 文章分割并导出为全套 1080x1440 高清图片集"""
    abs_html = os.path.abspath(html_file_path)
    if not output_dir:
        output_dir = os.path.join(os.path.dirname(abs_html), "output_cards")
    os.makedirs(output_dir, exist_ok=True)

    print(f"📖 正在解析文章: {abs_html}")
    title, sections, soup = parse_wechat_html(abs_html)

    # 找寻第一张主图作为封面图
    cover_image = ""
    first_img = soup.find('img')
    if first_img:
        cover_image = first_img.get('src', '')

    # 将 sections 组合分包（每 2-3 个要点一张卡片）
    card_datas = []
    chunk = {"title": "", "items": [], "images": []}
    
    for sec in sections:
        if not chunk["title"]:
            chunk["title"] = sec["title"]
        chunk["items"].extend(sec["items"])
        chunk["images"].extend(sec["images"])
        
        # 每积累 3-5 个段落/列表或 150 字打卡一张
        if len(chunk["items"]) >= 4 or len(chunk["images"]) >= 2:
            card_datas.append(chunk)
            chunk = {"title": "", "items": [], "images": []}
            
    if chunk["items"] or chunk["images"]:
        card_datas.append(chunk)

    total_pages = len(card_datas) + 2 # 包含封面与尾页

    # 生成各页面 HTML
    cards_html_list = []
    
    # 1. 封面
    cards_html_list.append(("01_封面.png", generate_card_html("cover", title, 1, total_pages, {"cover_image": cover_image})))

    # 2. 正文卡片
    for i, c_data in enumerate(card_datas):
        cards_html_list.append((f"{i+2:02d}_正文卡_{i+1}.png", generate_card_html("content", title, i + 2, total_pages, c_data)))

    # 3. 尾页
    cards_html_list.append((f"{total_pages:02d}_结尾关注.png", generate_card_html("ending", title, total_pages, total_pages)))

    # 启动 Playwright 静默渲染并截图
    print(f"🚀 启动无头浏览器渲染 {len(cards_html_list)} 张 1080x1440 高清卡片...")
    exported_files = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1080, 'height': 1440}, device_scale_factor=2)

        for filename, html_content in cards_html_list:
            save_path = os.path.join(output_dir, filename)
            page.set_content(html_content)
            page.wait_for_timeout(300) # 等待资源渲染
            page.screenshot(path=save_path)
            print(f"  ✅ 已生成卡片: {filename}")
            exported_files.append(save_path)

        browser.close()

    # 自动生成小红书/抖音发布文案
    copywriting_path = os.path.join(output_dir, "copywriting.txt")
    with open(copywriting_path, 'w', encoding='utf-8') as f:
        f.write(f"【小红书/抖音发布文案】\n\n")
        f.write(f"📌 标题：{title}\n\n")
        f.write(f"💬 正文：\n《弹壳特攻队》最新【{title}】干货攻略来啦！全图文卡片整理，建议收藏防丢失～\n\n")
        f.write(f"关注公众号「弹壳呱呱」，获取最新活动计算器、防卷发车大厅与高胜率攻略！\n\n")
        f.write(f"#弹壳特攻队 #弹壳特攻队攻略 #游戏攻略 #小红书图文 #弹壳呱呱\n")

    print(f"\n🎉 全套高清图文卡片制作完成！存放目录:\n   {output_dir}")
    print(f"📝 附带发布文案已保存至: {copywriting_path}\n")
    return exported_files, output_dir


def main():
    parser = argparse.ArgumentParser(description="微信文章转小红书/抖音 3:4 高清卡片集 (article-to-img-skill)")
    parser.add_argument("html_path", help="微信文章 _wechat.html 或 Markdown 文件路径")
    parser.add_argument("-o", "--output", help="输出图片目录", default=None)

    args = parser.parse_args()
    export_article_to_cards(args.html_path, args.output)


if __name__ == "__main__":
    main()

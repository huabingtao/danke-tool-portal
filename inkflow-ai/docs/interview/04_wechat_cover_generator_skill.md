# 04. wechat-cover-generator 原理解析与核心代码带注释分析

> **模块职责**：接收用户 9:16 原始手机游戏/应用截图，通过 **行像素方差 (Row Pixel Variance)** 算法自动识别图片视觉重心（角色/UI/奖励最丰富区域），智能裁剪并渲染带发光描边阴影的高颜值双行居中标题，生成标准微信横屏 2.35:1 (`cover.png`) 与小红书 3:4 竖屏封面 (`cover_vertical.png`)。

---

## 一、 工作原理 (Architecture & Workflow)

```
[9:16 原始截图] + [封面标题文本]
  │
  ├── 1. 自动分辨率与风格解析 (style="horizontal" | "vertical" | "square")
  │
  ├── 2. 基于行像素方差的视觉重心自动检测 (find_best_crop_y)
  │    ├── 将图片转化为灰度图，计算第 r 行像素的方差 Var(r)
  │    └── 滑动窗口算法：寻找指定高度区间内 sum(Var) 最大的窗口作为裁剪 Y 轴！
  │
  ├── 3. Aspect-Cover 比例适配与画布居中裁剪 (Center Crop)
  │
  ├── 4. Pillow 多层高品质标题渲染 (Multi-layer Text Rendering)
  │    ├── 底层: 12px 扩展黑色描边 + 12px 模糊阴影 (GaussianBlur)
  │    └── 顶层: 金黄 (#FFD700) 主字 + 6px 黑色边框
  │
  └── 5. 输出成品封面 cover.png
```

---

## 二、 完整源码带注释解析 (`scripts/make_cover.py`)

```python
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WeChat Article Cover Generator
基于行像素方差自动识别视觉重心，智能生成标准微信横屏 2.35:1、竖屏 3:4、方形 1:1 封面。
"""
import os
import sys
import argparse
from PIL import Image, ImageDraw, ImageFont, ImageFilter


def parse_args():
    parser = argparse.ArgumentParser(description="从手机竖屏截图自动检测重心并生成微信/小红书标准封面")
    parser.add_argument("-i", "--image", required=True, help="输入截图绝对路径")
    parser.add_argument("-t", "--text", required=True, help="封面绘制标题文本 (用 \\n 换行)")
    parser.add_argument("-o", "--output", help="输出封面路径 (默认 cover.png)")
    parser.add_argument("--color", default="#FFD700", help="标题文字 Hex 颜色 (默认金黄 #FFD700)")
    parser.add_argument("--font", help="自定义字体 TTF/TTC 路径")
    parser.add_argument("--style", choices=["horizontal", "vertical", "square"], default="horizontal", 
                        help="封面比例风格: horizontal (900x384), vertical (640x853), square (500x500)")
    parser.add_argument("--crop-y", help="手动指定裁剪 Y 轴范围 (如 '420-920')，若省略则触发方差自动检测")
    return parser.parse_args()


def find_best_crop_y(img, crop_h=500):
    """
    ===========================================================================
    核心算法亮点: 基于行像素方差 (Row Pixel Variance) 自动寻找画面视觉重心！
    背景: 游戏截图顶部通常是空白/血条，底部是虚拟摇杆，中间才是奖励/角色/UI核心区。
    原理: 计算每行像素的灰度方差。方差越大，说明该行色彩对比越强烈、UI细节越丰富！
    ===========================================================================
    """
    w, h = img.size
    img_l = img.convert('L') # 转化为灰度图
    pixels = list(img_l.getdata())
    
    # 步骤 1: 计算每一行像素的方差 Row Variance
    row_vars = []
    for r in range(h):
        row_pixels = pixels[r*w : (r+1)*w]
        if not row_pixels:
            row_vars.append(0)
            continue
        mean = sum(row_pixels) / len(row_pixels)
        var = sum((x - mean)**2 for x in row_pixels) / len(row_pixels)
        row_vars.append(var)
        
    # 步骤 2: 在除去顶部/底部边缘的滑动窗口中，寻找累计方差最大的最佳窗口 top
    best_top = 400
    max_var = -1
    search_start = min(300, h - crop_h)
    search_end = max(h - 300, search_start + 1)
    
    for top in range(search_start, search_end - crop_h, 10):
        # 窗口内平均方差
        window_var = sum(row_vars[top : top + crop_h]) / crop_h
        if window_var > max_var:
            max_var = window_var
            best_top = top
            
    return best_top, best_top + crop_h


def main():
    args = parse_args()
    input_path = os.path.abspath(args.image)
    if not os.path.exists(input_path):
        print(f"❌ 错误: 未找到输入图片 {input_path}")
        sys.exit(1)
        
    img = Image.open(input_path)
    w, h = img.size
    
    # 解析画布尺寸规范
    if args.style == 'horizontal':
        canvas_w, canvas_h = 900, 384
        default_crop_h = 500
    elif args.style == 'vertical':
        canvas_w, canvas_h = 640, 853  # 3:4 比例
        default_crop_h = 1560
    elif args.style == 'square':
        canvas_w, canvas_h = 500, 500  # 1:1 比例
        default_crop_h = 1170
        
    output_path = args.output or os.path.join(os.path.dirname(input_path), "cover.png")
    
    # 智能定位裁剪 Y 轴范围
    if args.crop_y:
        crop_start, crop_end = map(int, args.crop_y.split('-'))
    else:
        crop_start, crop_end = find_best_crop_y(img, default_crop_h)
        print(f"ℹ 方差算法自动检测最佳裁切范围 Y: {crop_start}px ~ {crop_end}px")
        
    # 裁剪原始区域
    raw_cropped = img.crop((0, crop_start, w, crop_end))
    
    # 按照 Aspect Cover 原则进行等比例无拉伸缩放
    rc_w, rc_h = raw_cropped.size
    scale = max(canvas_w / rc_w, canvas_h / rc_h)
    scaled_w = int(rc_w * scale)
    scaled_h = int(rc_h * scale)
    scaled_img = raw_cropped.resize((scaled_w, scaled_h), Image.Resampling.LANCZOS)
    
    # 居中截取到目标画布大小
    left_c = (scaled_w - canvas_w) // 2
    top_c = (scaled_h - canvas_h) // 2
    cover = scaled_img.crop((left_c, top_c, left_c + canvas_w, top_c + canvas_h))
    
    # 加载中文字体
    font_path = args.font or '/System/Library/Fonts/Hiragino Sans GB.ttc'
    font_size = 72 if args.style != 'square' else 60
    font = ImageFont.truetype(font_path, font_size) if os.path.exists(font_path) else ImageFont.load_default()
    
    text_content = args.text.replace('\\n', '\n')
    line_spacing = 15
    
    # 计算多行文本的总宽度与总高度以居中
    temp_draw = ImageDraw.Draw(Image.new('L', (1, 1)))
    bbox = temp_draw.multiline_textbbox((0, 0), text_content, font=font, align='center', spacing=line_spacing)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_x = (canvas_w - text_w) // 2
    text_y = (canvas_h - text_h) // 2 - 10
    
    # =========================================================================
    # 多层高级渲染: 1. 绘制软黑模糊发光阴影层 (Soft Dark Blur Shadow)
    # =========================================================================
    shadow_layer = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)
    shadow_draw.multiline_text(
        (text_x, text_y), text_content, font=font, fill=(0, 0, 0, 240),
        align='center', spacing=line_spacing, stroke_fill=(0, 0, 0, 240), stroke_width=12
    )
    # 对阴影层应用 12px 高斯模糊
    shadow_blurred = shadow_layer.filter(ImageFilter.GaussianBlur(radius=12))
    cover = Image.alpha_composite(cover.convert('RGBA'), shadow_blurred)
    
    # =========================================================================
    # 多层高级渲染: 2. 绘制金黄主字与 6px 锐利黑色描边 (Sharp Stroke)
    # =========================================================================
    final_draw = ImageDraw.Draw(cover)
    final_draw.multiline_text(
        (text_x, text_y), text_content, font=font, fill=(255, 215, 0, 255),
        align='center', spacing=line_spacing, stroke_fill=(0, 0, 0, 255), stroke_width=6
    )
    
    cover.save(output_path, 'PNG')
    print(f"✅ 封面自动渲染完成，成功保存至: {output_path}")

if __name__ == "__main__":
    main()
```

---

## 三、 面试 Q&A 表达建议

> **面试官**：“图片封面自动生成时，你是如何保证截取到的图片区域刚好是核心内容，且文字在复杂背景下依然清晰的？”
> 
> **回答**：“我设计了**基于行像素方差的视觉重心检测算法**。分析截图时，算法会自动计算每行像素的灰度方差，滑动寻找像素对比最强烈的区域（通常是游戏宝箱、角色或核心 UI）作为裁剪中心。在文字渲染上，我采用了 **Pillow 双层合成技术**：底层绘制 12px 拓展描边并施加高斯模糊作为发光底座，顶层叠加 6px 锐利黑色描边与金黄主字，确保标题在任何复杂的画面背景下都极具视觉冲击力。”

# 02. danke-strategy-skill 原理解析与核心代码带注释分析

> **模块职责**：接管 Markdown 文章从“文本美化”、“无序列表加粗剥离”、“专有名词与数值正则高亮”、“`img://` 协议解析”到“微信 HTML 编译（含内联 CSS 注入）”的 4 阶段全自动化编排工作流。

---

## 一、 工作原理 (Architecture & Workflow)

```
[攻略.md] 
  │
  ├── 阶段一 (Stage 1): 语法规范化与数值正则高亮
  │    ├── 专有名词高亮: 匹配专有名词自动加粗 **名称**
  │    ├── 微信 Bug 修复: 自动剥离无序列表项内部的加粗 (避免 <ul> 折行 Bug)
  │    └── 正则高亮引擎 (highlight.py): 加载 highlight_rules.json，注入带色彩的 font 标签
  │
  ├── 阶段二 (Stage 2): 智能配图与 inline 图标扩展
  │    ├── {{共鸣伤害}} → ![共鸣伤害](img://共鸣伤害){type=icon}
  │    └── img:// 协议映射: 加载 image_mapping.json，自动关联本地图片路径
  │
  ├── 阶段三 (Stage 3): 微信 HTML 内联编译 (compile.py & compiler.py)
  │    ├── Markdown → HTML 转换 (BeautifulSoup 规范 DOM)
  │    ├── 内联 CSS 样式注入: 将 theme.css 的 CSS 属性直接写到 DOM 元素的 style 属性中
  │    └── 外链转脚注: 微信屏蔽外链，自动将第三方 HTTP 链接转换为底部脚注 Footnote
  │
  └── 阶段四 (Stage 4): 输出 攻略_wechat.html 与旁注 攻略_wechat.json 元数据
```

---

## 二、 核心代码解析与带注释源码

### 1. 数值与专有名词正则高亮引擎 (`engine/highlight.py`)

```python
# -*- coding: utf-8 -*-
"""
微信公众号文章数值与专有名词语义高亮引擎
核心功能：根据外部 highlight_rules.json 配置文件，通过正则表达式扫描 Markdown 文本，
为伤害数值（红色）、防御生命（蓝色）、技能控制（绿色）自动注入带色彩的 html 标签。
"""

import json
import re
import os


def load_highlight_rules(rules_path):
    """
    加载指定路径下的正则高亮规则配置文件 (highlight_rules.json)
    """
    if not rules_path or not os.path.exists(rules_path):
        return {}

    try:
        with open(rules_path, 'r', encoding='utf-8') as f:
            rules = json.load(f)
        return rules
    except Exception as e:
        print(f"⚠ Warning: 无法加载高亮规则文件 {rules_path}: {e}")
        return {}


def apply_highlight_rules(md_content, rules):
    """
    将语义高亮规则应用到 Markdown 文本内容上。
    
    参数:
        md_content: 原始 Markdown 字符串
        rules: 由 load_highlight_rules 加载的配置字典，结构为：
               {
                 "colors": {"green": "#52C41A", "blue": "#1890FF", "red": "#FF4D4F"},
                 "red": [{"pattern": "(?<=伤害)(\\+(?:5|10|50)%)", "description": "伤害提升"}]
               }
    
    返回:
        注入了 HTML 颜色标签后的 Markdown 字符串
    """
    if not rules:
        return md_content

    colors = rules.get('colors', {})
    if not colors:
        return md_content

    # 遍历每一种颜色分组（如 red, blue, green）
    for color_name, hex_value in colors.items():
        patterns = rules.get(color_name, [])
        for rule in patterns:
            pattern = rule.get('pattern')
            if not pattern:
                continue
            try:
                compiled = re.compile(pattern)
                # 如果正则中包含捕获组 (group)，仅高亮捕获到的组（如数字部分）
                if compiled.groups > 0:
                    md_content = compiled.sub(
                        rf'<strong><font color="{hex_value}">\1</font></strong>',
                        md_content
                    )
                else:
                    # 全匹配高亮
                    md_content = compiled.sub(
                        rf'<strong><font color="{hex_value}">\g<0></font></strong>',
                        md_content
                    )
            except re.error as e:
                desc = rule.get('description', pattern)
                print(f"⚠ Warning: 高亮正则格式无效 '{desc}': {e}")

    return md_content
```

---

### 2. 微信 HTML 编译与内联 CSS 注入 (`engine/compiler.py` 核心切片)

```python
def inline_css_style(html_body_content, css_stylesheet):
    """
    微信公众号不支持外部 <style> 标签和 class 选择器，
    本函数利用 cssutils / BeautifulSoup 将 CSS 选择器规则（如 p { margin: 10px; color: #333; }）
    逐个元素内联写到 HTML 节点的 style="..." 属性中。
    """
    from bs4 import BeautifulSoup
    import cssutils
    
    soup = BeautifulSoup(html_body_content, 'html.parser')
    sheet = cssutils.parseString(css_stylesheet)
    
    for rule in sheet:
        if rule.type == rule.STYLE_RULE:
            # 查找匹配该 CSS 选择器的所有 HTML 节点
            for selector in rule.selectorText.split(','):
                try:
                    for element in soup.select(selector.strip()):
                        existing_style = element.get('style', '')
                        new_style = rule.style.cssText.replace('\n', ' ')
                        element['style'] = f"{existing_style}; {new_style}".strip('; ')
                except Exception:
                    continue
                    
    return str(soup)
```

---

## 三、 关键算法与重构细节

### 1. 微信无序列表折行 Bug 修复算法
- **背景**：微信公众号移动端渲染引擎对 `<ul>` 内联 `<strong>` 加粗存在严重兼容性问题，文字会被强制断开折行。
- **解决方案**：在 Stage 1 规范化阶段，通过正则扫描：
  ```python
  # 匹配无序列表行 `- **加粗文本** 说明`，剥离 ** 标记
  md_content = re.sub(r'^(\s*-\s*)\*\*(.*?)\*\*', r'\1\2', md_content, flags=re.MULTILINE)
  ```

### 2. 简写图标扩展引擎 `{{名称}}`
为了方便作者在文章中插入技能行内小图标，设计了简写扩展引擎：
```python
# 扩展前: 共鸣伤害{{共鸣伤害}}
# 扩展后: 共鸣伤害![共鸣伤害](img://共鸣伤害){type=icon}
md_content = re.sub(r'\{\{([^}]+)\}\}', r'![\1](img://\1){type=icon}', md_content)
```

---

## 四、 面试 Q&A 表达建议

> **面试官**：“微信公众号的渲染引擎有很多排版陷阱，你是如何解决 HTML 兼容性与样式美化问题的？”
> 
> **回答**：“微信公众号会强行剔除 `<style>` 标签与 Class 类名。我编写的 `compiler.py` 编译引擎采用了 **CSS Inline 属性内联算法**，解析 Sass/CSS 规则后自动将其计算写入每个 DOM 节点的 `style="..."` 属性中。此外，我还专门设计了无序列表加粗剥离器与外链转脚注等转换模块，保证了渲染的 100% 原汁原味。”

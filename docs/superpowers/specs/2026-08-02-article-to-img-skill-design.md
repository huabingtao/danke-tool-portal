# Design Spec: article-to-img-skill (v2.0)

## Overview
`article-to-img-skill` 是一款专为微信公众号文章打造的高清图文卡片生成技能。针对“本地 Markdown/HTML 图片地址错乱”以及“公众号内联样式错乱”两大痛点，本工具采用**纯内容提纯与路径重构引擎**，提取真实图片地址与文本内容，重新套用专为小红书/抖音定制的 **3:4 比例 (1080x1440) 极简大字卡片模板**。

---

## 核心痛点针对性解决方案

### 1. 图片地址错乱问题解决 (Image URL Resolution)
- **微信网络链接模式**：解析网页原生的真实 `data-src` / `src` CDN 链接 (`https://mmbiz.qpic.cn/...`)，防偷窥防失效。
- **本地 HTML 模式**：
  - 接入 `danke-strategy-skill` 的 `.wechat_image_cache.json` 缓存映射文件。
  - 自动将相对路径/错误路径补全为可访问的本地绝对路径 (`file:///Users/hbt/...`) 或缓存后的微信图床 URL。

### 2. 样式错乱问题解决 (Dedicated Xiaohongshu 3:4 Styling)
- **彻底剥离微信原始样式**：清洗并去除微信公众号文章中复杂、杂乱的内联 `style="..."` 属性（如小字号 `14px`、死板配色等）。
- **注入小红书独占 3:4 视觉系统**：
  - 卡片固定分辨率：`1080px × 1440px` (DPR=2 采样，超高清)
  - 大字号排版：主标题 `44px - 52px`、小标题 `36px`、正文 `28px - 32px`
  - 自适应布局：文字与插图按呼吸感分页，插图自动加圆角与微阴影，绝非简单网页截屏。

---

## 目录结构

```text
/Users/hbt/my-project/skills/article-to-img-skill/
├── SKILL.md                          # 技能触发指令与工作流规范
├── scripts/
│   ├── export_cards.py               # 核心解析、路径修复与卡片渲染脚本
│   ├── path_resolver.py              # 图片地址修复与缓存匹配器
│   └── templates/
│       ├── cover.html                # 3:4 爆款封面模板 (1080x1440)
│       ├── content.html              # 3:4 正文大字极简卡片模板 (1080x1440)
│       └── ending.html               # 3:4 引导关注尾页模板 (1080x1440)
└── resources/
    └── xhs_design_system.css         # 专为小红书/抖音定制的卡片样式表
```

---

## 数据处理流程

```mermaid
graph TD
    Input[微信公众号 URL / 本地 stage3_wechat.html] --> Parser[内容解析与样式剥离引擎]
    Parser --> PathResolver[图片地址修复器: 校验 CDN URL / 补全本地 file:// / 查 image_cache]
    PathResolver --> ContentExtractor[提取干净标题、正文段落、高清插图]
    ContentExtractor --> Splitter[智能分页器: 每卡片 150-250 字 + 自适应插图]
    
    subgraph 小红书 3:4 独占渲染引擎 (1080x1440)
        Splitter --> RenderCover[01_cover.png 爆款封面]
        Splitter --> RenderContent[02~0N_content.png 大字号正文卡]
        Splitter --> RenderEnding[0N+1_ending.png 尾页关注卡]
    end
    
    RenderCover & RenderContent & RenderEnding --> OutputDir[输出高清 PNG 目录 + copywriting.txt 文案]
```

---

## 验证与测试
1. **测试图片加载**：分别使用包含 `mmbiz.qpic.cn` 的网络链接与本地编译 `stage3_wechat.html` 进行测试，确保图片 100% 成功加载显示。
2. **测试样式排版**：验证输出卡片字号大于 28px，在手机上无需放大即可清晰阅读。

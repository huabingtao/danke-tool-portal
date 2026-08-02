# Design Spec: article-to-img-skill

## Overview
`article-to-img-skill` 是一款专为微信公众号文章/编译 HTML 打造的无缝转换工具技能。旨在彻底替代手动手机截图，自动将文章内容解析并渲染为适合小红书及抖音发布的 **3:4 比例 (1080x1440) 高清图文卡片集**，并同步提取爆款标题与小红书话题标签。

---

## Skill 元数据与触发表

- **技能名称**：`article-to-img-skill`
- **保存路径**：`/Users/hbt/my-project/skills/article-to-img-skill/`
- **触发关键词**：“微信文章转小红书”、“公众号生成切图”、“文章转图文”、“小红书卡片生成”、“article-to-img”

---

## 核心架构与目录结构

```text
/Users/hbt/my-project/skills/article-to-img-skill/
├── SKILL.md                          # 技能触发指令与标准工作流规范
├── scripts/
│   ├── export_cards.py               # 核心解析与无头浏览器卡片渲染脚本
│   └── templates/
│       ├── cover.html                # 3:4 爆款封面模板 (1080x1440)
│       ├── content.html              # 3:4 正文大字极简卡片模板 (1080x1440)
│       └── ending.html               # 3:4 引导关注尾页模板 (1080x1440)
└── resources/
    └── default_styles.css            # 卡片排版与高亮样式表
```

---

## 数据处理流与功能模块拆解

```mermaid
graph TD
    Input[输入源: 微信 URL 或 本地 stage3_wechat.html] --> Parser[网页/HTML 解析模块]
    Parser --> DataExtractor[提取标题、小标题、正文段落、重点金句与插图]
    DataExtractor --> CardSplitter[按篇幅与语义智能分页 (每张 150-250 字 + 插图)]
    
    subgraph 3:4 模板渲染引擎 (1080x1440)
        CardSplitter --> RenderCover[渲染 01_cover.png 封面卡]
        CardSplitter --> RenderContent[渲染 02~0N_content.png 正文卡]
        CardSplitter --> RenderEnding[渲染 0N+1_ending.png 尾页卡]
    end
    
    RenderCover & RenderContent & RenderEnding --> Exporter[导出高清 PNG 图片库 + copywriting.txt]
```

### 1. 内容解析模块 (`Parser`)
- **URL 输入**：自动调用 `Scrapling` / `requests` + `BeautifulSoup` 抓取 `mp.weixin.qq.com` 页面。
- **本地文件输入**：直接读取 `stage3_wechat.html` 或 `.md` 转换后的 HTML 节点。
- **提取字段**：
  - `title`: 文章大标题
  - `subtitle`: 摘要/引言
  - `sections`: 包含 `h2/h3` 标题、段落列表 `paragraphs`、重点高亮 `highlights` 及图片 `images`

### 2. 3:4 高清模板渲染引擎 (`Render Engine`)
- 卡片尺寸固定为小红书/抖音官方推荐比例：**1080px × 1440px**（高分辨率 DPR=2 采样，无任何模糊）。
- **封面卡 (`01_cover.png`)**：突出大标题 + 主图视觉 + 标签 Badge。
- **正文卡 (`02_content_1.png` ~ `0N_content_N.png`)**：
  - 大字号（24px - 32px），极高对比度（深色/浅色高档排版）。
  - 段落插图自动居中收纳，保持最佳视觉呼吸感。
- **尾页卡 (`0N+1_ending.png`)**：附带“关注/点赞/收藏”诱导视觉与公众号/账号说明。

### 3. 一键输出与配套文案 (`Exporter`)
- 导出结果存放在指定输出目录（如 `./output_cards_YYYYMMDD_HHMMSS/`）。
- **`copywriting.txt`**：一键生成小红书/抖音直接可用的标题、精简摘要与 `#弹壳特攻队` `#攻略分享` 热门话题标签。

---

## 验证与自我审查 (Spec Self-Review)

1. **占位符检查**：已确认包含完整的解析逻辑、HTML 模板方案、1080x1440 像素标准，无 TODO 或 TBD 占位符。
2. **一致性检查**：接口输入（URL / HTML）与输出文件命名规整一致。
3. **范围控制**：专注在微信/HTML 内容导出小红书/抖音图文卡片，职责单一隔离。

---

## 下一步计划
规格文档已提交，请 review 本规格文档，确认无误后将通过 `writing-plans` 技能编写具体实施计划。

---
name: article-to-img-skill
description: "将微信公众号文章、编译 HTML 或 Markdown 一键切分并导出为小红书及抖音 3:4 (1080x1440) 高清图文卡片集，并同步生成文案与热门话题标签。触发词：微信文章转小红书, 公众号生成切图, 文章转图文, xhs卡片生成, 分割文章, 切图"
---

# article-to-img-skill

`article-to-img-skill` 是一款专为微信公众号文章/HTML 打造的智能切图与卡片转化技能。彻底替代手动手机截图，自动将文章内容解析并渲染为适合小红书及抖音发布的 **3:4 比例 (1080x1440) 高清大字图文卡片集**，并同步提取爆款标题与小红书热门话题标签。

---

## 核心功能与亮点

1. **精准 3:4 画幅 (1080x1440)**：小红书/抖音官方最佳视觉比例，DPR=2 超高清采样，大字号、高对比度。
2. **解决图片路径与样式问题**：自动修复本地与 CDN 图片绝对路径，清洗微信杂乱内联样式，注入沉浸式极简夜间模式卡片设计。
3. **自动化生成全套卡片**：
   - `01_封面.png`: 爆款封面（大标题 + 主图视觉 + 标签 Badge）
   - `02_正文卡_1.png` ~ `0N_正文卡_N.png`: 3:4 大字极简正文卡（插图居中、文字大号对比度高）
   - `0N+1_结尾关注.png`: 引导点赞/关注尾页卡
4. **配套文案生成**：导出 `copywriting.txt`（包含推荐标题、精炼正文与 `#弹壳特攻队` `#游戏攻略` 热门话题标签）。

---

## 使用方法

在终端运行 Python 导出脚本：

```bash
python3 /Users/hbt/my-project/skills/article-to-img-skill/scripts/export_cards.py <HTML文件路径> [-o 输出目录]
```

### 示例：
```bash
python3 /Users/hbt/my-project/skills/article-to-img-skill/scripts/export_cards.py /Users/hbt/my-project/content/danke/my-articles-md/活动/彩笔奇妙屋活动攻略/彩笔奇妙屋活动攻略_wechat.html
```

---

## 目录与输出结构

```text
output_cards/
├── 01_封面.png             # 1080x1440 高清封面卡
├── 02_正文卡_1.png          # 1080x1440 正文要点卡 1
├── 03_正文卡_2.png          # 1080x1440 正文要点卡 2
├── 04_结尾关注.png          # 1080x1440 关注尾页卡
└── copywriting.txt         # 小红书/抖音直接复制使用的发布文案
```

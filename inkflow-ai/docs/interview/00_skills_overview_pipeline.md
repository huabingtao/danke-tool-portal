# 00. 多 Skill AI 自动化内容流水线全景图与契约总览

> **面试复盘核心指南**：本文档作为整体项目的架构总览，定义了从“原始素材/简单文案”到“公众号文章HTML”、“小红书3:4高清图文卡片”及“云端草稿箱同步”的 **Multi-Skill 多技能链式调用架构**。每个 Skill 的详细源码带注释解析已拆分保存到单独的文件中。

---

## 📌 Skill 核心清单与独立分析文件索引

| 序号 | Skill 名称 | 核心职责 | 关键算法 / 技术亮点 | 独立解析文档 |
| :--- | :--- | :--- | :--- | :--- |
| **01** | `danke-content-creator-skill` | 原始素材提炼与 Markdown 初稿生成 | YAML Frontmatter 双标题机制 (微信长标题 / 抖音短标题) | [01_danke_content_creator_skill.md](file:///Users/hbt/my-project/apps/inkflow-ai/docs/interview/01_danke_content_creator_skill.md) |
| **02** | `danke-strategy-skill` | 4 阶段文本排版与微信 HTML 编译 | 无序列表加粗剥离算法、正则数值高亮引擎、`img://` 虚拟协议扩展 | [02_danke_strategy_skill.md](file:///Users/hbt/my-project/apps/inkflow-ai/docs/interview/02_danke_strategy_skill.md) |
| **03** | `article-to-img-skill` | 微信 HTML 原生 3:4 智能直切图 | **DOM 边界段落缝隙防切字避让算法**、末尾余量智能合并 | [03_article_to_img_skill.md](file:///Users/hbt/my-project/apps/inkflow-ai/docs/interview/03_article_to_img_skill.md) |
| **04** | `wechat-cover-generator` | 智能封面生成与标题渲染 | **基于行像素方差的视觉重心自动裁切算法**、Pillow 描边模糊阴影 | [04_wechat_cover_generator_skill.md](file:///Users/hbt/my-project/apps/inkflow-ai/docs/interview/04_wechat_cover_generator_skill.md) |
| **05** | `wechat-publisher-skill` | 微信公众号草稿箱自动化推送 | AccessToken 自动续期、MD5 图片去重缓存、MediaID 增量覆盖更新 | [05_wechat_publisher_skill.md](file:///Users/hbt/my-project/apps/inkflow-ai/docs/interview/05_wechat_publisher_skill.md) |
| **06** | `douyin-publisher-skill` | 抖音/小红书创作者后台图文推送 | 3:4 图卡批量上传、元数据/话题标签自动化填报 | [06_douyin_publisher_skill.md](file:///Users/hbt/my-project/apps/inkflow-ai/docs/interview/06_douyin_publisher_skill.md) |

---

## 🔄 多 Skill 数据流协同契约 (Data Flow Contract)

```mermaid
sequenceDiagram
    autonumber
    actor User as 用户/前端系统
    participant S1 as danke-content-creator-skill
    participant S2 as danke-strategy-skill
    participant S4 as wechat-cover-generator
    participant S3 as article-to-img-skill
    participant S5 as wechat-publisher-skill
    participant S6 as douyin-publisher-skill

    User->>S1: 输入游戏截图/活动数据文本
    S1-->>S2: 交付 攻略.md (含 YAML Frontmatter)
    S2->>S2: 运行 4 阶段全自动编排 (数值高亮 + 微信 CSS 编译)
    S2-->>S4: 交付 攻略_wechat.html & raw_screenshot.png
    S4->>S4: 像素方差检测重心，渲染发光双行标题
    S4-->>S2: 交付 cover.png (2.35:1) & cover_vertical.png (3:4)
    
    par 微信公众号发布链路
        S2->>S5: 运行 python publish.py -c 攻略_wechat.html
        S5->>S5: MD5 检查去重 -> 上传 CDN -> 覆盖/新建草稿箱
        S5-->>User: 返回 WeChat Draft MediaID
    and 抖音/小红书图文发布链路
        S2->>S3: 运行 python export_cards.py 攻略_wechat.html
        S3->>S3: Playwright 渲染 DOM -> 缝隙避让切图 -> 输出 3:4 图卡
        S3-->>S6: 交付 原生网页切图_3x4/*.png & copywriting.txt
        S6->>S6: 自动同步创作者后台草稿箱
        S6-->>User: 返回 抖音/小红书草稿创建成功通知
    end
```

---

## 🎯 面试核心表达要点

1. **解耦与模块化**：为什么不把所有逻辑写在一个巨型 Python 脚本里？
   - *回答*：遵循**单一职责原则 (SRP)**，将文案创作、HTML 渲染排版、图像算法、API 接口分离，每个 Skill 均可独立升级或测试。
2. **容错与幂等性**：
   - *回答*：通过 MD5 哈希缓存去重、旁注 JSON (`.wechat_draft_cache.json`) 增量比对，保障全流程的幂等性与高鲁棒性。

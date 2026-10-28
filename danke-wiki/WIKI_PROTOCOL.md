# 大模型知识库维护协议 (LLM Wiki Protocol)

> 本协议定义了所有进入工作区的 AI Agent（Claude, Codex, Gemini, Antigravity）在读取、引用、更新和巡检 `danke-wiki` 时必须遵守的三层架构与三大标准动作。

---

## 一、 三层知识架构 (Three-Layer Architecture)

| 层级 | 路径 | 角色定位 | 读写权限 |
| :--- | :--- | :--- | :--- |
| **Layer 1: 原始素材层 (`raw`)** | `/Users/hbt/my-project/danke-creator/my-articles-md/`<br>`/Users/hbt/skills/skills/danke-strategy-skill/packs/danke/` | 135+ 篇历史攻略原稿、活动实测截图、`活动数据.json`、285+ 道具短宏映射 | AI 按任务创作新攻略；禁止随意篡改历史原稿的实测数据 |
| **Layer 2: 编译知识层 (`wiki`)** | `/Users/hbt/my-project/danke-wiki/index.md`<br>`/Users/hbt/my-project/danke-wiki/domains/*.md`<br>`/Users/hbt/my-project/danke-wiki/articles-index.md` | 由大模型提炼维护的高密度领域百科、核心消耗矩阵、毕业路线图、全量文章索引 | **由大模型全权负责编译、交叉引用与增量演进** |
| **Layer 3: 协议契约层 (`schema`)** | `/Users/hbt/my-project/danke-wiki/WIKI_PROTOCOL.md`<br>`/Users/hbt/my-project/danke-creator/AGENTS.md` | 规定大模型如何检索（Query）、如何摄取新知识（Ingest）、如何巡检（Lint） | 人类与大模型共同遵守的最高法则 |

---

## 二、 大模型三大标准操作 (Core Operations)

### 1. 检索与引用 (QUERY) — 创作与答疑前必做
当用户要求撰写新攻略、制作抖音图文卡片、回答游戏养成问题或核对道具名称时：
1. **第一跳**：先读取 `/Users/hbt/my-project/danke-wiki/index.md`（或调用 MCP 工具 `get_wiki_index`），定位问题所属的领域文件（`domains/*.md`）。
2. **第二跳**：按需读取对应的 `domains/<domain>.md`（或调用 `get_wiki_domain` / `search_danke_wiki`）。**严禁在不查 Wiki 的情况下凭大模型预训练记忆臆造《弹壳特攻队》的机制、星级效果或核心消耗数**。
3. **第三跳（按需溯源）**：若需要查看某篇历史活动的具体截图或完整正文，通过 `domains/*.md` 或 `articles-index.md` 中标注的 `Source:` 路径读取 `danke-creator/my-articles-md/` 下的原始文件。

### 2. 摄取与演进 (INGEST) — 新攻略/新版本发布后必做
每当在 `danke-creator/my-articles-md/` 下完成一篇新攻略（如新 SP/S 特工测评、新 SS 神炼开启、新版本更新爆料、新常驻玩法实测）后：
1. **提取增量知识**：判断该文章是否包含新的游戏机制、新的养成节点、新的特工/装备/收藏品/宠物词条或新的活动预算范式。
2. **更新领域文件**：将新结论以高密度表格或要点形式合并进对应的 `danke-wiki/domains/*.md`，使用 `[[领域文件名#章节]]` 建立交叉链接，并附上 `Source: my-articles-md/<相对路径>`。如果新版本推翻了旧结论（例如特工培养从 `840` 演进到 `伊狑844`），在原条目处更新最新结论并注明版本演进原因。
3. **重编索引与记录日志**：
   - 运行 `node /Users/hbt/my-project/danke-wiki/scripts/build-wiki.mjs` 自动更新 `articles-index.md` 与短宏速查表。
   - 在 `/Users/hbt/my-project/danke-wiki/log.md` 顶部追加一条 `[YYYY-MM-DD] INGEST | <文章标题或事件>` 记录，写明更新了哪些 `domains/*.md` 文件。

### 3. 健康巡检 (LINT) — 定期或修改后执行
运行 `node /Users/hbt/my-project/danke-wiki/scripts/lint-wiki.mjs`，自动完成以下检查：
- **未归档文章检测**：检查 `danke-creator/my-articles-md/` 中是否有新增的主攻略 `.md` 未被收录进 `articles-index.md`。
- **双链完整性检测**：检查 `danke-wiki/*.md` 与 `domains/*.md` 中的 `[[wikilinks]]` 是否指向真实存在的领域文件。
- **道具短宏合法性检测**：检查知识库中引用的 `{{short}}` 宏是否存在于 `image_mapping_short.json` 中，杜绝拼写错误的空宏。

---

## 三、 格式与编写铁律 (Formatting Contract)

1. **高信噪比（High Token Density）**：`domains/*.md` 仅供大模型与创作者速查，去掉一切寒暄导语、点赞求关注话术和免责声明，全部采用结构化 Markdown 表格、因果公式和判定条件树。
2. **双链语法 (`[[...]]`)**：跨领域引用统一使用 `[[agents]]`、`[[equipment-and-forge]]`、`[[collectibles]]`、`[[pets]]`、`[[mounts-and-tech-parts]]`、`[[game-modes-and-guild]]`、`[[activity-budget-models]]`、`[[macros-and-style-guide]]`。
3. **标准道具宏 (`完整名称{{short}}`)**：首次提及核心道具时附上标准短宏（如 `神炼核心{{神炼核心}}`、`双绝枪{{双绝枪}}`），便于大模型在生成公众号/抖音文稿时直接复制。
4. **表格钻石单位归表头**：所有涉及钻石补差或收益的表格，表头必须写明 `（钻石）`（如 `补至 850（钻石）`），数据单元格只写纯数字。
5. **可溯源引用 (`Source`)**：每个核心数据模块底部均须标注 `> Source: [文件名](../danke-creator/my-articles-md/...)`，确保每一条数值均有实测原稿支撑。

# 《弹壳特攻队》(Survivor.io) 大模型知识库 (LLM Wiki)

> **Architecture**: Karpathy LLM Wiki Paradigm (`raw/` → `wiki/` ← `WIKI_PROTOCOL.md`)
> **Target Consumer**: AI Agents / LLMs (Claude, Codex, Gemini, Antigravity) & Content Creators
> **Single Source of Truth for Compiled Game Knowledge**: `/Users/hbt/my-project/danke-wiki`

本项目并非面向普通玩家的营销前端，而是专为大语言模型（LLM）与 AI Agent 设计的**高信噪比、结构化、自演进 Markdown 知识中枢**。它将散落在 `danke-creator/my-articles-md/` 中的 135+ 篇原始图文攻略、285+ 个道具图标短宏（`image_mapping_short.json`）以及版本实测数据，编译为 8 个零废话、高 Token 密度的领域知识文件（`domains/*.md`）。

---

## 目录结构

```text
danke-wiki/
├── README.md                         # 本说明文档
├── WIKI_PROTOCOL.md                  # 大模型读写与维护契约（Query / Ingest / Lint 标准工作流）
├── index.md                          # 总目录导航（<3KB，大模型检索第一跳入口）
├── log.md                            # 知识演进日志（记录每次 Ingest / Update / Lint 的时间线）
├── articles-index.md                 # 135+ 篇原始攻略结构化全量索引（由 scripts/build-wiki.mjs 自动编译）
├── domains/                          # 8 大高密度领域知识库（纯干货表格 + 交叉引用 + 原始出处）
│   ├── agents.md                     # 特工体系：培养路线(543/741/840/伊狑844)、SP神火铁三角、全特工金5属性与探索标签
│   ├── equipment-and-forge.md        # 装备与神炼：红亡者过渡、6件SS合成顺位、天启3+破坏3联动、混18-45形态、五阶段神炼核心表
│   ├── collectibles.md               # 收藏品体系：四大典藏毕业套装星级节点、6大必做传奇红藏、1-10期暴击/暴伤金藏全表
│   ├── pets.md                       # 宠物体系：S宠解锁铁律、幽暗之灵锁头、同名觉醒共享、11-162异宠核心槽位表、助战技能梯队
│   ├── mounts-and-tech-parts.md      # 载具与配件：狼马对比、零件铺满金凑横线铁律、同步率换算、三大特工洗练排序、双生谐振过载
│   ├── game-modes-and-guild.md       # 玩法与公会：逃离行动卡5分38秒与80-130天赋、新版区域行动、联机夺取异宠、公会商店78万币与潮汐秘境
│   ├── activity-budget-models.md     # 活动精算模型：不计广告铁律、calculate_activity_budget公式、累计奖励规范、钥匙产出总账
│   └── macros-and-style-guide.md     # 创作规范与短宏词典：285+ 标准 {{short}} 宏分类速查、表格钻石单位表头规则、弹壳呱呱文风契约
└── scripts/
    ├── build-wiki.mjs                # 自动扫描 danke-creator/my-articles-md 与技能包宏，更新 articles-index.md 与宏表
    └── lint-wiki.mjs                 # 知识库健康度巡检（检测未索引新文章、断裂 [[wikilinks]]、非法 {{宏}}）
```

---

## 快速命令

```bash
# 1. 自动扫描原始文章库与技能短宏，重新生成 articles-index.md 并同步宏词典
node /Users/hbt/my-project/danke-wiki/scripts/build-wiki.mjs

# 2. 运行知识库一致性巡检（检查未归档文章、断裂双链、失效道具宏）
node /Users/hbt/my-project/danke-wiki/scripts/lint-wiki.mjs
```

---

## MCP 工具接入 (`danke-mcp-server`)

本知识库已挂载至 `/Users/hbt/my-project/danke-mcp-server`，AI Agent 可直接调用以下工具按需检索：

1. `get_wiki_index`：读取 `index.md` 总目录与最新 `log.md` 演进记录。
2. `get_wiki_domain`：按领域名（如 `agents`, `equipment-and-forge`, `collectibles` 等）精确拉取高密度领域知识。
3. `search_danke_wiki`：跨 8 大领域知识文件与 135+ 篇原始攻略全文检索关键词并返回带出处路径的段落。

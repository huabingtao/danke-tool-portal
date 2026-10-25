# 《弹壳特攻队》一体化 Wiki 系统架构与实现规范 (Spec)

> **文档修改日期**：2026-10-25  
> **状态**：已由用户确认定稿  
> **涉及工程**：`danke-core`、`danke-web`、`danke-creator`、`skills/danke-strategy-skill`

---

## 1. 架构目标与系统边界

在现有 `danke-web`（前台门户）与 `danke-core`（NestJS + Prisma + SQLite 数据中台）基础上直接扩建，将预留的 `/items`（图鉴百科）与 `/calculator`（养成消耗与计算器）占位路由打通，并与 `danke-creator/my-articles-md`（深度攻略库）及 `skills/danke-strategy-skill/packs/danke`（285+ 高清图标与词条字典）串联成一体化的《弹壳特攻队》Wiki 知识库系统。

### 1.1 数据流向拓扑

```
[danke-creator/my-articles-md]          [danke-strategy-skill/packs/danke]
(入门到入土 / 专题攻略 / 特工档案)       (285+ 分类高清图标 / image_mapping / highlight_rules)
              │                                         │
              └───────────────────┬─────────────────────┘
                                  ▼
                 ┌─────────────────────────────────┐
                 │  danke-core: sync-wiki-to-core  │
                 │  (自动化 ETL 解析与静态资源同步)  │
                 └────────────────┬────────────────┘
                                  │
          ┌───────────────────────┴───────────────────────┐
          ▼ (Prisma Upsert)                               ▼ (构建期静态兜底导出)
┌───────────────────────────────┐               ┌────────────────────────────────┐
│ danke-core (SQLite: danke.db) │               │ danke-web/public/wiki-assets/  │
│ - WikiEntry (六大类百科词条)   │               │ danke-web/lib/local-wiki-data  │
│ - ProgressionMatrix (养成矩阵) │               └───────────────┬────────────────┘
│ - StrategyArticle (攻略文章)   │                               │
└───────────────┬───────────────┘                               │
                └───────────────────────┬───────────────────────┘
                                        ▼
                       ┌─────────────────────────────────┐
                       │       danke-web (Next.js)       │
                       │ 1. /items 图鉴百科中心          │
                       │ 2. /calculator 养成消耗与节点表 │
                       │ 3. 入门到入土手册 & 正文词条卡  │
                       └─────────────────────────────────┘
```

---

## 2. 数据库模型设计 (`danke-core/prisma/schema.prisma`)

在保留现有 `Item`、`Agent`、`StrategyArticle` 等表兼容性的前提下，新增 `WikiEntry` 与 `ProgressionMatrix` 两张核心表：

```prisma
model WikiEntry {
  id                  String   @id @default(uuid())
  slug                String   @unique // 唯一标识，如 "collectible-ep1-golden-cutlery", "equip-ss-weapon"
  name                String   @unique // 词条标准名称，如 "黄金餐具", "双生合体-毁灭之光"
  category            String   // AGENT | EQUIPMENT | COLLECTIBLE | PET | TECH_PART | MOUNT | MECHANIC
  subcategory         String?  // 子类，如 "传奇收藏品", "史诗收藏品", "SS神器", "S级装备", "SP特工", "战斗Debuff"
  edition             String?  // 期数/批次，如 "第1期" ~ "第10期"（主要用于收藏品筛选）
  rarity              String   @default("S") // SS | SP | S | LEGENDARY(红) | EPIC(金) | COMMON
  tier                String?  // 强度/优先级评级，如 "T0 必做", "T1 核心", "暴击核心", "暴伤核心"
  icon                String   // 静态图标路径，如 "/wiki-assets/收藏品/史诗收藏品/第1期/黄金餐具.png"
  summary             String   // 一句话核心定位或效果简述
  tags                String   // JSON 字符串数组，如 '["暴击率", "第1期", "金收藏"]'
  attributes          String   // JSON 字符串：存储基础属性、星级/神铸/红3红5阶梯效果、技能描述
  relatedArticleSlugs String   // JSON 字符串数组：关联的 StrategyArticle slug 列表
  sort                Int      @default(0)
  enabled             Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model ProgressionMatrix {
  id                  String   @id @default(uuid())
  code                String   @unique // 如 "ss-forge-order", "pet-core-nodes", "tech-overload-cost", "agent-awakening", "red-collectible-priority"
  title               String   // 矩阵标题，如 "异宠核心消耗节点与战力收益表"
  category            String   // EQUIPMENT | PET | TECH_PART | AGENT | COLLECTIBLE
  summary             String   // 适用说明与精算结论摘要
  columns             String   // JSON 字符串数组：定义表头列结构 [{ key, label, highlight? }]
  rows                String   // JSON 字符串数组：定义每阶段行数据、消耗数值、累计消耗与性价比标记
  recommendations     String   // JSON 字符串数组：分档建议 [{ tier: "微氪/零氪停手点", target: "...", reason: "..." }]
  relatedArticleSlug  String?  // 对应深度攻略文章的 slug
  sort                Int      @default(0)
  enabled             Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### 2.1 `WikiEntry.attributes` JSON 结构约定

```json
{
  "slot": "武器 / 项链 / 手套 / 衣服 / 腰带 / 鞋子",
  "baseStats": ["攻击 +15%", "暴击率 +5%"],
  "milestones": [
    { "stage": "黄色3星 / 神铸1星", "effect": "解锁核心词条..." },
    { "stage": "红色3星 / 神铸3星", "effect": "暴击率额外 +5%（关键节点）", "isKeyNode": true },
    { "stage": "红色5星 / 神铸5星", "effect": "最终伤害加成..." }
  ],
  "acquisition": "S军备箱 / 收藏品宝箱第1期 / 限时活动兑换"
}
```

---

## 3. 后端接口规范 (`danke-core`)

在 `danke-core/src` 下新增 `wiki` 模块 (`WikiModule`、`WikiController`、`WikiService`)，提供以下公开只读 REST 接口（并启用 CORS）：

1. **`GET /wiki/entries`**
   - 查询参数：`category`（可选）、`subcategory`（可选）、`edition`（可选）、`tag`（可选）、`q`（关键词模糊匹配 `name` / `summary` / `tags`）。
   - 返回：已解析 JSON 字段（`tags`、`attributes`、`relatedArticleSlugs`）的 `WikiEntry[]` 列表，按 `sort ASC, updatedAt DESC` 排序。
2. **`GET /wiki/entries/:slug`**
   - 返回单个词条完整详情，并附带关联的 `StrategyArticle` 简要列表（标题、摘要、封面、slug）。
3. **`GET /wiki/matrices`**
   - 查询参数：`category`（可选）。
   - 返回：已解析 `columns`、`rows`、`recommendations` 的 `ProgressionMatrix[]` 列表。
4. **`GET /wiki/matrices/:code`**
   - 返回指定养成消耗矩阵详情。

---

## 4. 自动化 ETL 同步管线 (`danke-core/scripts/sync-wiki-to-core.ts`)

通过 `npm run sync:content` 一键触发（集成进 `sync-all-to-core.ts` 或作为子模块调用），包含以下 4 个确定性步骤：

1. **静态图标资源镜像**：
   - 将 `/Users/hbt/skills/skills/danke-strategy-skill/packs/danke/assets/img` 下的 `特工`、`装备`、`神铸`、`收藏品`、`宠物`、`配件`、`载具`、`道具`、`钥匙`、`技能图标` 目录增量同步至 `danke-web/public/wiki-assets/`，确保前端 Next.js 可直接以 `/wiki-assets/...` 访问。
2. **全量词条构建与知识融合**：
   - 遍历图标目录与 `image_mapping_short.json`，自动识别分类与期数（如 `收藏品/史诗收藏品/第1期~第10期`、`收藏品/传奇收藏品/第1期~第10期`）。
   - 结合 `danke-creator/my-articles-md` 中的专题攻略知识（如《1-10期加暴击率的金色收藏品全盘点》《1-10期加暴伤的金收藏品全盘点》《6个必做的红收藏品推荐》《从入门到入土》系列、SP/S 特工档案、SS 装备合成与神炼），为核心词条注入精准的 `tier`、`tags`（如 `["暴击率 +5%", "红3核心", "必做推荐"]`）、`attributes` 阶梯效果与 `relatedArticleSlugs`。
3. **养成消耗与优先级矩阵生成**：
   - 构建 5 张核心精算矩阵并写入 `ProgressionMatrix`：
     1. `ss-equip-synthesis-and-forge`：SS 装备合成顺序与永恒/破坏神铸 & 神炼核心分配优先级表
     2. `collectible-crit-and-red-priority`：1~10 期暴击/暴伤金收藏盘点与 6 大必做红收藏升星优先级表
     3. `pet-awakening-and-core-nodes`：宠物培养全阶段与异宠核心消耗节点性价比表
     4. `tech-part-twin-and-overload`：双生配件合成与谐振/过载消耗阶梯表
     5. `agent-tier-and-awakening`：SP / S 特工强度梯队与碎片/觉醒核心投入节点表
4. **前端静态兜底文件生成**：
   - 同步完成后，自动将全量 `WIKI_ENTRIES`、`PROGRESSION_MATRICES` 与 `HANDBOOK_SERIES`（从入门到入土五大篇章索引）写入 `danke-web/lib/local-wiki-data.ts`，保证 `danke-web` 在 `output: 'export'` 或离线状态下依然 100% 可用。

---

## 5. 前端路由与交互设计 (`danke-web`)

### 5.1 图鉴百科中心 (`danke-web/app/items/page.tsx`)
替换原有的“功能模块开发中”占位页，打造响应式暗黑电竞风图鉴中心：
- **顶部数据概览与搜索栏**：展示收录词条总数，支持按名称、外号、属性（如“暴击率”“裂伤”“神火”）实时检索。
- **一级分类胶囊导航**：
  - `全部` | `🦸 特工档案` | `⚔️ 装备与神器` | `🏺 收藏品 (1-10期)` | `🐾 战术宠物` | `⚙️ 科技配件` | `🛸 载具` | `⚡ 状态与机制词条`
- **二级快捷过滤器**：
  - 在「收藏品」分类下，提供 **期数筛选（第 1 期 ~ 第 10 期）** 与 **词条快捷筛选（🔥 加暴击率 / 💥 加暴击伤害 / 👑 T0 必做红藏）**。
  - 在「装备与神器」分类下，提供 **部位筛选（武器/项链/手套/衣服/腰带/鞋子）** 与 **品阶筛选（SS 神器 / S 杰出 / 神铸材料）**。
- **词条卡片与详情抽屉 (Modal)**：
  - 卡片展示高清图标、品质角标、核心词条标签（如 `红3: 暴击率+5%`）与一句话定位。
  - 点击卡片弹出详情抽屉：展示完整星级/神铸效果阶梯、获取途径、养成建议，以及底部 **「📖 关联深度攻略」** 卡片列表，点击直达对应攻略阅读页。

### 5.2 养成消耗与节点速查器 (`danke-web/app/calculator/page.tsx`)
替换原有的占位页，实现包含两大功能的养成精算中心：
- **模块 A：五大养成优先级与消耗矩阵切换器**
  - 支持在「SS 装备合成与神炼」「收藏品暴击/红藏优先级」「异宠核心消耗节点」「配件谐振与过载」「特工升星与觉醒」5 张精算表之间切换。
  - 亮显关键性价比节点（如 `🌟 最佳停手节点`、`🔥 质变节点`），并提供分档养成路线建议（萌新开荒 / 微氪进阶 / 顶配毕业）。
- **模块 B：核心材料交互式目标速算器**
  - 选择养成系统（如「异宠核心节点」「神炼核心阶梯」「配件过载」），设定「当前阶段」与「目标阶段」，实时计算所需累计核心/碎片差额与达成后的核心属性收益。

### 5.3 「从入门到入土」体系导航与正文词条联动
- **首页与导航栏升级**：
  - 在 `TopNavBar.tsx` 中增加「📚 百科图鉴 (`/items`)」与「🧮 养成速查 (`/calculator`)」直达入口。
  - 在首页或百科页顶部提供 **「《从入门到入土》五大必修体系课」** 专题横幅（特工篇、装备篇、宠物篇、收藏品篇、载具篇），方便新手系统化查阅。
- **正文内联词条识别 (`TacticalArticleViewer.tsx`)**：
  - 在攻略详情页底部新增「🔗 本篇涉及图鉴词条」关联卡片区，实现「读攻略 → 查图鉴 → 看消耗表」的双向闭环。

---

## 6. 异常处理与质量验证标准

1. **API 降级容错**：`danke-web/lib/api.ts` 新增 `fetchWikiEntries()` 与 `fetchProgressionMatrices()`，当后端 `danke-core` 未启动或请求超时时，自动无缝回退至 `local-wiki-data.ts` 静态数据。
2. **图片加载保护**：所有图鉴图标统一经过路径规范化校验，缺失图标自动回退至 `/wiki-assets/占位图.png`。
3. **测试与构建验证**：
   - `danke-core`：`npm run sync:content` 零报错完成数据库与静态数据同步，单元测试与接口返回正常。
   - `danke-web`：`npm run lint`、`npx vitest run` 与 `npm run build` 全部通过。

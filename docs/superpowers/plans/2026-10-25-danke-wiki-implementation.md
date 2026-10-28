# 《弹壳特攻队》一体化 Wiki Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `danke-web` 与 `danke-core` 扩建为一体化的《弹壳特攻队》Wiki 知识库系统，自动同步 `danke-strategy-skill/packs/danke` 的 285+ 图标资产与 `danke-creator/my-articles-md` 的深度知识，上线六大分类图鉴百科中心 (`/items`)、五大养成消耗与优先级矩阵速查器 (`/calculator`) 以及「从入门到入土」体系导航与攻略词条双向联动。

**Architecture:** 在 `danke-core` (NestJS 11 + Prisma 7 + SQLite) 中扩展 `WikiEntry` 与 `ProgressionMatrix` 两张核心表并暴露 `/api/wiki/*` REST 接口；编写确定性 ETL 脚本 `sync-wiki-to-core.ts` 自动扫描图标目录与创作库 Markdown，同步入库的同时在 `danke-web` 生成静态资源 `/wiki-assets/` 与离线兜底数据 `lib/local-wiki-data.ts`；在 `danke-web` (Next.js 16 + React 19 + Tailwind CSS 4) 中激活 `/items` 与 `/calculator` 页面并打通导航栏与攻略阅读器。

**Tech Stack:** NestJS 11, Prisma 7 (`@prisma/adapter-better-sqlite3`), SQLite, Next.js 16.2.10 (App Router), React 19.2.4, Tailwind CSS v4, Vitest / Jest, TypeScript 5.

## Global Constraints

- 严禁向已归档的单技能独立仓库推送代码；`/Users/hbt/skills/skills/danke-strategy-skill` 仅作只读数据源镜像图标与映射配置。
- `danke-core` 数据库采用嵌入式 SQLite (`file:./data/danke.db`)，所有 JSON 字段在 Prisma Schema 中以 `String` 存储并在 Service 层通过 `safeParse` 序列化/反序列化。
- `danke-web` 必须保持 `local-wiki-data.ts` 静态数据兜底能力，确保在 `danke-core` 未启动或静态构建时页面 100% 正常渲染与交互。
- 表格与数值展示遵循工作区规范：不展示无意义的重复单位，突出显示关键性价比节点（如 `红3`、`神铸3星`、`微氪停手节点`）。

---

### Task 1: 扩展 `danke-core` Prisma Schema 与 `WikiModule` 后端接口

**Files:**
- Modify: `danke-core/prisma/schema.prisma`
- Create: `danke-core/src/wiki/wiki.service.ts`
- Create: `danke-core/src/wiki/wiki.controller.ts`
- Create: `danke-core/src/wiki/wiki.module.ts`
- Create: `danke-core/src/wiki/wiki.service.spec.ts`
- Modify: `danke-core/src/app.module.ts`

**Interfaces:**
- Consumes: `PrismaService` from `danke-core/src/prisma/prisma.service.ts`
- Produces:
  - Prisma Models: `WikiEntry`, `ProgressionMatrix`
  - REST Endpoints:
    - `GET /api/wiki/entries` & `GET /wiki/entries` (query: `category`, `subcategory`, `edition`, `tag`, `q`)
    - `GET /api/wiki/entries/:slug` & `GET /wiki/entries/:slug`
    - `GET /api/wiki/matrices` & `GET /wiki/matrices` (query: `category`)
    - `GET /api/wiki/matrices/:code` & `GET /wiki/matrices/:code`

- [ ] **Step 1: 在 `danke-core/prisma/schema.prisma` 末尾新增 `WikiEntry` 与 `ProgressionMatrix` 模型并生成 Prisma Client**

在 `danke-core/prisma/schema.prisma` 末尾追加：

```prisma
model WikiEntry {
  id                  String   @id @default(uuid())
  slug                String   @unique
  name                String   @unique
  category            String   // AGENT | EQUIPMENT | COLLECTIBLE | PET | TECH_PART | MOUNT | MECHANIC
  subcategory         String?
  edition             String?  // 第1期 ~ 第10期
  rarity              String   @default("S") // SS | SP | S | LEGENDARY | EPIC | COMMON
  tier                String?  // T0 必做 | T1 核心 | 暴击核心 | 暴伤核心
  icon                String
  summary             String
  tags                String   // JSON string array
  attributes          String   // JSON string object
  relatedArticleSlugs String   // JSON string array
  sort                Int      @default(0)
  enabled             Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model ProgressionMatrix {
  id                  String   @id @default(uuid())
  code                String   @unique
  title               String
  category            String   // EQUIPMENT | PET | TECH_PART | AGENT | COLLECTIBLE
  summary             String
  columns             String   // JSON string array
  rows                String   // JSON string array
  recommendations     String   // JSON string array
  relatedArticleSlug  String?
  sort                Int      @default(0)
  enabled             Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

在 `danke-core` 目录运行：
```bash
npx prisma generate && npx prisma db push
```

- [ ] **Step 2: 编写 `WikiService` 单元测试 (`danke-core/src/wiki/wiki.service.spec.ts`)**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { WikiService } from './wiki.service';
import { PrismaService } from '../prisma/prisma.service';

describe('WikiService', () => {
  let service: WikiService;
  const mockPrisma = {
    wikiEntry: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    progressionMatrix: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    strategyArticle: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WikiService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WikiService>(WikiService);
  });

  it('should return parsed wiki entries and filter by tag or query', async () => {
    mockPrisma.wikiEntry.findMany.mockResolvedValue([
      {
        id: '1',
        slug: 'collectible-golden-cutlery',
        name: '黄金餐具',
        category: 'COLLECTIBLE',
        subcategory: '史诗收藏品',
        edition: '第1期',
        rarity: 'EPIC',
        tier: '暴击核心',
        icon: '/wiki-assets/收藏品/史诗收藏品/第1期/黄金餐具.png',
        summary: '第1期核心暴击率金收藏，红3解锁暴击率+5%',
        tags: JSON.stringify(['暴击率', '第1期', '金收藏']),
        attributes: JSON.stringify({ baseStats: ['攻击+800'], milestones: [{ stage: '红3星', effect: '暴击率+5%', isKeyNode: true }] }),
        relatedArticleSlugs: JSON.stringify(['resources-1-10']),
        sort: 1,
        enabled: true,
      },
    ]);

    const res = await service.findEntries({ category: 'COLLECTIBLE', tag: '暴击率' });
    expect(res).toHaveLength(1);
    expect(res[0].tags).toContain('暴击率');
    expect(res[0].attributes.milestones[0].isKeyNode).toBe(true);
  });

  it('should return parsed progression matrices', async () => {
    mockPrisma.progressionMatrix.findMany.mockResolvedValue([
      {
        id: 'm1',
        code: 'pet-core-nodes',
        title: '异宠核心消耗节点表',
        category: 'PET',
        summary: '异宠核心最优投入阶梯',
        columns: JSON.stringify([{ key: 'stage', label: '阶段' }]),
        rows: JSON.stringify([{ stage: '红1觉醒', cost: 15 }]),
        recommendations: JSON.stringify([{ tier: '微氪', target: '30核心', reason: '性价比最高' }]),
        relatedArticleSlug: 'resources-pet-core',
        sort: 1,
        enabled: true,
      },
    ]);

    const matrices = await service.findMatrices();
    expect(matrices).toHaveLength(1);
    expect(matrices[0].columns[0].key).toBe('stage');
    expect(matrices[0].rows[0].cost).toBe(15);
  });
});
```

- [ ] **Step 3: 运行测试确认失败**

Run: `cd danke-core && npx jest src/wiki/wiki.service.spec.ts`
Expected: FAIL (`Cannot find module './wiki.service'`)

- [ ] **Step 4: 实现 `WikiService`、`WikiController`、`WikiModule` 并注册到 `AppModule`**

创建 `danke-core/src/wiki/wiki.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface WikiEntryQuery {
  category?: string;
  subcategory?: string;
  edition?: string;
  tag?: string;
  q?: string;
}

@Injectable()
export class WikiService {
  constructor(private readonly prisma: PrismaService) {}

  async findEntries(query: WikiEntryQuery = {}) {
    const where: Record<string, any> = { enabled: true };
    if (query.category && query.category !== 'ALL') {
      where.category = query.category.toUpperCase();
    }
    if (query.subcategory) {
      where.subcategory = query.subcategory;
    }
    if (query.edition) {
      where.edition = query.edition;
    }

    const records = await this.prisma.wikiEntry.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { updatedAt: 'desc' }],
    });

    const parsed = records.map((item) => this.formatEntry(item));

    return parsed.filter((item) => {
      if (query.tag && !item.tags.some((t: string) => t.includes(query.tag!))) {
        return false;
      }
      if (query.q) {
        const kw = query.q.trim().toLowerCase();
        const inName = item.name.toLowerCase().includes(kw);
        const inSummary = item.summary.toLowerCase().includes(kw);
        const inTags = item.tags.some((t: string) => t.toLowerCase().includes(kw));
        const inSub = (item.subcategory || '').toLowerCase().includes(kw);
        return inName || inSummary || inTags || inSub;
      }
      return true;
    });
  }

  async findEntryBySlug(slug: string) {
    const record = await this.prisma.wikiEntry.findUnique({
      where: { slug },
    });
    if (!record) return null;

    const formatted = this.formatEntry(record);
    let relatedArticles: any[] = [];
    if (formatted.relatedArticleSlugs.length > 0) {
      relatedArticles = await this.prisma.strategyArticle.findMany({
        where: {
          slug: { in: formatted.relatedArticleSlugs },
          enabled: true,
        },
        select: {
          slug: true,
          title: true,
          category: true,
          categoryLabel: true,
          summary: true,
          date: true,
          badge: true,
        },
      });
    }

    return {
      ...formatted,
      relatedArticles,
    };
  }

  async findMatrices(category?: string) {
    const where: Record<string, any> = { enabled: true };
    if (category && category !== 'ALL') {
      where.category = category.toUpperCase();
    }
    const records = await this.prisma.progressionMatrix.findMany({
      where,
      orderBy: [{ sort: 'asc' }, { updatedAt: 'desc' }],
    });
    return records.map((m) => this.formatMatrix(m));
  }

  async findMatrixByCode(code: string) {
    const record = await this.prisma.progressionMatrix.findUnique({
      where: { code },
    });
    if (!record) return null;
    return this.formatMatrix(record);
  }

  private formatEntry(item: any) {
    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      category: item.category,
      subcategory: item.subcategory,
      edition: item.edition,
      rarity: item.rarity,
      tier: item.tier,
      icon: item.icon,
      summary: item.summary,
      tags: this.safeParse(item.tags, []),
      attributes: this.safeParse(item.attributes, {}),
      relatedArticleSlugs: this.safeParse(item.relatedArticleSlugs, []),
      sort: item.sort,
    };
  }

  private formatMatrix(item: any) {
    return {
      id: item.id,
      code: item.code,
      title: item.title,
      category: item.category,
      summary: item.summary,
      columns: this.safeParse(item.columns, []),
      rows: this.safeParse(item.rows, []),
      recommendations: this.safeParse(item.recommendations, []),
      relatedArticleSlug: item.relatedArticleSlug,
      sort: item.sort,
    };
  }

  private safeParse(raw: string, fallback: any) {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
}
```

创建 `danke-core/src/wiki/wiki.controller.ts`:
```typescript
import { Controller, Get, Param, Query } from '@nestjs/common';
import { WikiService } from './wiki.service';

@Controller(['api/wiki', 'wiki'])
export class WikiController {
  constructor(private readonly wikiService: WikiService) {}

  @Get('entries')
  findEntries(
    @Query('category') category?: string,
    @Query('subcategory') subcategory?: string,
    @Query('edition') edition?: string,
    @Query('tag') tag?: string,
    @Query('q') q?: string,
  ) {
    return this.wikiService.findEntries({
      category,
      subcategory,
      edition,
      tag,
      q,
    });
  }

  @Get('entries/:slug')
  findEntryBySlug(@Param('slug') slug: string) {
    return this.wikiService.findEntryBySlug(slug);
  }

  @Get('matrices')
  findMatrices(@Query('category') category?: string) {
    return this.wikiService.findMatrices(category);
  }

  @Get('matrices/:code')
  findMatrixByCode(@Param('code') code: string) {
    return this.wikiService.findMatrixByCode(code);
  }
}
```

创建 `danke-core/src/wiki/wiki.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { WikiService } from './wiki.service';
import { WikiController } from './wiki.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WikiController],
  providers: [WikiService],
  exports: [WikiService],
})
export class WikiModule {}
```

在 `danke-core/src/app.module.ts` 中导入并注册 `WikiModule`。

- [ ] **Step 5: 运行单元测试确认通过**

Run: `cd danke-core && npx jest src/wiki/wiki.service.spec.ts`
Expected: PASS (2 passed)

---

### Task 2: 编写自动化 ETL 同步脚本 (`sync-wiki-to-core.ts`) 并生成全量图鉴与静态兜底数据

**Files:**
- Create: `danke-core/scripts/sync-wiki-to-core.ts`
- Modify: `danke-core/scripts/sync-all-to-core.ts`
- Create: `danke-web/lib/local-wiki-data.ts` (由脚本自动生成并带完整 TypeScript 类型)
- Create: `danke-web/public/wiki-assets/` (由脚本镜像图标目录)

**Interfaces:**
- Consumes:
  - `/Users/hbt/skills/skills/danke-strategy-skill/packs/danke/assets/img`
  - `/Users/hbt/my-project/danke-creator/my-articles-md`
- Produces:
  - `danke-core` SQLite 中的全量 `WikiEntry`（涵盖特工、SS/S装备与神铸、1~10期史诗/传奇收藏品、宠物与技能、双生/谐振配件、载具、战斗Debuff词条）与 5 张 `ProgressionMatrix`
  - `danke-web/lib/local-wiki-data.ts` 导出的 `WikiEntryItem`、`ProgressionMatrixItem`、`HandbookGuideItem`、`LOCAL_WIKI_ENTRIES`、`LOCAL_PROGRESSION_MATRICES`、`LOCAL_HANDBOOK_GUIDES`

- [ ] **Step 1: 实现 `danke-core/scripts/sync-wiki-to-core.ts`**

脚本执行以下确定性操作：
1. 将 `/Users/hbt/skills/skills/danke-strategy-skill/packs/danke/assets/img` 递归复制到 `/Users/hbt/my-project/danke-web/public/wiki-assets`。
2. 结合 `danke-creator/my-articles-md` 的收藏品盘点（1-10期暴击率金收藏：黄金餐具、救世主的遗物、幸运护身符、洪荒战鼓、仙境玉露、等离子剑、黄金号角、超人类药品、水力推动脚蹼、微型人造太阳、反粒子葫芦、兽火之炉、脑机芯片、地之元素之珠、水之元素之珠、巨蟹座星辉、狮子座星辉；1-10期暴伤金收藏；6大必做红收藏：远古智慧之书、基因编辑器、不朽的幸运硬币、星际跃迁矩阵图纸、超能神经元、时间回溯齿轮等）、SS/S 装备与神铸、SP/S 特工、宠物与宠物技能、双生配件、载具、局内 Debuff，遍历图标库生成 180+ 条结构化 `WikiEntry`。
3. 生成 5 张核心 `ProgressionMatrix`（`ss-equip-synthesis-and-forge`、`collectible-crit-and-red-priority`、`pet-awakening-and-core-nodes`、`tech-part-twin-and-overload`、`agent-tier-and-awakening`）。
4. 将数据写入 `danke-core` SQLite 数据库，并输出带完整 TypeScript 类型定义的 `danke-web/lib/local-wiki-data.ts`。

- [ ] **Step 2: 在 `danke-core/scripts/sync-all-to-core.ts` 中挂载 `syncWikiToCore` 并修复 `creatorArticlesPath` 扁平目录路径**

确保 `danke-core/scripts/sync-all-to-core.ts` 包含 `path.resolve(__dirname, '../../danke-creator/my-articles-md')` 并在同步完攻略后自动执行 `syncWikiToCore(prisma)`。

- [ ] **Step 3: 运行 `npm run sync:content` 验证入库与文件生成**

Run: `cd danke-core && npm run sync:content`
Expected: 控制台输出同步成功的特工、攻略文章、180+ 条 `WikiEntry`、5 张 `ProgressionMatrix`，且 `danke-web/lib/local-wiki-data.ts` 与 `danke-web/public/wiki-assets/` 生成完毕。

---

### Task 3: 升级 `danke-web` API 客户端与图鉴百科中心 (`app/items/page.tsx`)

**Files:**
- Modify: `danke-web/lib/api.ts`
- Create: `danke-web/components/WikiEncyclopediaClient.tsx`
- Modify: `danke-web/app/items/page.tsx`
- Create: `danke-web/__tests__/wiki-encyclopedia.test.tsx`

**Interfaces:**
- Consumes: `LOCAL_WIKI_ENTRIES`, `LOCAL_HANDBOOK_GUIDES`, `WikiEntryItem` from `danke-web/lib/local-wiki-data.ts`
- Produces:
  - `fetchWikiEntries()`, `fetchProgressionMatrices()` in `danke-web/lib/api.ts`
  - Interactive Encyclopedia UI in `danke-web/app/items/page.tsx`

- [ ] **Step 1: 编写图鉴百科组件测试 (`danke-web/__tests__/wiki-encyclopedia.test.tsx`)**

验证：
1. 渲染六大分类 Tab（全部、特工档案、装备与神器、收藏品、战术宠物、科技配件、载具、状态与机制）与《从入门到入土》五大必修课入口；
2. 切换到「收藏品」并点击「🔥 加暴击率」快捷筛选时，准确过滤出带 `暴击率` 标签的金收藏词条（如 `黄金餐具`）；
3. 点击任意词条卡片可打开详情抽屉 Modal，展示星级/神铸阶梯节点与关联攻略链接。

- [ ] **Step 2: 扩展 `danke-web/lib/api.ts` 并实现 `WikiEncyclopediaClient.tsx` 与 `app/items/page.tsx`**

在 `danke-web/lib/api.ts` 新增 `fetchWikiEntries` 与 `fetchProgressionMatrices`，并在失败时回退到 `LOCAL_WIKI_ENTRIES` / `LOCAL_PROGRESSION_MATRICES`。
在 `danke-web/components/WikiEncyclopediaClient.tsx` 实现完整图鉴百科客户端交互，并在 `danke-web/app/items/page.tsx` 挂载。

- [ ] **Step 3: 运行 Vitest 单元测试验证通过**

Run: `cd danke-web && npx vitest run __tests__/wiki-encyclopedia.test.tsx`
Expected: PASS

---

### Task 4: 实现养成消耗与优先级速查中心 (`app/calculator/page.tsx`) 及全站导航联动

**Files:**
- Create: `danke-web/components/ProgressionCalculatorClient.tsx`
- Modify: `danke-web/app/calculator/page.tsx`
- Modify: `danke-web/components/TopNavBar.tsx`
- Modify: `danke-web/components/HomeToolsSection.tsx`
- Modify: `danke-web/components/HomePageClient.tsx`
- Modify: `danke-web/app/strategies/[slug]/page.tsx`
- Create: `danke-web/__tests__/progression-calculator.test.tsx`

**Interfaces:**
- Consumes: `LOCAL_PROGRESSION_MATRICES`, `LOCAL_WIKI_ENTRIES`, `LOCAL_HANDBOOK_GUIDES` from `danke-web/lib/local-wiki-data.ts`
- Produces:
  - `/calculator` 页面：五大养成优先级矩阵切换器 + 核心材料阶段差额交互计算器
  - `TopNavBar.tsx`：新增「百科图鉴 (`/items`)」与「养成速查 (`/calculator`)」导航链接
  - `HomePageClient.tsx` & `HomeToolsSection.tsx`：在首页展示《从入门到入土》体系入口与 Wiki 快捷入口卡片
  - `app/strategies/[slug]/page.tsx`：在攻略详情页底部展示关联的图鉴词条卡片，点击跳转 `/items?q=...`

- [ ] **Step 1: 编写养成消耗与速算器测试 (`danke-web/__tests__/progression-calculator.test.tsx`)**

验证：
1. 支持在五大养成精算矩阵（SS装备合成与神炼、收藏品暴击/红藏优先级、异宠核心消耗节点、配件谐振与过载、特工升星与觉醒）间切换并渲染阶梯表与分档建议；
2. 交互式阶段计算器可根据所选起点与目标阶段实时计算出所需核心/碎片差额与累计属性收益。

- [ ] **Step 2: 实现 `ProgressionCalculatorClient.tsx` 并更新 `app/calculator/page.tsx`、`TopNavBar.tsx`、`HomePageClient.tsx` 与 `app/strategies/[slug]/page.tsx`**

完成组件编写与全站双向跳转链接接入。

- [ ] **Step 3: 运行全量测试与生产构建校验**

Run:
1. `cd danke-core && npm test`
2. `cd danke-web && npx vitest run && npm run build`
Expected: 所有单元测试与 Next.js 生产构建全部通过。

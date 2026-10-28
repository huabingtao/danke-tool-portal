# 《弹壳特攻队》LLM Wiki 演进日志 (Knowledge Evolution Log)

> 本文件按时间倒序记录大模型对 `danke-wiki` 的每一次知识摄取（`INGEST`）、机制修正（`UPDATE`）与健康巡检（`LINT`）。

---

## [2026-10-26] INIT & FULL COMPILE | 初始编译全量知识库 (v1.0)

- **Action**: `INIT` / `INGEST`
- **Scope**: 扫描 `/Users/hbt/my-project/danke-creator/my-articles-md/` 下全部 15 个分类目录（共 135+ 篇主攻略原稿）及 `/Users/hbt/skills/skills/danke-strategy-skill/packs/danke/image_mapping_short.json`（285+ 道具短宏）。
- **Compiled Artifacts**:
  1. `WIKI_PROTOCOL.md`：确立 `raw/` → `wiki/` ← `protocol` 三层架构与 `Query` / `Ingest` / `Lint` 标准工作流。
  2. `index.md`：建立大模型第一跳检索目录（覆盖 8 大领域文件与全量文章索引）。
  3. `domains/agents.md`：整理特工养成 6 阶段（科萌 → 塔洛西娅 → 维托尔 → `543` → `741` → `840` → `伊狑844`）、SP 神火铁三角（哪吒/伏尔甘/洛基）觉醒节点、全 24 位特工金 5 属性与公会探索 6 大特征标签、5.3.0 矩阵小队规则。
  4. `domains/equipment-and-forge.md`：整理红亡者之甲 200 关逃课、6 件 SS 装备合成优先级、天启战衣永恒 3 + 破坏项链神铸 3 联动、扭曲腰带收藏品门槛、混 18/27/36/45 武器形态、衣/武/手五阶段神炼核心表（6/10/22/30/42 核）及月殇护手 1~13 级神炼详解。
  5. `domains/collectibles.md`：整理四大毕业典藏套装（`实现童年的梦想` 25 黄星无缝共鸣等）、6 大必做传奇红藏、1~10 期全部史诗金藏（暴击率/暴伤/攻击型满星+2000攻）速查表、5.3.0 永恒收藏品自选箱。
  6. `domains/pets.md`：整理 S 宠解锁铁律（4 只同系普通宠保 5 黄星）、7 只 S 宠定位与幽暗之灵永夜王冠锁头、同名宠觉醒共享机制、11~162 异宠核心槽位表（21/50/90/150 核）、助战技能 T0~D 梯队与伊狑 844 河豚挂毒方案。
  7. `domains/mounts-and-tech-parts.md`：整理主线 80 章载具解锁、幽灵狼 vs 战马、零件摆放四原则与同步率换算、三大主力特工洗练词条排序、双生配件谐振能量节点（900~15000）与谐振过载 1~12 级芯片消耗表。
  8. `domains/game-modes-and-guild.md`：整理逃离行动卡 5 分 38 秒进安全屋与 80~130 天赋树、新版区域行动 5 机制、联机挑战夺取异宠规则、公会月产 79.68 万币与商店 77.89 万币精算、潮汐秘境 1200/500 宝钻方案、日常周常每周 1010 钻。
  9. `domains/activity-budget-models.md`：整理限时活动预算精算公式、不计未确认广告铁律、累计奖励规范及全系列 8 类钥匙白嫖产出总账。
  10. `domains/macros-and-style-guide.md` & `articles-index.md`：通过 `scripts/build-wiki.mjs` 编译全量 285+ 短宏映射与原始文章索引，并通过 `scripts/lint-wiki.mjs` 校验。

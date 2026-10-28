#!/usr/bin/env node
/**
 * danke-wiki 自动编译器 (build-wiki.mjs)
 *
 * 作用：
 * 1. 扫描 danke-creator/my-articles-md 下的全部主攻略 Markdown，提取标题、日期、摘要、标签与相对路径，
 *    自动生成结构化的 danke-wiki/articles-index.md。
 * 2. 读取 danke-strategy-skill 的 image_mapping_short.json（285+ 标准短宏），
 *    自动分类并同步写入 danke-wiki/domains/macros-and-style-guide.md。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WIKI_ROOT = path.resolve(__dirname, "..");
const ARTICLES_ROOT = path.resolve(WIKI_ROOT, "../danke-creator/my-articles-md");
const SHORT_MACROS_PATH = fs.existsSync(
  path.resolve(WIKI_ROOT, "../skills/danke-strategy-skill/packs/danke/image_mapping_short.json")
)
  ? path.resolve(WIKI_ROOT, "../skills/danke-strategy-skill/packs/danke/image_mapping_short.json")
  : "/Users/hbt/skills/skills/danke-strategy-skill/packs/danke/image_mapping_short.json";

/**
 * 判断一个 Markdown 文件是否为正式主攻略（过滤中间编译产物、素材、粗稿与说明文档）
 */
export function isPrimaryArticle(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  const parts = normalized.split("/");
  const base = path.basename(normalized);

  // 排除隐藏目录、dist、素材、备份与整理记录目录
  if (
    parts.some(
      (p) =>
        p.startsWith(".") ||
        p === "dist" ||
        p === "素材" ||
        p === "整理记录" ||
        p === "角色档案"
    )
  ) {
    return false;
  }

  // 排除排版中间文件与过程草稿
  if (
    base.endsWith("_stage1.md") ||
    base.endsWith("_stage2.md") ||
    base.endsWith("_wechat.md") ||
    base.endsWith("_raw.md") ||
    base.includes("copy") ||
    base.includes("粗稿") ||
    base.includes("粗镐") ||
    base.includes("粗写") ||
    base.includes("粗搞") ||
    base.includes("待确认") ||
    base.includes("初始版本") ||
    base.includes("备份") ||
    base.includes("官方公众号") ||
    base.includes("官方邮件") ||
    base.includes("discord社区") ||
    base.includes("聊天记录") ||
    base.includes("创作计划") ||
    base.includes("任务描述") ||
    base.includes("素材") ||
    base === "AGENTS.md" ||
    base === "README.md"
  ) {
    return false;
  }

  return base.endsWith(".md");
}

/**
 * 轻量解析 YAML Frontmatter 与首个一级/二级标题
 */
function parseArticleMeta(filePath, relPath) {
  const raw = fs.readFileSync(filePath, "utf8");
  let title = "";
  let date = "";
  let summary = "";
  let tags = [];

  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  let body = raw;
  if (fmMatch) {
    const fm = fmMatch[1];
    body = raw.slice(fmMatch[0].length);

    const titleMatch = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m);
    if (titleMatch) title = titleMatch[1].trim();

    const dateMatch = fm.match(/^date:\s*["']?([0-9]{4}-[0-9]{2}-[0-9]{2})["']?/m);
    if (dateMatch) date = dateMatch[1].trim();

    const summaryMatch = fm.match(/^summary:\s*["']?(.+?)["']?\s*$/m);
    if (summaryMatch) summary = summaryMatch[1].trim();

    const inlineTagsMatch = fm.match(/^tags:\s*\[(.*?)\]/m);
    if (inlineTagsMatch) {
      tags = inlineTagsMatch[1]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    }
  }

  if (!title) {
    const h1Match = body.match(/^#{1,2}\s+(.+)$/m);
    if (h1Match) {
      title = h1Match[1].replace(/[*`]/g, "").trim();
    } else {
      title = path.basename(relPath, ".md");
    }
  }

  if (!date) {
    // 尝试从提醒目录名 YY.M.D 提取日期
    const reminderMatch = relPath.match(/提醒\/(\d{2})\.(\d{1,2})\.(\d{1,2})\//);
    if (reminderMatch) {
      const [, yy, mm, dd] = reminderMatch;
      date = `20${yy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
    } else {
      const stat = fs.statSync(filePath);
      date = stat.mtime.toISOString().slice(0, 10);
    }
  }

  if (!summary) {
    // 提取正文第一段非图片、非引用文本
    const cleanLines = body
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(
        (l) =>
          l &&
          !l.startsWith("#") &&
          !l.startsWith("!") &&
          !l.startsWith(">") &&
          !l.startsWith("|") &&
          !l.startsWith("---") &&
          !l.startsWith("{{")
      );
    summary = cleanLines[0] ? cleanLines[0].slice(0, 90) : title;
  }

  const category = relPath.split("/")[0] || "未分类";

  return {
    relPath,
    category,
    title: title.replace(/\|/g, "｜"),
    date,
    summary: summary.replace(/\|/g, "｜").replace(/\r?\n/g, " "),
    tags,
  };
}

/**
 * 递归扫描目录
 */
export function scanAllPrimaryArticles(rootDir = ARTICLES_ROOT) {
  const results = [];
  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, "/");
      if (entry.isDirectory()) {
        if (entry.name.startsWith(".") || entry.name === "dist" || entry.name === "素材") {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile() && isPrimaryArticle(relPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.size > 0) {
          results.push(parseArticleMeta(fullPath, relPath));
        }
      }
    }
  }
  walk(rootDir);
  return results;
}

/**
 * 生成 articles-index.md
 */
function buildArticlesIndex(articles) {
  const categoryOrder = [
    "特工",
    "装备",
    "收藏品",
    "宠物",
    "载具",
    "区域行动",
    "逃离行动",
    "联机",
    "公会",
    "活动",
    "版本更新",
    "爆料",
    "其他",
    "event",
    "提醒",
  ];

  const grouped = new Map();
  for (const item of articles) {
    if (!grouped.has(item.category)) grouped.set(item.category, []);
    grouped.get(item.category).push(item);
  }

  const sortedCategories = [
    ...categoryOrder.filter((c) => grouped.has(c)),
    ...[...grouped.keys()].filter((c) => !categoryOrder.includes(c)).sort(),
  ];

  const nonReminderCount = articles.filter((a) => a.category !== "提醒").length;
  const reminderCount = articles.filter((a) => a.category === "提醒").length;

  const lines = [
    "# 《弹壳特攻队》原始攻略全量索引 (Articles Master Index)",
    "",
    `> **Parent**: [[index]] | **Protocol**: [[WIKI_PROTOCOL]]`,
    `> **Auto-Generated**: 由 \`scripts/build-wiki.mjs\` 自动编译。当前共收录 **${articles.length} 篇** 主攻略原稿（其中深度专题攻略 **${nonReminderCount} 篇**，每日活动日历提醒 **${reminderCount} 篇**）。`,
    "",
    "---",
    "",
    "## 分类统计概览",
    "",
    "| 分类目录 | 收录篇数 | 对应编译领域知识库 |",
    "| :--- | :---: | :--- |",
  ];

  const domainMap = {
    特工: "[[agents]]",
    装备: "[[equipment-and-forge]]",
    收藏品: "[[collectibles]]",
    宠物: "[[pets]]",
    载具: "[[mounts-and-tech-parts]]",
    区域行动: "[[game-modes-and-guild]]",
    逃离行动: "[[game-modes-and-guild]]",
    联机: "[[game-modes-and-guild]]",
    公会: "[[game-modes-and-guild]]",
    活动: "[[activity-budget-models]]",
    版本更新: "[[agents]] / [[equipment-and-forge]]",
    爆料: "[[equipment-and-forge]] / [[game-modes-and-guild]]",
    其他: "[[game-modes-and-guild]] / [[activity-budget-models]]",
    event: "[[activity-budget-models]]",
    提醒: "[[game-modes-and-guild]]",
  };

  for (const cat of sortedCategories) {
    const list = grouped.get(cat) || [];
    lines.push(`| **${cat}** | ${list.length} | ${domainMap[cat] || "[[index]]"} |`);
  }

  lines.push("", "---", "");

  for (const cat of sortedCategories) {
    const list = (grouped.get(cat) || []).sort((a, b) => b.date.localeCompare(a.date));
    lines.push(`## 📁 ${cat}（${list.length} 篇）`, "");
    lines.push("| 日期 | 攻略标题与源码链接 | 核心摘要 / 检索线索 |");
    lines.push("| :---: | :--- | :--- |");
    for (const item of list) {
      const encodedRel = item.relPath
        .split("/")
        .map((seg) => encodeURIComponent(seg))
        .join("/");
      const link = `[${item.title}](../danke-creator/my-articles-md/${encodedRel})<br>\`${item.relPath}\``;
      lines.push(`| ${item.date} | ${link} | ${item.summary} |`);
    }
    lines.push("");
  }

  const outPath = path.join(WIKI_ROOT, "articles-index.md");
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");
  return outPath;
}

/**
 * 对 285+ 短宏进行智能语义归类并写入 domains/macros-and-style-guide.md
 */
function syncMacrosIntoStyleGuide() {
  const rawMacros = JSON.parse(fs.readFileSync(SHORT_MACROS_PATH, "utf8"));
  const entries = Object.entries(rawMacros).sort(([a], [b]) => a.localeCompare(b, "zh-CN"));

  const buckets = {
    "1. 核心、碎片、芯片与洗练资源": [],
    "2. 特工、SP联动角色与专属技能": [],
    "3. SS神装、S级装备与武器": [],
    "4. 载具与双生/科技配件": [],
    "5. 宠物、异宠道具与助战词条": [],
    "6. 钥匙、宝箱与自选礼包": [],
    "7. 传奇（红）与史诗（金）收藏品": [],
    "8. 异常状态、活动道具与通用排版宏": [],
  };

  const agentNames = new Set([
    "科萌", "塔洛西娅", "维托尔", "伊狑", "凛音", "金", "月咏", "沃尔默", "艾琳娜", "凯蒂斯",
    "杨大师", "威彻", "乔伊", "哪吒", "伏尔甘", "拉斐尔", "莱昂纳多", "多纳泰罗", "米开朗基罗",
    "斯普林特", "爱普莉尔", "海绵宝宝", "派大星", "章鱼哥", "珊迪", "紫焰降魔", "莲花化身",
    "火神熔炉", "神火淬炼", "神火", "阴阳", "魔化解放",
  ]);

  for (const [shortKey, targetAsset] of entries) {
    const combined = `${shortKey} ${targetAsset}`;
    if (
      combined.includes("核心") ||
      combined.includes("碎片") ||
      combined.includes("芯片") ||
      combined.includes("水晶") ||
      combined.includes("精华") ||
      combined.includes("之石")
    ) {
      buckets["1. 核心、碎片、芯片与洗练资源"].push([shortKey, targetAsset]);
    } else if (agentNames.has(shortKey)) {
      buckets["2. 特工、SP联动角色与专属技能"].push([shortKey, targetAsset]);
    } else if (
      targetAsset.startsWith("ss") ||
      targetAsset.startsWith("s项链") ||
      targetAsset.startsWith("s腰带") ||
      targetAsset.startsWith("混沌") ||
      targetAsset.startsWith("永恒") ||
      combined.includes("破坏") ||
      shortKey === "等离子剑"
    ) {
      buckets["3. SS神装、S级装备与武器"].push([shortKey, targetAsset]);
    } else if (
      combined.includes("双生") ||
      combined.includes("无人机") ||
      combined.includes("钻头") ||
      combined.includes("足球") ||
      combined.includes("雷电") ||
      combined.includes("榴莲") ||
      combined.includes("激光") ||
      combined.includes("燃烧瓶") ||
      combined.includes("回旋镖") ||
      combined.includes("守卫者") ||
      combined.includes("导弹") ||
      combined.includes("砖头") ||
      combined.includes("量子") ||
      combined.includes("战马") ||
      combined.includes("幽焰逐影") ||
      combined.includes("滑板") ||
      combined.includes("平衡车")
    ) {
      buckets["4. 载具与双生/科技配件"].push([shortKey, targetAsset]);
    } else if (
      combined.includes("幽暗之灵") ||
      combined.includes("加肥喵") ||
      combined.includes("松鼠") ||
      combined.includes("企鹅") ||
      combined.includes("卡皮") ||
      combined.includes("河豚") ||
      combined.includes("咕咕鸡") ||
      combined.includes("老鹰") ||
      combined.includes("呱呱蛙") ||
      combined.includes("壳壳龟") ||
      combined.includes("噗噗豚") ||
      combined.includes("狗") ||
      combined.includes("蜗牛") ||
      combined.includes("螃蟹") ||
      combined.includes("鱼") ||
      combined.includes("DD-6") ||
      combined.includes("共鸣") ||
      combined.includes("异宠") ||
      combined.includes("宠物饼干")
    ) {
      buckets["5. 宠物、异宠道具与助战词条"].push([shortKey, targetAsset]);
    } else if (
      combined.includes("钥匙") ||
      combined.includes("奇钥") ||
      combined.includes("箱") ||
      combined.includes("自选") ||
      combined.includes("礼包") ||
      combined.includes("券")
    ) {
      buckets["6. 钥匙、宝箱与自选礼包"].push([shortKey, targetAsset]);
    } else if (
      combined.includes("星辉") ||
      combined.includes("编辑器") ||
      combined.includes("回溯齿轮") ||
      combined.includes("显影液") ||
      combined.includes("傀儡") ||
      combined.includes("图腾柱") ||
      combined.includes("宝镜") ||
      combined.includes("梦境拼图") ||
      combined.includes("跃迁") ||
      combined.includes("神经元") ||
      combined.includes("脚蹼") ||
      combined.includes("克莱因瓶") ||
      combined.includes("地图") ||
      combined.includes("护身符") ||
      combined.includes("书籍") ||
      combined.includes("共生体") ||
      combined.includes("遗物") ||
      combined.includes("号角") ||
      combined.includes("多面骰") ||
      combined.includes("维度箔") ||
      combined.includes("水晶") ||
      combined.includes("独角兽") ||
      combined.includes("元素") ||
      combined.includes("罗盘") ||
      combined.includes("太阳") ||
      combined.includes("泥板") ||
      combined.includes("餐具") ||
      combined.includes("红羽") ||
      combined.includes("沙漏") ||
      combined.includes("机箱") ||
      combined.includes("机器人") ||
      combined.includes("气息瓶") ||
      combined.includes("音符") ||
      combined.includes("海螺") ||
      combined.includes("乘客卡") ||
      combined.includes("塔罗牌") ||
      combined.includes("葫芦") ||
      combined.includes("重力") ||
      combined.includes("硬币") ||
      combined.includes("玉露") ||
      combined.includes("火炉") ||
      combined.includes("之炉") ||
      combined.includes("头盔") ||
      combined.includes("魔方") ||
      combined.includes("果壳宇宙") ||
      combined.includes("电池") ||
      combined.includes("战鼓") ||
      combined.includes("之锤") ||
      combined.includes("之眼") ||
      combined.includes("光环") ||
      combined.includes("毒素") ||
      combined.includes("面具") ||
      combined.includes("药品") ||
      combined.includes("电路板") ||
      combined.includes("戴森球") ||
      combined.includes("笔记") ||
      combined.includes("胶囊") ||
      combined.includes("收藏之心") ||
      combined.includes("之瞳") ||
      combined.includes("龙牙") ||
      combined.includes("虚空之花") ||
      combined.includes("探测器")
    ) {
      buckets["7. 传奇（红）与史诗（金）收藏品"].push([shortKey, targetAsset]);
    } else {
      buckets["8. 异常状态、活动道具与通用排版宏"].push([shortKey, targetAsset]);
    }
  }

  const mdLines = [
    `## 二、 全量 ${entries.length} 个标准 \`{{short}}\` 道具图标宏分类速查表`,
    "",
    "> **数据来源**：`/Users/hbt/skills/skills/danke-strategy-skill/packs/danke/image_mapping_short.json`",
    "",
  ];

  for (const [bucketTitle, list] of Object.entries(buckets)) {
    mdLines.push(`### ${bucketTitle}（${list.length} 项）`, "");
    mdLines.push("| 标准短宏语法 | 映射底层素材名 | 标准短宏语法 | 映射底层素材名 |");
    mdLines.push("| :--- | :--- | :--- | :--- |");
    for (let i = 0; i < list.length; i += 2) {
      const [k1, v1] = list[i];
      const pair2 = list[i + 1];
      if (pair2) {
        const [k2, v2] = pair2;
        mdLines.push(`| \`{{${k1}}}\` | ${v1.trim()} | \`{{${k2}}}\` | ${v2.trim()} |`);
      } else {
        mdLines.push(`| \`{{${k1}}}\` | ${v1.trim()} | — | — |`);
      }
    }
    mdLines.push("");
  }

  const styleGuidePath = path.join(WIKI_ROOT, "domains/macros-and-style-guide.md");
  const currentContent = fs.readFileSync(styleGuidePath, "utf8");
  const updatedContent = currentContent.replace(
    /<!-- AUTO-GENERATED-MACROS:START -->[\s\S]*?<!-- AUTO-GENERATED-MACROS:END -->/,
    `<!-- AUTO-GENERATED-MACROS:START -->\n${mdLines.join("\n")}\n<!-- AUTO-GENERATED-MACROS:END -->`
  );
  fs.writeFileSync(styleGuidePath, updatedContent, "utf8");
  return entries.length;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const articles = scanAllPrimaryArticles();
  const indexOut = buildArticlesIndex(articles);
  const macroCount = syncMacrosIntoStyleGuide();
  console.log(`✅ [build-wiki] 已索引 ${articles.length} 篇主攻略 -> ${indexOut}`);
  console.log(`✅ [build-wiki] 已同步 ${macroCount} 个标准短宏 -> domains/macros-and-style-guide.md`);
}

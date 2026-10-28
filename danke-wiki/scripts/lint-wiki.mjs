#!/usr/bin/env node
/**
 * danke-wiki 健康度巡检脚本 (lint-wiki.mjs)
 *
 * 作用：
 * 1. 检查 8 大领域文件 (domains/*.md) 与核心入口文件是否完整非空。
 * 2. 检查 danke-creator/my-articles-md 中是否存在未归档进 articles-index.md 的新主攻略。
 * 3. 检查所有 [[wikilinks]] 双链是否指向真实存在的知识库文件。
 * 4. 检查 domains/*.md 中使用的所有 {{short}} 道具宏是否在 image_mapping_short.json 中合法注册。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanAllPrimaryArticles } from "./build-wiki.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WIKI_ROOT = path.resolve(__dirname, "..");

const SHORT_MACROS_PATH = fs.existsSync(
  path.resolve(WIKI_ROOT, "../skills/danke-strategy-skill/packs/danke/image_mapping_short.json")
)
  ? path.resolve(WIKI_ROOT, "../skills/danke-strategy-skill/packs/danke/image_mapping_short.json")
  : "/Users/hbt/skills/skills/danke-strategy-skill/packs/danke/image_mapping_short.json";

const REQUIRED_DOMAINS = [
  "agents",
  "equipment-and-forge",
  "collectibles",
  "pets",
  "mounts-and-tech-parts",
  "game-modes-and-guild",
  "activity-budget-models",
  "macros-and-style-guide",
];

const VALID_WIKILINK_TARGETS = new Set([
  "index",
  "WIKI_PROTOCOL",
  "log",
  "articles-index",
  ...REQUIRED_DOMAINS,
]);

function runLint() {
  const errors = [];
  const warnings = [];

  // 1. 检查核心文件与 8 大领域文件
  for (const domain of REQUIRED_DOMAINS) {
    const p = path.join(WIKI_ROOT, "domains", `${domain}.md`);
    if (!fs.existsSync(p)) {
      errors.push(`缺失领域知识文件: domains/${domain}.md`);
    } else if (fs.statSync(p).size < 200) {
      errors.push(`领域知识文件内容过短 (<200B): domains/${domain}.md`);
    }
  }

  // 2. 检查未归档的主攻略文章
  const articlesIndexPath = path.join(WIKI_ROOT, "articles-index.md");
  if (!fs.existsSync(articlesIndexPath)) {
    errors.push("缺失 articles-index.md，请先运行 node scripts/build-wiki.mjs");
  } else {
    const indexContent = fs.readFileSync(articlesIndexPath, "utf8");
    const primaryArticles = scanAllPrimaryArticles();
    for (const art of primaryArticles) {
      if (!indexContent.includes(`\`${art.relPath}\``)) {
        errors.push(`发现未索引的原始攻略: ${art.relPath}（请运行 build-wiki.mjs 并评估是否需 Ingest 到 domains/）`);
      }
    }
  }

  // 3. 检查所有 Markdown 中的 [[wikilinks]] 与 {{macros}}
  const validMacros = new Set(Object.keys(JSON.parse(fs.readFileSync(SHORT_MACROS_PATH, "utf8"))));
  const placeholderMacros = new Set(["short", "宏", "往期推荐", "扫码获取更多精彩"]);

  const mdFilesToScan = [
    path.join(WIKI_ROOT, "index.md"),
    path.join(WIKI_ROOT, "WIKI_PROTOCOL.md"),
    path.join(WIKI_ROOT, "log.md"),
    ...REQUIRED_DOMAINS.map((d) => path.join(WIKI_ROOT, "domains", `${d}.md`)),
  ];

  for (const filePath of mdFilesToScan) {
    if (!fs.existsSync(filePath)) continue;
    const relName = path.relative(WIKI_ROOT, filePath);
    const content = fs.readFileSync(filePath, "utf8");

    // 检查 [[wikilinks]]
    const wikiLinkRegex = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;
    let linkMatch;
    while ((linkMatch = wikiLinkRegex.exec(content)) !== null) {
      const target = linkMatch[1].trim();
      if (target === "wikilinks" || target === "..." || target === "领域文件名") continue;
      if (!VALID_WIKILINK_TARGETS.has(target)) {
        errors.push(`${relName}: 断裂的 [[wikilink]] -> [[${target}]]`);
      }
    }

    // 检查 {{short}} 道具宏
    const macroRegex = /\{\{([^{}\n]+)\}\}/g;
    let macroMatch;
    while ((macroMatch = macroRegex.exec(content)) !== null) {
      const macroName = macroMatch[1].trim();
      if (placeholderMacros.has(macroName)) continue;
      if (!validMacros.has(macroName)) {
        errors.push(`${relName}: 未注册的道具短宏 {{${macroName}}}（不在 image_mapping_short.json 中）`);
      }
    }
  }

  if (warnings.length > 0) {
    console.warn("⚠️ Warnings:");
    for (const w of warnings) console.warn(`  - ${w}`);
  }

  if (errors.length > 0) {
    console.error(`❌ [lint-wiki] 发现 ${errors.length} 个错误:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(
    `✅ [lint-wiki] 巡检通过！8 大领域文件、全量文章索引、双链 [[wikilinks]] 与 {{short}} 道具宏 100% 合法。`
  );
}

runLint();

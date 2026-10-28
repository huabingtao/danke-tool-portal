#!/usr/bin/env node
/**
 * scripts/migrate-article-metadata.mjs
 * 
 * 作用：
 * 1. 扫描 danke-creator/my-articles-md/ 下全部文章 Markdown 文件。
 * 2. 依据目录结构自动在 Frontmatter 中添加标准 tag（如 "活动(activity)", "装备(equipment)", "宠物(pet)" 等）。
 * 3. 在 tags 数组中加入该 tag。
 * 4. 检查文章目录下的封面：如果根目录下没有 cover.png，但 dist/cover.png 或其他候选图存在，则自动复制到文章根目录为 cover.png。
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const ARTICLES_ROOT = path.resolve(PROJECT_ROOT, 'danke-creator/my-articles-md');

// 分类目录 -> 标准纯中文标签（去掉英文）
export const CATEGORY_TAG_MAP = {
  活动: '活动',
  event: '活动',
  限时好礼: '活动',
  数据奖励: '活动',
  装备: '装备',
  宠物: '宠物',
  特工: '特工',
  载具: '载具',
  配件: '配件',
  收藏品: '收藏品',
  公会: '公会',
  区域行动: '区域行动',
  逃离行动: '逃离行动',
  联机: '联机',
  版本更新: '版本更新',
  爆料: '爆料',
  其他: '答疑',
  特别行动: '特别行动',
  提醒: '提醒',
};

/**
 * 确保文章目录下有默认的 cover.png
 */
function ensureCoverPng(articleDir, category, articleDirName) {
  const rootCover = path.join(articleDir, 'cover.png');
  if (fs.existsSync(rootCover)) {
    return true;
  }

  // 候选查找列表
  const candidates = [
    path.join(articleDir, 'dist', 'cover.png'),
    path.join(articleDir, 'dist', 'cover_horizontal.png'),
    path.join(articleDir, 'dist', 'cover_v2.png'),
    path.join(articleDir, 'dist', 'cover_v4.png'),
    path.join(articleDir, 'cover.jpg'),
    path.join(articleDir, 'cover.jpeg'),
    path.join(articleDir, 'cover_horizontal.png'),
  ];

  // 针对日历提醒，复用共同系列封面
  if (category === '提醒') {
    candidates.push(
      path.resolve(ARTICLES_ROOT, '提醒/日历系列封面/dist/cover_calendar_series.png')
    );
  }

  for (const cand of candidates) {
    if (fs.existsSync(cand)) {
      try {
        fs.copyFileSync(cand, rootCover);
        return true;
      } catch (e) {
        // ignore
      }
    }
  }

  return false;
}

/**
 * 规范更新单个 Markdown 文件的 Frontmatter
 */
function updateMarkdownFrontmatter(filePath, standardTag, category, articleDirName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let updatedContent = content;

  const fmMatch = content.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]*/);
  if (fmMatch) {
    const rawFm = fmMatch[1];
    const restBody = content.slice(fmMatch[0].length);

    let lines = rawFm.split(/\r?\n/);
    let tagExists = false;
    let inTagsArray = false;
    let tagsList = [];
    let newLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 处理已有的 tag: 字段
      if (/^tag:\s*/.test(line)) {
        tagExists = true;
        newLines.push(`tag: "${standardTag}"`);
        continue;
      }

      // 处理 tags: 字段
      if (/^tags:\s*$/.test(line)) {
        inTagsArray = true;
        newLines.push(line);
        continue;
      } else if (/^tags:\s*\[(.*?)\]/.test(line)) {
        // 行内 tags 数组: tags: [a, b]
        const items = line
          .replace(/^tags:\s*\[/, '')
          .replace(/\]\s*$/, '')
          .split(',')
          .map((s) => s.trim().replace(/^["']|["']$/g, '').replace(/\([a-zA-Z-]+\)/g, ''))
          .filter(Boolean);
        const filtered = [standardTag, ...items.filter((t) => t !== standardTag)];
        newLines.push(`tags: [${filtered.map((t) => `"${t}"`).join(', ')}]`);
        continue;
      }

      if (inTagsArray) {
        if (/^\s*-\s*(.+)/.test(line)) {
          const val = line.replace(/^\s*-\s*/, '').trim().replace(/^["']|["']$/g, '').replace(/\([a-zA-Z-]+\)/g, '');
          tagsList.push(val);
          continue;
        } else {
          // tags 列表结束，在前面输出去重后的 tags 列表
          inTagsArray = false;
          const filtered = [standardTag, ...tagsList.filter((t) => t !== standardTag)];
          filtered.forEach((t) => newLines.push(`  - "${t}"`));
          tagsList = [];
          newLines.push(line);
          continue;
        }
      }

      newLines.push(line);
    }

    // 若原 tags 列表一直延伸到 frontmatter 末尾
    if (inTagsArray && tagsList.length > 0) {
      const filtered = [standardTag, ...tagsList.filter((t) => t !== standardTag)];
      filtered.forEach((t) => newLines.push(`  - "${t}"`));
    }

    // 若原 frontmatter 既没有 tag: 也没有 tags:
    if (!tagExists) {
      // 插入在 title: 后面，或者第一行
      const titleIndex = newLines.findIndex((l) => /^title:\s*/.test(l));
      if (titleIndex >= 0) {
        newLines.splice(titleIndex + 1, 0, `tag: "${standardTag}"`);
      } else {
        newLines.unshift(`tag: "${standardTag}"`);
      }
    }

    // 如果还没有 tags 属性，补上 tags:
    const hasTagsField = newLines.some((l) => /^tags:/.test(l));
    if (!hasTagsField) {
      newLines.push(`tags:`);
      newLines.push(`  - "${standardTag}"`);
      newLines.push(`  - "弹壳特攻队"`);
    }

    updatedContent = `---\n${newLines.join('\n')}\n---\n${restBody}`;
  } else {
    // 无 Frontmatter，根据首个标题或目录名创建 Frontmatter
    const h1Match = content.match(/^#+\s*(.+)$/m);
    const title = h1Match ? h1Match[1].replace(/[*`]/g, '').trim() : articleDirName;
    const newFm = [
      '---',
      `title: "${title.replace(/"/g, '\\"')}"`,
      `tag: "${standardTag}"`,
      'tags:',
      `  - "${standardTag}"`,
      '  - "弹壳特攻队"',
      'author: "弹壳呱呱"',
      '---',
      '',
    ].join('\n');
    updatedContent = `${newFm}${content}`;
  }

  if (updatedContent !== content) {
    fs.writeFileSync(filePath, updatedContent, 'utf-8');
    return true;
  }
  return false;
}

async function main() {
  console.log(`🚀 开始扫描并规范文章元数据与封面: ${ARTICLES_ROOT}...`);
  if (!fs.existsSync(ARTICLES_ROOT)) {
    console.error(`❌ 路径不存在: ${ARTICLES_ROOT}`);
    process.exit(1);
  }

  const categories = fs.readdirSync(ARTICLES_ROOT);
  let updatedMdCount = 0;
  let coverEnsuredCount = 0;
  let articleTotal = 0;

  for (const cat of categories) {
    const catDir = path.join(ARTICLES_ROOT, cat);
    if (!fs.statSync(catDir).isDirectory() || cat.startsWith('.')) continue;

    const standardTag = CATEGORY_TAG_MAP[cat] || `${cat}(misc)`;
    const articleDirs = fs.readdirSync(catDir);

    for (const art of articleDirs) {
      const artDir = path.join(catDir, art);
      if (!fs.statSync(artDir).isDirectory() || art.startsWith('.')) continue;
      articleTotal++;

      // 1. 确保 cover.png
      if (ensureCoverPng(artDir, cat, art)) {
        coverEnsuredCount++;
      }

      // 2. 更新文章目录下的 .md 文件
      const files = fs.readdirSync(artDir);
      for (const file of files) {
        if (
          file.endsWith('.md') &&
          !file.startsWith('.') &&
          !file.endsWith('_stage1.md') &&
          !file.endsWith('_stage2.md') &&
          !file.includes('copy')
        ) {
          const filePath = path.join(artDir, file);
          const changed = updateMarkdownFrontmatter(filePath, standardTag, cat, art);
          if (changed) {
            updatedMdCount++;
          }
        }
      }
    }
  }

  console.log(`\n🎉 规范完成！`);
  console.log(`- 扫描文章目录数: ${articleTotal}`);
  console.log(`- 成功就绪 cover.png 目录数: ${coverEnsuredCount}`);
  console.log(`- 更新规范 Frontmatter 的 Markdown 文件数: ${updatedMdCount}`);
}

main().catch(console.error);

import os
import re
import math
import yaml
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/skills", tags=["Skills Marketplace"])

SKILL_DIRECTORIES = [
    "/Users/hbt/my-project/skills",
    "/Users/hbt/.gemini/config/skills",
    "/Users/hbt/my-project/.agents/skills"
]

CATEGORY_RULES = {
    "content": {
        "label": "✍️ 内容创作",
        "icon": "PenTool",
        "color": "indigo",
        "keywords": ["创作", "写", "文案", "初稿", "润色", "写作", "人设", "简历", "humanizer", "polish", "prose", "writer", "creator", "content", "copy"]
    },
    "formatting": {
        "label": "🎨 排版美化",
        "icon": "Palette",
        "color": "purple",
        "keywords": ["美化", "排版", "格式化", "封面", "样式", "设计", "css", "theme", "cover", "format", "formatter", "design", "ui", "ux", "shadcn", "mermaid"]
    },
    "slicing": {
        "label": "🖼️ 图文切片",
        "icon": "Image",
        "color": "pink",
        "keywords": ["切图", "切片", "卡片", "3:4", "长图", "slice", "slicer", "card", "article-to-img", "to-img"]
    },
    "publishing": {
        "label": "🚀 自动发布",
        "icon": "Send",
        "color": "emerald",
        "keywords": ["发布", "推送", "草稿箱", "创作者", "上传", "publish", "publisher", "uploader", "sync", "douyin", "wechat", "bilibili", "kuaishou"]
    },
    "multimodal": {
        "label": "🎬 音视频处理",
        "icon": "Video",
        "color": "amber",
        "keywords": ["语音", "转录", "音频", "视频", "剪辑", "gif", "asr", "ffmpeg", "audio", "video", "summarize", "transcribe", "copy-analyzer", "noise"]
    },
    "utilities": {
        "label": "🛠️ 效率工具",
        "icon": "Wrench",
        "color": "blue",
        "keywords": ["搜索", "调研", "抓取", "爬虫", "ocr", "识字", "git", "兑换", "reach", "fetcher", "redeem", "pushing", "debug", "test", "teach", "research", "api", "mock"]
    }
}

OPEN_MARKET_SKILLS: List[Dict[str, Any]] = [
    # 1. 内容创作与文案 (Content)
    {
        "id": "seo-content-maximizer",
        "name": "seo-content-maximizer",
        "category": "content",
        "category_label": "✍️ 内容创作",
        "category_color": "indigo",
        "description": "SEO 关键词密度与 Google/百度搜寻意图优化器，智能植入 LSI 长尾词与结构化 FAQ Schema。",
        "tags": ["SEO", "搜索引擎", "长尾词", "排名优化"],
        "triggers": ["SEO优化", "搜索引擎优化", "关键词布局"],
        "icon_type": "PenTool",
        "author": "GrowthHacker",
        "downloads": 8700,
        "scripts": ["seo_scorer.py"],
        "prompt_template": "请使用技能【seo-content-maximizer】对文章进行 SEO 关键词布局与结构优化：\n",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "academic-paper-polisher",
        "name": "academic-paper-polisher",
        "category": "content",
        "category_label": "✍️ 内容创作",
        "category_color": "indigo",
        "description": "学术论文中英文深度润色，符合 IEEE/Nature 严谨学术规范，修正逻辑衔接与句式被动语态。",
        "tags": ["学术润色", "论文翻译", "SCI写作", "严谨句式"],
        "triggers": ["论文润色", "学术翻译", "改写论文"],
        "icon_type": "PenTool",
        "author": "ScholarAI Lab",
        "downloads": 11200,
        "scripts": ["paper_polish.py"],
        "prompt_template": "请使用技能【academic-paper-polisher】按照顶级期刊规范润色以下论文段落：\n",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "storytelling-scriptwriter",
        "name": "storytelling-scriptwriter",
        "category": "content",
        "category_label": "✍️ 内容创作",
        "category_color": "indigo",
        "description": "故事化叙事文案生成器，运用英雄之旅、反转伏笔与情绪共鸣曲线构建高引流故事篇章。",
        "tags": ["故事叙事", "情绪共鸣", "情节反转", "小说大纲"],
        "triggers": ["写个故事", "故事化文案", "情节设计"],
        "icon_type": "Sparkles",
        "author": "StoryCraft Studio",
        "downloads": 6400,
        "scripts": ["story_generator.py"],
        "prompt_template": "请使用技能【storytelling-scriptwriter】为以下核心主题构思一个充满戏剧冲突的故事化文案：\n",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "press-release-composer",
        "name": "press-release-composer",
        "category": "content",
        "category_label": "✍️ 内容创作",
        "category_color": "indigo",
        "description": "企业级公关新闻稿与产品发布官方通稿生成器，内置权威 5W1H 媒体金字塔倒叙结构。",
        "tags": ["新闻稿", "公关通稿", "产品发布", "企业宣传"],
        "triggers": ["新闻稿", "公关稿", "产品发布通稿"],
        "icon_type": "FileText",
        "author": "PR Master Group",
        "downloads": 4800,
        "scripts": ["pr_writer.py"],
        "prompt_template": "请使用技能【press-release-composer】编写一篇标准的企业公关新闻稿，要点如下：\n",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "newsletter-curator",
        "name": "newsletter-curator",
        "category": "content",
        "category_label": "✍️ 内容创作",
        "category_color": "indigo",
        "description": "科技/商业周刊 Newsletter 自动排版与内容策展，从多个资讯链接中提炼要点与独到点评。",
        "tags": ["周刊", "Newsletter", "内容策展", "资讯汇总"],
        "triggers": ["写周刊", "制作Newsletter", "周报整理"],
        "icon_type": "PenTool",
        "author": "WeeklyDigest",
        "downloads": 5600,
        "scripts": ["curate_newsletter.py"],
        "prompt_template": "请使用技能【newsletter-curator】将以下素材整理为一份精美专业的周刊 Newsletter：\n",
        "source_directory": "Open Market Registry"
    },

    # 2. 排版与视觉美化 (Formatting & Design)
    {
        "id": "mermaid-diagram-craft",
        "name": "mermaid-diagram-craft",
        "category": "formatting",
        "category_label": "🎨 排版美化",
        "category_color": "purple",
        "description": "将复杂文字逻辑一键转化为高颜值 Mermaid 流程图、时序图、甘特图与架构类图。",
        "tags": ["Mermaid", "流程图", "架构图", "可视化"],
        "triggers": ["画流程图", "生成架构图", "mermaid"],
        "icon_type": "Layout",
        "author": "架构师助手",
        "downloads": 15600,
        "scripts": ["mermaid_generator.js"],
        "prompt_template": "请使用技能【mermaid-diagram-craft】将以下业务逻辑转换为高颜值 Mermaid 流程架构图：\n",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "latex-formula-beautifier",
        "name": "latex-formula-beautifier",
        "category": "formatting",
        "category_label": "🎨 排版美化",
        "category_color": "purple",
        "description": "复杂数学/物理公式一键转为美观标准的 LaTeX 代码并输出高清晰度 SVG 图标。",
        "tags": ["LaTeX", "公式排版", "数学公式", "SVG生成"],
        "triggers": ["公式排版", "LaTeX公式", "数学公式转换"],
        "icon_type": "Palette",
        "author": "MathJax Pro",
        "downloads": 9800,
        "scripts": ["latex_to_svg.py"],
        "prompt_template": "请使用技能【latex-formula-beautifier】将以下数学描述转换为标准 LaTeX 公式：\n",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "css-gradient-palette-hub",
        "name": "css-gradient-palette-hub",
        "category": "formatting",
        "category_label": "🎨 排版美化",
        "category_color": "purple",
        "description": "现代 UI 高级 HSL 渐变与色彩搭配规范系统，输出 Tailwind 与 CSS Tokens 样式。",
        "tags": ["渐变配色", "CSS", "UI设计", "Tailwind"],
        "triggers": ["配色方案", "渐变生成", "UI色彩规范"],
        "icon_type": "Palette",
        "author": "ColorLab UI",
        "downloads": 7200,
        "scripts": ["palette_generator.py"],
        "prompt_template": "请使用技能【css-gradient-palette-hub】为主题提供 3 套高级渐变配色与 CSS 规则：",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "markdown-table-formatter",
        "name": "markdown-table-formatter",
        "category": "formatting",
        "category_label": "🎨 排版美化",
        "category_color": "purple",
        "description": "多列复杂 Markdown 表格对齐、格式优化与内联数据统计高亮样式增强。",
        "tags": ["Markdown表格", "表格美化", "对齐优化", "数据排版"],
        "triggers": ["美化表格", "表格对齐", "格式化表格"],
        "icon_type": "Layout",
        "author": "DocTools",
        "downloads": 6100,
        "scripts": ["format_table.py"],
        "prompt_template": "请使用技能【markdown-table-formatter】对以下 Markdown 表格进行对齐与排版优化：\n",
        "source_directory": "Open Market Registry"
    },

    # 3. 图文切片与卡片生成 (Slicing & Card Gen)
    {
        "id": "quote-gold-card-generator",
        "name": "quote-gold-card-generator",
        "category": "slicing",
        "category_label": "🖼️ 图文切片",
        "category_color": "pink",
        "description": "将文章核心金句或书摘自动提炼并排版为极简高颜值社交媒体分享卡片。",
        "tags": ["金句卡片", "书摘打卡", "视觉海报", "社交分享"],
        "triggers": ["金句卡片", "生成书摘卡片", "分享海报"],
        "icon_type": "Scissors",
        "author": "CardMaker Pro",
        "downloads": 8900,
        "scripts": ["make_quote_card.py"],
        "prompt_template": "请使用技能【quote-gold-card-generator】将这段文字中提炼金句并制作视觉分享卡片：\n",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "github-readme-card-maker",
        "name": "github-readme-card-maker",
        "category": "slicing",
        "category_label": "🖼️ 图文切片",
        "category_color": "pink",
        "description": "生成 GitHub 个人主页与开源项目专用的动态统计卡片、技术栈徽章与架构概览图。",
        "tags": ["GitHub卡片", "Readme美化", "徽章生成", "开源主页"],
        "triggers": ["GitHub卡片", "美化Readme", "技术栈徽章"],
        "icon_type": "Crop",
        "author": "DevBadges",
        "downloads": 10400,
        "scripts": ["generate_badges.py"],
        "prompt_template": "请使用技能【github-readme-card-maker】为以下项目生成精美的 Readme 状态卡片：",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "product-spec-sheet-slicer",
        "name": "product-spec-sheet-slicer",
        "category": "slicing",
        "category_label": "🖼️ 图文切片",
        "category_color": "pink",
        "description": "电子产品与数码硬件规格参数长图切片、关键卖点提炼与横向对比卡片生成。",
        "tags": ["产品参数", "对比卡片", "长图切片", "数码测评"],
        "triggers": ["产品参数图", "生成对比卡片", "硬件规格切片"],
        "icon_type": "Scissors",
        "author": "TechSpec Lab",
        "downloads": 4300,
        "scripts": ["slice_spec_sheet.py"],
        "prompt_template": "请使用技能【product-spec-sheet-slicer】将以下产品参数整理为高清对比切片卡片：\n",
        "source_directory": "Open Market Registry"
    },

    # 4. 自动化发布与跨平台同步 (Publishing)
    {
        "id": "kuaishou-publisher-skill",
        "name": "kuaishou-publisher-skill",
        "category": "publishing",
        "category_label": "🚀 自动发布",
        "category_color": "emerald",
        "description": "快手创作者服务平台图文与短视频一键自动化发布与定时草稿保存。",
        "tags": ["快手", "创作者服务", "自动发布", "短视频"],
        "triggers": ["发布到快手", "快手草稿", "kuaishou publish"],
        "icon_type": "Send",
        "author": "跨平台发布阵列",
        "downloads": 4300,
        "scripts": ["kuaishou_upload.py"],
        "prompt_template": "请使用技能【kuaishou-publisher-skill】将内容发布至快手创作者平台。",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "zhihu-column-sync",
        "name": "zhihu-column-sync",
        "category": "publishing",
        "category_label": "🚀 自动发布",
        "category_color": "emerald",
        "description": "知乎专栏文章与问答草稿箱一键格式适配转换、公式渲染与自动保存发布。",
        "tags": ["知乎", "知乎专栏", "问答同步", "自动发布"],
        "triggers": ["发布到知乎", "知乎专栏同步", "zhihu sync"],
        "icon_type": "Send",
        "author": "ZhihuSync Bot",
        "downloads": 6700,
        "scripts": ["zhihu_poster.py"],
        "prompt_template": "请使用技能【zhihu-column-sync】将文章适配并同步发布到知乎草稿箱。",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "weibo-microblog-poster",
        "name": "weibo-microblog-poster",
        "category": "publishing",
        "category_label": "🚀 自动发布",
        "category_color": "emerald",
        "description": "微博头条文章与图集九宫格自动化定时发布，支持长文本断句与话题超话标签添加。",
        "tags": ["微博", "头条文章", "九宫格", "定时发布"],
        "triggers": ["发微博", "微博头条发布", "weibo post"],
        "icon_type": "Send",
        "author": "Microblog AI",
        "downloads": 5200,
        "scripts": ["weibo_publisher.py"],
        "prompt_template": "请使用技能【weibo-microblog-poster】将内容格式化并发布至微博：",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "rss-feed-distributor",
        "name": "rss-feed-distributor",
        "category": "publishing",
        "category_label": "🚀 自动发布",
        "category_color": "emerald",
        "description": "基于 RSS Feed 订阅源的文章自动监测、内容提炼与多平台自动分发推送。",
        "tags": ["RSS", "自动分发", "订阅源", "Webhook"],
        "triggers": ["RSS分发", "自动同步RSS", "文章分发"],
        "icon_type": "Send",
        "author": "Syndication Hub",
        "downloads": 4900,
        "scripts": ["rss_distributor.py"],
        "prompt_template": "请使用技能【rss-feed-distributor】配置 RSS 自动分发流水线。",
        "source_directory": "Open Market Registry"
    },

    # 5. 音视频多模态处理 (Multimodal)
    {
        "id": "audio-noise-cleaner",
        "name": "audio-noise-cleaner",
        "category": "multimodal",
        "category_label": "🎬 音视频处理",
        "category_color": "amber",
        "description": "AI 语音降噪与环境背景杂音消除，自动提升人声清澈度，适配播客与口播短视频。",
        "tags": ["语音降噪", "人声增强", "音频清洗", "播客"],
        "triggers": ["音频降噪", "消除杂音", "人声增强"],
        "icon_type": "Mic",
        "author": "AudioAI Pro",
        "downloads": 8700,
        "scripts": ["denoise_audio.py"],
        "prompt_template": "请使用技能【audio-noise-cleaner】对录音进行 AI 降噪与人声清晰度增强：",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "podcast-shownotes-generator",
        "name": "podcast-shownotes-generator",
        "category": "multimodal",
        "category_label": "🎬 音视频处理",
        "category_color": "amber",
        "description": "根据播客音频逐字稿自动提取精美 ShowNotes、重点时间戳 (Timestamps) 与嘉宾金句。",
        "tags": ["播客", "ShowNotes", "时间戳", "金句提取"],
        "triggers": ["生成ShowNotes", "播客时间轴", "播客总结"],
        "icon_type": "FileVideo",
        "author": "PodcastCraft",
        "downloads": 6100,
        "scripts": ["gen_shownotes.py"],
        "prompt_template": "请使用技能【podcast-shownotes-generator】为以下播客转录文本生成标准 ShowNotes 与时间戳：\n",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "subtitles-srt-translator",
        "name": "subtitles-srt-translator",
        "category": "multimodal",
        "category_label": "🎬 音视频处理",
        "category_color": "amber",
        "description": "视频外挂字幕 (.srt / .vtt) 高精度时间轴双语对照翻译与断句规范化。",
        "tags": ["字幕翻译", "SRT字幕", "双语字幕", "时间轴对齐"],
        "triggers": ["翻译字幕", "SRT翻译", "双语字幕生成"],
        "icon_type": "Film",
        "author": "SubTranslator",
        "downloads": 9300,
        "scripts": ["translate_srt.py"],
        "prompt_template": "请使用技能【subtitles-srt-translator】对以下 SRT 字幕内容进行高质量双语翻译：\n",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "tts-voiceover-generator",
        "name": "tts-voiceover-generator",
        "category": "multimodal",
        "category_label": "🎬 音视频处理",
        "category_color": "amber",
        "description": "本地/云端高拟真文本转自然语音 (TTS)，支持多情感音色、停顿标记与语速调节。",
        "tags": ["TTS", "语音合成", "配音生成", "口播合成"],
        "triggers": ["文本转语音", "生成配音", "TTS配音"],
        "icon_type": "Mic",
        "author": "VoiceGen AI",
        "downloads": 11800,
        "scripts": ["tts_synthesize.py"],
        "prompt_template": "请使用技能【tts-voiceover-generator】将文案合成为自然流畅的口播语音：",
        "source_directory": "Open Market Registry"
    },

    # 6. 效率与研发工具 (Utilities)
    {
        "id": "deep-researcher",
        "name": "deep-researcher",
        "category": "utilities",
        "category_label": "🛠️ 效率工具",
        "category_color": "blue",
        "description": "多引擎递归深度调研 Agent，自动抓取并交叉比对 10+ 篇深度研报，生成万字权威行业调研报告。",
        "tags": ["研报", "行业调研", "深度搜索", "Agent"],
        "triggers": ["深度研报", "行业调研", "deep research"],
        "icon_type": "Globe",
        "author": "OpenAgent Lab",
        "downloads": 18500,
        "scripts": ["research_engine.py"],
        "prompt_template": "请使用技能【deep-researcher】针对以下主题进行多源交叉深度行业调研：\n",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "json-api-contract-mock",
        "name": "json-api-contract-mock",
        "category": "utilities",
        "category_label": "🛠️ 效率工具",
        "category_color": "blue",
        "description": "根据前端界面或业务需求自动推导 RESTful / GraphQL API 契约与高质量 Mock 数据。",
        "tags": ["API", "Mock", "JSON", "契约测试"],
        "triggers": ["生成Mock", "设计API", "接口契约"],
        "icon_type": "Wrench",
        "author": "全栈Dev",
        "downloads": 8400,
        "scripts": ["generate_mock.py"],
        "prompt_template": "请使用技能【json-api-contract-mock】为以下业务设计标准的 JSON API 契约与 Mock 数据：",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "git-changelog-generator",
        "name": "git-changelog-generator",
        "category": "utilities",
        "category_label": "🛠️ 效率工具",
        "category_color": "blue",
        "description": "自动解析 Git Commit 提交历史与 PR 记录，生成规范的 Release Notes 与版本变更日志。",
        "tags": ["Git", "Changelog", "Release Notes", "版本管理"],
        "triggers": ["生成更新日志", "Changelog", "发布版本说明"],
        "icon_type": "GitBranch",
        "author": "DevOps Hub",
        "downloads": 7600,
        "scripts": ["gen_changelog.py"],
        "prompt_template": "请使用技能【git-changelog-generator】为以下 Git 提交记录生成结构化的版本更新日志：\n",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "pdf-table-extractor",
        "name": "pdf-table-extractor",
        "category": "utilities",
        "category_label": "🛠️ 效率工具",
        "category_color": "blue",
        "description": "复杂扫描版 PDF 文档中表格与财务报表高精度数据提取，直接导出为 Excel/CSV 格式。",
        "tags": ["PDF提取", "表格识别", "数据清洗", "报表转换"],
        "triggers": ["提取PDF表格", "PDF转Excel", "扫描件表格提取"],
        "icon_type": "ScanText",
        "author": "DataMining Pro",
        "downloads": 9900,
        "scripts": ["extract_pdf_tables.py"],
        "prompt_template": "请使用技能【pdf-table-extractor】从以下 PDF 文本中提取结构化表格数据：\n",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "regex-pattern-wizard",
        "name": "regex-pattern-wizard",
        "category": "utilities",
        "category_label": "🛠️ 效率工具",
        "category_color": "blue",
        "description": "自然语言直出高准确度正则表达式，附带测试用例、边界条件分析与代码示例。",
        "tags": ["正则表达式", "Regex", "文本匹配", "规则提取"],
        "triggers": ["写正则", "正则表达式", "regex 生成"],
        "icon_type": "Wrench",
        "author": "RegexWizard",
        "downloads": 12100,
        "scripts": ["test_regex.py"],
        "prompt_template": "请使用技能【regex-pattern-wizard】帮我编写并解释满足以下匹配规则的正则表达式：",
        "source_directory": "Open Market Registry"
    },
    {
        "id": "dockerfile-optimizer",
        "name": "dockerfile-optimizer",
        "category": "utilities",
        "category_label": "🛠️ 效率工具",
        "category_color": "blue",
        "description": "分析现有 Dockerfile 进行多阶段构建、构建缓存命中优化与镜像体积极致瘦身。",
        "tags": ["Docker", "镜像优化", "多阶段构建", "DevOps"],
        "triggers": ["优化Dockerfile", "Docker瘦身", "镜像构建优化"],
        "icon_type": "Wrench",
        "author": "CloudNative Lab",
        "downloads": 6800,
        "scripts": ["lint_dockerfile.py"],
        "prompt_template": "请使用技能【dockerfile-optimizer】对以下 Dockerfile 进行体积瘦身与多阶段构建优化：\n",
        "source_directory": "Open Market Registry"
    }
]


def classify_skill(name: str, desc: str, tags: List[str]) -> str:
    combined_text = f"{name} {desc} {' '.join(tags)}".lower()

    if any(k in combined_text for k in ["publish", "发布", "草稿箱", "上传"]):
        return "publishing"
    if any(k in combined_text for k in ["切图", "切片", "article-to-img", "image-slicer"]):
        return "slicing"
    if any(k in combined_text for k in ["排版", "美化", "封面", "cover", "format", "css"]):
        return "formatting"
    if any(k in combined_text for k in ["asr", "语音", "视频", "video", "ffmpeg", "gif", "transcribe"]):
        return "multimodal"
    if any(k in combined_text for k in ["写攻略", "创作", "初稿", "润色", "文案", "humanizer", "polish", "prose", "writer"]):
        return "content"

    for cat_id, cat_info in CATEGORY_RULES.items():
        for kw in cat_info["keywords"]:
            if kw.lower() in combined_text:
                return cat_id

    return "utilities"


def scan_local_skills() -> List[Dict[str, Any]]:
    discovered_skills: Dict[str, Dict[str, Any]] = {}

    for base_dir in SKILL_DIRECTORIES:
        if not os.path.exists(base_dir):
            continue

        for item in sorted(os.listdir(base_dir)):
            # Skip xiaohongshu skills
            if "xiaohongshu" in item.lower() or "xhs" in item.lower():
                continue

            skill_path = os.path.join(base_dir, item)
            skill_md = os.path.join(skill_path, "SKILL.md")

            if os.path.isdir(skill_path) and os.path.exists(skill_md):
                try:
                    with open(skill_md, "r", encoding="utf-8") as f:
                        raw_content = f.read()

                    meta = {}
                    body = raw_content

                    match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", raw_content, re.DOTALL)
                    if match:
                        meta_yaml = match.group(1)
                        body = match.group(2)
                        meta = yaml.safe_load(meta_yaml) or {}

                    skill_name = meta.get("name") or item
                    # Skip xiaohongshu name/desc
                    if "xiaohongshu" in skill_name.lower() or "小红书" in skill_name:
                        continue

                    skill_desc = meta.get("description") or ""
                    tags = meta.get("tags") or []
                    if isinstance(tags, str):
                        tags = [t.strip() for t in tags.split(",") if t.strip()]

                    category_key = classify_skill(skill_name, skill_desc, tags)

                    # List available scripts
                    scripts = []
                    scripts_dir = os.path.join(skill_path, "scripts")
                    if os.path.exists(scripts_dir):
                        scripts = [s for s in os.listdir(scripts_dir) if s.endswith((".py", ".sh", ".js"))]

                    # Map appropriate icon
                    icon_type = "Terminal"
                    if category_key == "content":
                        icon_type = "PenTool"
                    elif category_key == "formatting":
                        icon_type = "Palette"
                    elif category_key == "slicing":
                        icon_type = "Scissors"
                    elif category_key == "publishing":
                        icon_type = "Send"
                    elif category_key == "multimodal":
                        icon_type = "Video"
                    elif category_key == "utilities":
                        icon_type = "Wrench"

                    prompt_template = f"请使用技能【{skill_name}】协助我处理创作任务：\n"

                    skill_info = {
                        "id": skill_name,
                        "name": skill_name,
                        "description": skill_desc.strip(),
                        "category": category_key,
                        "category_label": CATEGORY_RULES.get(category_key, {}).get("label", "🛠️ 效率工具"),
                        "category_color": CATEGORY_RULES.get(category_key, {}).get("color", "blue"),
                        "tags": tags,
                        "triggers": tags or [skill_name],
                        "path": skill_path,
                        "scripts": scripts,
                        "icon_type": icon_type,
                        "prompt_template": prompt_template,
                        "content_preview": body[:400].strip(),
                        "source_directory": base_dir
                    }

                    # Deduplicate favoring user project directory
                    if skill_name not in discovered_skills or "my-project/skills" in base_dir:
                        discovered_skills[skill_name] = skill_info

                except Exception as e:
                    print(f"⚠ Warning: Failed to parse skill {skill_md}: {e}")

    return list(discovered_skills.values())


@router.get("")
def list_skills(
    source: str = Query("local", description="技能来源: 'local' (本地扫描) 或 'market' (开放广场)"),
    category: str = Query("all", description="用途分类: all, content, formatting, slicing, publishing, multimodal, utilities"),
    query: Optional[str] = Query(None, description="搜索关键词"),
    page: int = Query(1, ge=1, description="当前页码，从 1 开始"),
    size: int = Query(9, ge=1, le=50, description="每页展示数量，默认 9 (3x3 网格)")
):
    # 1. Select source pool
    if source == "market":
        raw_pool = OPEN_MARKET_SKILLS
    else:
        raw_pool = scan_local_skills()

    # 2. Filter by search query across name, description, tags, triggers
    filtered_by_query = raw_pool
    if query and query.strip():
        q = query.strip().lower()
        filtered_by_query = [
            s for s in raw_pool
            if q in s.get("name", "").lower()
            or q in s.get("description", "").lower()
            or any(q in str(t).lower() for t in s.get("tags", []))
            or any(q in str(trig).lower() for t in s.get("triggers", []) for trig in ([t] if isinstance(t, str) else []))
        ]

    # 3. Calculate category counts based on search query pool
    categories_summary = {
        "all": len(filtered_by_query)
    }
    for cat_key in CATEGORY_RULES.keys():
        categories_summary[cat_key] = len([s for s in filtered_by_query if s.get("category") == cat_key])

    # 4. Filter by category
    final_filtered = filtered_by_query
    if category and category != "all":
        final_filtered = [s for s in filtered_by_query if s.get("category") == category]

    total_count = len(final_filtered)
    total_pages = max(1, math.ceil(total_count / size))
    current_page = min(page, total_pages) if total_count > 0 else 1

    # 5. Apply pagination slice
    start_idx = (current_page - 1) * size
    end_idx = start_idx + size
    paged_skills = final_filtered[start_idx:end_idx]

    return {
        "total": total_count,
        "page": current_page,
        "size": size,
        "total_pages": total_pages,
        "source": source,
        "categories": [
            {"id": "all", "label": "全部用途", "count": categories_summary["all"], "color": "slate"},
            {"id": "content", "label": "✍️ 内容创作", "count": categories_summary["content"], "color": "indigo"},
            {"id": "formatting", "label": "🎨 排版美化", "count": categories_summary["formatting"], "color": "purple"},
            {"id": "slicing", "label": "🖼️ 图文切片", "count": categories_summary["slicing"], "color": "pink"},
            {"id": "publishing", "label": "🚀 自动发布", "count": categories_summary["publishing"], "color": "emerald"},
            {"id": "multimodal", "label": "🎬 音视频处理", "count": categories_summary["multimodal"], "color": "amber"},
            {"id": "utilities", "label": "🛠️ 效率工具", "count": categories_summary["utilities"], "color": "blue"},
        ],
        "skills": paged_skills
    }


@router.get("/{skill_name}")
def get_skill_detail(skill_name: str):
    all_local = scan_local_skills()
    skill = next((s for s in all_local if s["name"] == skill_name or s["id"] == skill_name), None)

    if not skill:
        skill = next((s for s in OPEN_MARKET_SKILLS if s["name"] == skill_name or s["id"] == skill_name), None)

    if not skill:
        raise HTTPException(status_code=404, detail=f"未找到技能: {skill_name}")

    if "path" in skill and os.path.exists(skill["path"]):
        skill_md = os.path.join(skill["path"], "SKILL.md")
        full_markdown = ""
        if os.path.exists(skill_md):
            with open(skill_md, "r", encoding="utf-8") as f:
                full_markdown = f.read()
        skill["full_markdown"] = full_markdown
    else:
        skill["full_markdown"] = f"# {skill['name']}\n\n{skill['description']}\n\n## 支持的触发词\n" + ", ".join(skill.get("triggers", []))

    return skill

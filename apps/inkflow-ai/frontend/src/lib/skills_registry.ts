export interface StaticSkill {
  id: string;
  name: string;
  category: 'content' | 'formatting' | 'slicing' | 'publishing' | 'multimodal' | 'utilities';
  categoryLabel: string;
  description: string;
  triggers: string[];
  iconType: string;
  color: string;
  author?: string;
  downloads?: number;
  promptTemplate?: string;
}

export interface SkillCategoryTab {
  id: string;
  label: string;
  icon: string;
}

export const SKILL_CATEGORIES: SkillCategoryTab[] = [
  { id: 'all', label: '全部用途', icon: 'Layers' },
  { id: 'content', label: '✍️ 内容创作', icon: 'PenTool' },
  { id: 'formatting', label: '🎨 排版美化', icon: 'Palette' },
  { id: 'slicing', label: '🖼️ 图文切片', icon: 'Image' },
  { id: 'publishing', label: '🚀 自动发布', icon: 'Send' },
  { id: 'multimodal', label: '🎬 音视频处理', icon: 'Video' },
  { id: 'utilities', label: '🛠️ 效率工具', icon: 'Wrench' },
];

// 本地默认内置与已启用的技能列表
export const INITIAL_INSTALLED_SKILLS: StaticSkill[] = [
  // 1. 内容创作
  {
    id: 'danke-content-creator-skill',
    name: 'danke-content-creator-skill',
    category: 'content',
    categoryLabel: '内容创作',
    description: '分析游戏活动原始素材（截图/文本/数据），按标准 YAML Frontmatter 生成结构化初稿 攻略.md。',
    triggers: ['写攻略', '生成攻略', '分析活动', 'danke content'],
    iconType: 'PenTool',
    color: 'indigo',
    author: '官方精选',
    downloads: 1240,
    promptTemplate: '请调用技能【danke-content-creator-skill】，分析以下活动素材并按标准模板生成初稿：\n'
  },
  {
    id: 'article-polish',
    name: 'article-polish',
    category: 'content',
    categoryLabel: '内容创作',
    description: '文章润色、校对与格式标准化。优化语气自然度、去除AI味，修正中英文空格及标点。',
    triggers: ['文章润色', '润色', '优化文笔', '校对'],
    iconType: 'Sparkles',
    color: 'indigo',
    author: '官方精选',
    downloads: 980,
    promptTemplate: '请使用技能【article-polish】帮我润色以下内容，提升表达自然度并标准化格式：\n'
  },
  {
    id: 'humanizer-zh',
    name: 'humanizer-zh',
    category: 'content',
    categoryLabel: '内容创作',
    description: '去除文本中的 AI 生成痕迹，消除破折号泛滥与空洞词汇，使其更自然、更像人类真实手笔。',
    triggers: ['去AI味', '人类语气', '文风润色', '去味'],
    iconType: 'UserCheck',
    color: 'indigo',
    author: '开源社区',
    downloads: 2150,
    promptTemplate: '请使用技能【humanizer-zh】消除以下文本的AI生成痕迹，用自然地道的人类笔触重写：\n'
  },
  {
    id: 'resume-writer',
    name: 'resume-writer',
    category: 'content',
    categoryLabel: '内容创作',
    description: '基于项目实际技术亮点与业务场景，生成结构化、高命中率的定制简历项目经历（中英文）。',
    triggers: ['写简历', '项目经历', '优化简历', 'resume'],
    iconType: 'FileText',
    color: 'indigo',
    author: '效率工坊',
    downloads: 870,
    promptTemplate: '请使用技能【resume-writer】，结合以下项目要点生成高质量的简历项目经历：\n'
  },

  // 2. 排版美化
  {
    id: 'danke-strategy-skill',
    name: 'danke-strategy-skill',
    category: 'formatting',
    categoryLabel: '排版美化',
    description: '专为攻略提供全自动美化排版与内联 CSS 编译，支持正则数值高亮、剥离无序列表加粗与 img:// 图标简写。',
    triggers: ['美化攻略', '排版', '微信排版', '微信转换'],
    iconType: 'Palette',
    color: 'purple',
    author: '官方精选',
    downloads: 1650,
    promptTemplate: '请使用技能【danke-strategy-skill】对当前攻略进行排版美化并生成微信公众号内联HTML。'
  },
  {
    id: 'wechat-article-formatter',
    name: 'wechat-article-formatter',
    category: 'formatting',
    categoryLabel: '排版美化',
    description: '将 Markdown 文章转换为适配微信公众号的排版格式，应用专业 CSS 样式与代码高亮。',
    triggers: ['美化文章', '转换为HTML', '优化公众号格式'],
    iconType: 'Layout',
    color: 'purple',
    author: '排版专家',
    downloads: 3400,
    promptTemplate: '请使用技能【wechat-article-formatter】将以下 Markdown 文章排版转换为微信美化格式：\n'
  },
  {
    id: 'wechat-cover-generator',
    name: 'wechat-cover-generator',
    category: 'formatting',
    categoryLabel: '排版美化',
    description: '基于行像素方差自动识别视觉重心，生成 2.35:1 微信横版封面与 3:4 竖版发光描边双行标题封面。',
    triggers: ['生成封面', '制作封面', '做个封面', '微信封面'],
    iconType: 'Image',
    color: 'purple',
    author: '视觉实验室',
    downloads: 1890,
    promptTemplate: '请使用技能【wechat-cover-generator】为这篇文章制作封面，标题为：'
  },

  // 3. 图文切片
  {
    id: 'article-to-img-skill',
    name: 'article-to-img-skill',
    category: 'slicing',
    categoryLabel: '图文切片',
    description: '直接渲染微信原生 HTML 网页，按 3:4 (1080x1440) 比例带 DOM 缝隙防切字避让切图，自动生成高清图集。',
    triggers: ['公众号生成切图', '文章转图文', '直接切图'],
    iconType: 'Scissors',
    color: 'pink',
    author: '官方精选',
    downloads: 1420,
    promptTemplate: '请调用技能【article-to-img-skill】将当前文章切成 3:4 原生网页高清图集。'
  },
  {
    id: 'image-slicer',
    name: 'image-slicer',
    category: 'slicing',
    categoryLabel: '图文切片',
    description: '基于连通域分析 (CCA) 的自动化精灵图与图标合集切片工具，自动分割并裁剪小图标。',
    triggers: ['我要切图', '帮我切图', '切图', '图片切片'],
    iconType: 'Crop',
    color: 'pink',
    author: '图像工坊',
    downloads: 650,
    promptTemplate: '请使用技能【image-slicer】对素材图片进行连通域图标智能切图。'
  },

  // 4. 自动发布
  {
    id: 'wechat-publisher-skill',
    name: 'wechat-publisher-skill',
    category: 'publishing',
    categoryLabel: '自动发布',
    description: '将编译好的 _wechat.html 一键发布至公众号草稿箱，支持 MD5 图片去重缓存与 MediaID 增量覆盖更新。',
    triggers: ['发布微信草稿', '推送到公众号', '微信发布', 'publish wechat'],
    iconType: 'Send',
    color: 'emerald',
    author: '官方精选',
    downloads: 1530,
    promptTemplate: '请使用技能【wechat-publisher-skill】将当前文章发布到微信公众号草稿箱。'
  },
  {
    id: 'douyin-publisher-skill',
    name: 'douyin-publisher-skill',
    category: 'publishing',
    categoryLabel: '自动发布',
    description: '将 3:4 切图集与短标题文案通过无头浏览器自动上传至抖音创作者后台草稿箱。',
    triggers: ['发布到抖音', '上传抖音', '抖音草稿', 'douyin publish'],
    iconType: 'Share2',
    color: 'emerald',
    author: '官方精选',
    downloads: 1100,
    promptTemplate: '请使用技能【douyin-publisher-skill】将切图集与文案上传至抖音草稿箱。'
  },
  {
    id: 'bilibili-publisher-skill',
    name: 'bilibili-publisher-skill',
    category: 'publishing',
    categoryLabel: '自动发布',
    description: '将 3:4 切图集与攻略元数据自动上传至 B站 (哔哩哔哩) 创作者中心草稿箱。',
    triggers: ['发布到B站', '上传B站', 'B站草稿', 'bilibili publish'],
    iconType: 'Tv',
    color: 'emerald',
    author: '官方精选',
    downloads: 820,
    promptTemplate: '请使用技能【bilibili-publisher-skill】将图集上传至B站创作者中心草稿箱。'
  },

  // 5. 音视频多模态
  {
    id: 'asr',
    name: 'asr',
    category: 'multimodal',
    categoryLabel: '音视频处理',
    description: '使用本地语音识别引擎 (SenseVoice) 离线秒级转录音频文件为精准文字。',
    triggers: ['转录', '语音转文字', 'ASR', '识别音频'],
    iconType: 'Mic',
    color: 'amber',
    author: 'AI 实验室',
    downloads: 4200,
    promptTemplate: '请使用技能【asr】将这段录音转录为文字：'
  },
  {
    id: 'video-copy-analyzer',
    name: 'video-copy-analyzer',
    category: 'multimodal',
    categoryLabel: '音视频处理',
    description: '视频文案分析一站式工具，支持下载在线短视频、语音高速转录并进行爆款结构三维拆解。',
    triggers: ['视频分析', '文案分析', '爆款分析', '提取视频内容'],
    iconType: 'FileVideo',
    color: 'amber',
    author: '爆款研究社',
    downloads: 1670,
    promptTemplate: '请使用技能【video-copy-analyzer】深度分析这个短视频文案结构：'
  },
  {
    id: 'video-to-gif',
    name: 'video-to-gif',
    category: 'multimodal',
    categoryLabel: '音视频处理',
    description: '将 MP4/MOV 等视频高质量转换为带体积压缩约束的 GIF 动图。',
    triggers: ['转gif', '制作gif', '视频转gif', 'make video to gif'],
    iconType: 'Film',
    color: 'amber',
    author: '多媒体中心',
    downloads: 1490,
    promptTemplate: '请使用技能【video-to-gif】将视频转换为轻量高品质 GIF 动图。'
  },
  {
    id: 'ffmpeg',
    name: 'ffmpeg',
    category: 'multimodal',
    categoryLabel: '音视频处理',
    description: '音视频底层处理工具，支持格式转换、分辨率缩放、音频提取与体积压缩。',
    triggers: ['格式转换', '提取音频', '压缩视频', 'ffmpeg'],
    iconType: 'Sliders',
    color: 'amber',
    author: '系统工具',
    downloads: 5100,
    promptTemplate: '请使用技能【ffmpeg】对以下音视频进行格式转换与处理：'
  },

  // 6. 效率工具
  {
    id: 'agent-reach',
    name: 'agent-reach',
    category: 'utilities',
    categoryLabel: '效率工具',
    description: '跨平台全网深度调研与搜索工具，支持推特、B站、Reddit、知乎与任意网页信息获取。',
    triggers: ['全网调研', '帮我调研一下', '搜搜', '查一下'],
    iconType: 'Globe',
    color: 'blue',
    author: '开源社区',
    downloads: 8900,
    promptTemplate: '请使用技能【agent-reach】在全网范围内深度调研以下话题：'
  },
  {
    id: 'paddleocr-text-recognition',
    name: 'paddleocr-text-recognition',
    category: 'utilities',
    categoryLabel: '效率工具',
    description: '高精度 OCR 图像识字工具，支持提取截图、扫描件中的中英文字符与坐标框。',
    triggers: ['OCR', '文字识别', '图片转文字', '截图识字'],
    iconType: 'ScanText',
    color: 'blue',
    author: '百度飞桨',
    downloads: 3200,
    promptTemplate: '请使用技能【paddleocr-text-recognition】识别并提取这张图片里的所有文字：'
  },
  {
    id: 'danke-redeem-skill',
    name: 'danke-redeem-skill',
    category: 'utilities',
    categoryLabel: '效率工具',
    description: '批量自动兑换游戏官网礼包码，内置离线图形验证码识别，支持导入玩家ID列表。',
    triggers: ['批量兑换', '兑换礼包码', '兑换码批量', 'danke redeem'],
    iconType: 'Gift',
    color: 'blue',
    author: '游戏辅助',
    downloads: 940,
    promptTemplate: '请使用技能【danke-redeem-skill】执行批量礼包码兑换任务。'
  },
  {
    id: 'git-pushing',
    name: 'git-pushing',
    category: 'utilities',
    categoryLabel: '效率工具',
    description: '自动暂存所有代码改动，生成规范的 Conventional Commit 提交信息并推送到远程仓库。',
    triggers: ['push this', 'commit and push', '保存到github', '推送到远程'],
    iconType: 'GitBranch',
    color: 'blue',
    author: 'DevOps工具',
    downloads: 6200,
    promptTemplate: '请使用技能【git-pushing】将当前修改提交并推送至远端分支。'
  },
];

// 🌐 开放技能发现广场（可探索并一键安装到本地）
export const EXPLORE_SKILLS_MARKET: StaticSkill[] = [
  {
    id: 'deep-researcher',
    name: 'deep-researcher',
    category: 'utilities',
    categoryLabel: '效率工具',
    description: '多引擎递归深度调研 Agent，自动抓取并交叉比对 10+ 篇深度研报，生成万字权威行业调研报告。',
    triggers: ['深度研报', '行业调研', 'deep research'],
    iconType: 'Globe',
    color: 'blue',
    author: 'OpenAgent Lab',
    downloads: 14500,
    promptTemplate: '请使用技能【deep-researcher】针对以下主题进行多源交叉深度行业调研：\n'
  },
  {
    id: 'seo-content-maximizer',
    name: 'seo-content-maximizer',
    category: 'content',
    categoryLabel: '内容创作',
    description: 'SEO 关键词密度与 Google/百度搜寻意图优化器，智能植入 LSI 长尾词与结构化 FAQ Schema。',
    triggers: ['SEO优化', '搜索引擎优化', '关键词布局'],
    iconType: 'PenTool',
    color: 'indigo',
    author: 'GrowthHacker',
    downloads: 8700,
    promptTemplate: '请使用技能【seo-content-maximizer】对文章进行 SEO 关键词布局与结构优化：\n'
  },
  {
    id: 'mermaid-diagram-craft',
    name: 'mermaid-diagram-craft',
    category: 'formatting',
    categoryLabel: '排版美化',
    description: '将复杂文字逻辑一键转化为高颜值 Mermaid 流程图、时序图、甘特图与架构类图。',
    triggers: ['画流程图', '生成架构图', 'mermaid'],
    iconType: 'Layout',
    color: 'purple',
    author: '架构师助手',
    downloads: 9600,
    promptTemplate: '请使用技能【mermaid-diagram-craft】将以下业务逻辑转换为高颜值 Mermaid 流程架构图：\n'
  },
  {
    id: 'audio-noise-cleaner',
    name: 'audio-noise-cleaner',
    category: 'multimodal',
    categoryLabel: '音视频处理',
    description: 'AI 语音降噪与环境背景杂音消除，自动提升人声清澈度，适配播客与口播短视频。',
    triggers: ['音频降噪', '消除杂音', '人声增强'],
    iconType: 'Mic',
    color: 'amber',
    author: 'AudioAI Pro',
    downloads: 6700,
    promptTemplate: '请使用技能【audio-noise-cleaner】对录音进行 AI 降噪与人声清晰度增强：'
  },
  {
    id: 'kuaishou-publisher-skill',
    name: 'kuaishou-publisher-skill',
    category: 'publishing',
    categoryLabel: '自动发布',
    description: '快手创作者服务平台图文与短视频一键自动化发布与定时草稿保存。',
    triggers: ['发布到快手', '快手草稿', 'kuaishou publish'],
    iconType: 'Send',
    color: 'emerald',
    author: '跨平台发布阵列',
    downloads: 4300,
    promptTemplate: '请使用技能【kuaishou-publisher-skill】将内容发布至快手创作者平台。'
  },
  {
    id: 'json-api-contract-mock',
    name: 'json-api-contract-mock',
    category: 'utilities',
    categoryLabel: '效率工具',
    description: '根据前端界面或业务需求自动推导 RESTful / GraphQL API 契约与高质量 Mock 数据。',
    triggers: ['生成Mock', '设计API', '接口契约'],
    iconType: 'Wrench',
    color: 'blue',
    author: '全栈Dev',
    downloads: 7100,
    promptTemplate: '请使用技能【json-api-contract-mock】为以下业务设计标准的 JSON API 契约与 Mock 数据：'
  }
];

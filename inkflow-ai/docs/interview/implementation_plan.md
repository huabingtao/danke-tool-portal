# Implementation Plan: Sidebar Streamlining & Collapsible Right Panel

按照您最新的语音指示与Bug修复要求，我们将系统进行深度优化与精简：

---

## 🎨 界面与功能变更清单

```
┌─────────────────┬──────────────────────────────────┬─────────────────────────────┐
│ 1. 左侧导航栏   │ 2. 中间对话栏                     │ 3. 右侧【文件管理】收起/展开│
│  - 去除“聊天”   │  - 移除了输入框处的渠道下拉菜单  │  - 展开状态 (320px):        │
│    全局导航页签 │    (项目类型已在新建时确定)      │    展示完整文件树/搜索/下载 │
│  - 保留“技能”   │  - AI 模型下拉框精简:            │  - 收起状态 (56px 窄栏):    │
│  - 保留“项目列表│    仅保留 DeepSeek V4 Flash &    │    隐藏文字，仅保留 📁 📥   │
│    (支持重命名) │    DeepSeek V4 Pro              │    图标，点击平滑展开/收起  │
│                 │  - 🐛 修复 Bug: 点击任意空白处   │                             │
│                 │    自动关闭模型选择下拉框窗口    │                             │
└─────────────────┴──────────────────────────────────┴─────────────────────────────┘
```

---

## 🛠️ 核心变更点

### 1. 左侧栏调整 (`LeftSidebar.tsx`)
- **移除“聊天”页签**: 导航栏仅保留 **技能**（后续对接收集 Skill 平台）。
- **新建项目关联**: 新建项目时支持选定 `wechat` / `xiaohongshu` / `video_script` / `general` 创作类型。

### 2. 中间对话框与 AI 模型选择器 (`ChatPanel.tsx`)
- **移除渠道下拉框**: 输入框底部不再放置多余的“创作渠道下拉框”，避免与项目创作类型冲突。
- **精简 AI 模型选择器**: 仅保留目前已上线的 `DeepSeek V4 Flash` (默认推荐) 与 `DeepSeek V4 Pro` (深度推理)。移除未配置的 OpenAI / Claude 选项。
- **🐛 修复点击空白关闭浮窗 Bug**: 增加 click-outside 事件监听，当用户点击下拉框以外的任何空白处时，立刻自动收起模型选择弹出窗。

### 3. 右侧【文件管理】折叠/展开抽屉 (`FileManagerPanel.tsx` & `page.tsx`)
- **展开/收起状态 (Collapsed State)**:
  - 放置 `[ ≫ ]` 收起图标按钮。
  - 点击收起后，右侧栏宽度平滑过渡到 **`56px`** 极简窄栏，隐藏文件名与长文本，仅保留 📁 文件夹图标、📥 上传图标与 🔄 刷新图标。
  - 点击 📁 图标或 `[ ≪ ]` 按钮，右侧栏平滑展开回 **`320px`** 完整视图。

---

## 📋 Proposed Changes

### Frontend Components

#### [MODIFY] [frontend/src/components/LeftSidebar.tsx](file:///Users/hbt/my-project/apps/inkflow-ai/frontend/src/components/LeftSidebar.tsx)
- 移除“聊天”全局导航页签，仅保留“技能”页签与项目列表。

#### [MODIFY] [frontend/src/components/ChatPanel.tsx](file:///Users/hbt/my-project/apps/inkflow-ai/frontend/src/components/ChatPanel.tsx)
- 移除输入框渠道下拉菜单。
- AI 模型下拉框精简为 DeepSeek V4 Flash & DeepSeek V4 Pro。
- 增加 useRef + click-outside 监听器，点击空白区域自动关闭弹窗。

#### [MODIFY] [frontend/src/components/FileManagerPanel.tsx](file:///Users/hbt/my-project/apps/inkflow-ai/frontend/src/components/FileManagerPanel.tsx)
- 新增 `isCollapsed` 状态与折叠/展开切换按钮，实现 320px 与 56px 宽度的平滑收起展开。

---

## 🧪 Verification Plan

### Manual Verification
1. 检查左侧栏，确认“聊天”页签已被移除，仅保留技能与项目列表。
2. 检查中间栏 AI 模型选择器，确认只展示 DeepSeek 选项；点击外部空白处，下拉窗自动收起。
3. 点击右侧栏右上角的收起图标 `[ ≫ ]`，右侧栏收缩为 56px 极简图标窄栏；点击 📁 图标后展开回 320px。

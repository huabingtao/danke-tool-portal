# Workspace Guidelines & Long-Term Memory (工作区常驻规则与长期记忆)

## 技能体系架构与代码管理规范 (Skills Architecture)

### 1. 自研技能唯一真理源 (Single Source of Truth)
- **唯一仓库位置**：本地 `/Users/hbt/skills`，技能源码位于 `/Users/hbt/skills/skills/<skill_name>`。
- **Git 远程仓库**：`git@github.com:huabingtao/skills.git`（主分支：`main`）。
- **禁止操作**：严禁向历史独立的单技能 GitHub 仓库（如 `huabingtao/danke-strategy-skill.git`、`huabingtao/douyin-publisher-skill.git` 等）推送代码，这些独立仓库已被官方归档为只读。
- **开发与同步**：所有自研技能（共 17 个）的任何代码优化、功能增强与日常维护，统一在 `/Users/hbt/skills` 中进行版本管理并推送到 `huabingtao/skills.git`。

### 2. 全局配置目录 (~/.gemini/config/skills)
- **第三方技能**：从社区或三方渠道下载的技能（如 `agent-reach`, `impeccable`, `shadcn`, `ui-ux-pro-max`, `brainstorming`, `paddleocr-text-recognition` 等）作为**实体物理目录**直接保留在全局配置中。
- **自研技能**：所有自研技能一律以**符号软链接（`ln -s`）**形式接入全局，直连 `/Users/hbt/skills/skills/<skill_name>`。
- **防冲突规则**：严禁在全局目录下创建同名物理副本或保留废弃备份/同步工具（如 `image-slicer`, `video-summarizer`, `danke-strategy-skill.backup`, `danke-strategy-sync` 均已清理）。

### 3. 工程内部关联 (my-project/skills)
- **目录形态**：`my-project/skills` 采用指向 `../skills/skills`（即 `/Users/hbt/skills/skills`）的**相对软链接**。
- **Git 子模块规范**：`my-project` 主仓库不再记录任何自研技能的独立 Git 子模块（Submodule），彻底杜绝旧的 160000 提交指针与推送报错。
- **无缝操作**：进入 `my-project/skills/<skill>` 目录操作时（如 `git status`, `git remote -v`, `git push`），由于处于 `huabingtao/skills` 的源码树中，将直接同步至 `huabingtao/skills.git`。
- **历史安全备份**：改造前的完整技能历史备份存放在 `/Users/hbt/my-project/skills_backup_20260918`，受 `.gitignore` 忽略保护。

### 4. 敏感凭证与本地缓存
- 微信公众号草稿发布配置 `wechat-publisher-skill/scripts/config.json` 与各本地缓存（`.wechat_*_cache.json`）存放在本地自研库对应技能目录下，受 `.gitignore` 保护，严禁公开或清除。

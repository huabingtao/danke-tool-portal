# 技能体系与自研技能管理规范 (Skills Architecture Specification)

## 1. 核心架构与代码真理源 (Single Source of Truth)
- **自研技能唯一 Monorepo 仓库**：
  - 本地路径：`/Users/hbt/skills`（技能源码统一位于 `/Users/hbt/skills/skills/<skill_name>`）
  - Git 远程仓库：`git@github.com:huabingtao/skills.git`（主分支：`main`）
  - 严禁向历史独立的单技能 GitHub 仓库（如 `huabingtao/danke-strategy-skill.git`、`huabingtao/douyin-publisher-skill.git` 等）推送代码，这些独立仓库均已归档为只读。
  - 所有自研技能（包含 17 个自研技能）的代码开发、Bug 修复、功能新增与版本迭代，必须统一在 `/Users/hbt/skills` 中提交并推送到 `huabingtao/skills.git`。

## 2. 全局配置目录 (~/.gemini/config/skills)
- **第三方渠道技能**：
  - 从社区/三方渠道下载的技能（如 `agent-reach`, `impeccable`, `shadcn`, `ui-ux-pro-max`, `brainstorming`, `paddleocr-text-recognition` 等）作为**实体物理目录**直接存放在 `~/.gemini/config/skills`。
- **自研技能**：
  - 所有自研技能一律以**符号软链接（`ln -s`）**形式接入全局，直连 `/Users/hbt/skills/skills/<skill_name>`。
  - 严禁在全局目录下创建自研技能的实体物理副本，严禁保留已废弃的备份目录或同步工具（如 `image-slicer`, `video-summarizer`, `danke-strategy-skill.backup`, `danke-strategy-sync` 已被彻底清理）。
  - 在自研仓库中新增技能时，需同步在 `~/.gemini/config/skills/` 建立软链接。

## 3. 工作区工程 (my-project/skills)
- **目录链接与组织**：
  - `my-project/skills` 采用指向 `../skills/skills`（即 `/Users/hbt/skills/skills`）的**相对软链接**。
  - `my-project` 主仓库不再记录任何自研技能的独立 Git 子模块（Submodule），彻底杜绝旧的 160000 提交指针与只读归档仓库推送报错。
  - 在 `my-project/skills/<skill>` 目录下操作（如 `git status`, `git remote -v`, `git push`）时，Git 会自动向上查找到 `/Users/hbt/skills/.git`，直接同步至 `huabingtao/skills.git`。
- **历史备份**：
  - 改造前的历史技能物理备份安全存放于 `/Users/hbt/my-project/skills_backup_20260918`，并在 `.gitignore` 中受保护，不污染主仓库。

## 4. 敏感凭证与本地缓存规范
- 微信发布凭证配置文件 `wechat-publisher-skill/scripts/config.json` 与各发布缓存（如 `.wechat_token_cache.json`, `.wechat_draft_cache.json` 等）存放在本地 `/Users/hbt/skills/skills/` 对应技能目录下，受 `.gitignore` 严格保护，确保自动化草稿发布与图片缓存正常运行且不外泄。

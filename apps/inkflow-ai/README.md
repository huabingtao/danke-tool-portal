# InkFlow AI - 本地优先的 AI 内容创作与排版平台 MVP

InkFlow AI 是一个专门面向“微信公众号文章”与“小红书图文卡片”创作、排版与发布的 AI 内容平台 MVP。

## 🌟 核心特性

1. **AI 生成引擎 (DeepSeek API 集成)**：
   - 结构化 Prompt 强制输出 JSON 格式（5个候选标题、文章大纲、Markdown 正文）。
2. **RAG 向量检索 (ChromaDB)**：
   - 本地轻量化向量存储与 Chunk 检索，动态注入历史相关素材上下文。
3. **Docker 沙箱运行器 (Skill 执行)**：
   - 本地 Docker SDK 隔离运行自定义格式化与发布 Skill 脚本，支持网络与环境变量权限配置。
4. **长短期记忆管理**：
   - 短期对话上下文 (Chat History) + 长期用户偏好 (SQLite 持久化)，打造专属写作风格。
5. **本地优先与云原生支持 (Local-First)**：
   - 数据统一持久化在指定 `DATA_DIR`（默认 `data/` 目录），通过 Docker Compose 一键一卷挂载无缝部署。
6. **现代化 UI 界面**：
   - Next.js + Tailwind CSS 打造分栏可视化交互界面，支持公众号 HTML 排版预览和小红书 3:4 图文卡片实时渲染。

## 🚀 快速启动

### 环境变量设置

复制 `.env.example` 到 `.env` 并填写您的 DeepSeek API Key：

```bash
cp .env.example .env
```

在 `.env` 中设置：
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DATA_DIR=./data
```

### 方案 1：使用 Docker Compose 一键启动 (推荐)

```bash
docker-compose up -d --build
```
访问前端界面：`http://localhost:3000`
后端 API 文档：`http://localhost:8000/docs`

### 方案 2：本地开发环境启动

#### 后端 (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

#### 前端 (Next.js)
```bash
cd frontend
npm install
npm run dev
```

## 📁 目录结构

```
apps/inkflow-ai/
├── docker-compose.yml
├── .env.example
├── data/                    # 本地数据持久化目录 (SQLite, ChromaDB, 沙箱临时文件)
├── backend/                 # Python FastAPI 后端服务
│   ├── app/
│   │   ├── api/            # REST API 路由 (generate, rag, memory, skills)
│   │   ├── services/       # 核心业务逻辑 (deepseek, rag, sandbox, memory)
│   │   ├── database.py     # SQLite 数据库连接
│   │   ├── models.py       # SQLAlchemy 模型
│   │   └── schemas.py      # Pydantic 校验模型
│   ├── config.py           # 配置读取
│   ├── main.py             # FastAPI 入口
│   └── requirements.txt
└── frontend/                # Next.js 14 前端应用
    ├── src/
    │   ├── app/            # App Router 页面
    │   ├── components/     # 控制面板与渲染组件
    │   └── lib/            # API 请求辅助库
    └── tailwind.config.js
```

import json
import re
from openai import OpenAI
from config import settings
from app.schemas import GeneratedArticleJSON

class DeepSeekService:
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = settings.DEEPSEEK_BASE_URL
        self.model = settings.DEEPSEEK_MODEL

    def _get_client(self) -> OpenAI:
        if not self.api_key or self.api_key == "your_deepseek_api_key_here":
            # Fallback mock/warning if API key not set yet
            raise ValueError("DEEPSEEK_API_KEY 未配置，请在 .env 中填写有效的 API Key。")
        return OpenAI(api_key=self.api_key, base_url=self.base_url)

    def generate_content(
        self,
        topic: str,
        platform: str = "wechat",
        style_preference: str = "",
        rag_contexts: list[str] = None,
        chat_history: list[dict] = None
    ) -> GeneratedArticleJSON:
        client = self._get_client()

        # Build System Prompt with JSON Schema constraint
        platform_name = "微信公众号长文" if platform == "wechat" else "小红书图文笔记卡片"
        
        system_prompt = f"""你是一个顶尖的 AI 内容创作大师，专门精通【{platform_name}】爆款文章创作与优雅排版。

【强制输出规则】
必须且只能返回合法的 JSON 对象，格式如下：
{{
  "titles": ["标题1", "标题2", "标题3", "标题4", "标题5"],
  "outline": ["1. 章节大纲", "2. 章节大纲", ...],
  "content": "# 文章标题\\n\\nMarkdown 格式的正文..."
}}

【创作规范】
1. `titles`: 提供5个极具吸引力、点击率高、符合{platform_name}特点的候选爆款标题。
2. `outline`: 拆解出清晰、逻辑连贯的3-6个主要章节大纲。
3. `content`: 使用 Markdown 语法撰写高质量正文。若是微信公众号，注意段落层次与重点加粗；若是小红书，注重语气亲切、多用 Emoji 列表、包含实用干货与适当标签(#话题)。
"""

        if style_preference:
            system_prompt += f"\n【用户文风喜好】\n{style_preference}\n"

        if rag_contexts:
            context_str = "\n---\n".join(rag_contexts)
            system_prompt += f"\n【参考背景知识库(RAG)】\n{context_str}\n"

        messages = [{"role": "system", "content": system_prompt}]

        # Inject chat history short-term memory if available
        if chat_history:
            for msg in chat_history[-6:]:  # Last 6 turns
                messages.append({"role": msg["role"], "content": msg["content"]})

        user_prompt = f"请围绕主题【{topic}】为我生成一篇高赞{platform_name}内容。"
        messages.append({"role": "user", "content": user_prompt})

        # API Call with JSON response_format and model fallback
        target_model = settings.DEEPSEEK_MODEL or "deepseek-v4-flash"
        try:
            response = client.chat.completions.create(
                model=target_model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=3500
            )
        except Exception as e:
            fallback_model = "deepseek-chat" if target_model != "deepseek-chat" else "deepseek-v4-flash"
            response = client.chat.completions.create(
                model=fallback_model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=3500
            )

        raw_content = response.choices[0].message.content
        return self._parse_json_response(raw_content)

    def _parse_json_response(self, raw_text: str) -> GeneratedArticleJSON:
        """Parse raw DeepSeek text into Pydantic model with JSON repair logic."""
        cleaned = raw_text.strip()
        # Clean markdown code block wraps if present
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            # Fallback regex extraction if JSON is slightly malformed
            json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if json_match:
                data = json.loads(json_match.group(0))
            else:
                raise ValueError(f"无法解析 DeepSeek 返回的 JSON 格式: {raw_text[:200]}")

        # Ensure titles list has 5 elements
        titles = data.get("titles", [])
        while len(titles) < 5:
            titles.append(f"推荐标题 #{len(titles)+1}: {data.get('content', '')[:15]}...")

        return GeneratedArticleJSON(
            titles=titles[:5],
            outline=data.get("outline", ["1. 引言", "2. 核心内容", "3. 总结"]),
            content=data.get("content", "# 文章正文\n\n生成内容解析失败。")
        )

deepseek_service = DeepSeekService()

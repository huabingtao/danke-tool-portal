import json
import re
from typing import List, Dict, Any, Optional
from openai import OpenAI
from config import settings
from app.schemas import GeneratedArticleJSON

SUPPORTED_MODELS = {
    "deepseek-v4-flash": "DeepSeek V4 Flash (极速高性价比)",
    "deepseek-v4-pro": "DeepSeek V4 Pro (深度推理)",
    "gpt-4o": "OpenAI GPT-4o (通用旗舰)",
    "claude-3-5-sonnet": "Claude 3.5 Sonnet (文采创作)"
}

class AIService:
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = settings.DEEPSEEK_BASE_URL
        self.default_model = settings.DEEPSEEK_MODEL

    def _get_client(self) -> OpenAI:
        if not self.api_key or self.api_key == "your_deepseek_api_key_here":
            raise ValueError("DEEPSEEK_API_KEY 未配置，请在 .env 中填写有效的 API Key。")
        return OpenAI(api_key=self.api_key, base_url=self.base_url)

    def chat_dialogue_stream(
        self,
        user_message: str,
        model: str = "deepseek-v4-flash",
        style_preference: str = "",
        rag_contexts: List[str] = None,
        chat_history: List[Dict[str, str]] = None
    ):
        """Streaming generator for multi-turn AI chat dialogue."""
        client = self._get_client()
        system_prompt = "你是一个全能助手与顶尖内容创作搭档。根据用户的需求提供深刻、严谨、有洞察力的回答。"
        if style_preference:
            system_prompt += f"\n【用户个人偏好】\n{style_preference}\n"
        if rag_contexts:
            system_prompt += f"\n【知识库参考上下文】\n" + "\n---\n".join(rag_contexts)

        messages = [{"role": "system", "content": system_prompt}]
        if chat_history:
            for msg in chat_history[-6:]:
                messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": user_message})

        actual_model = model if model in SUPPORTED_MODELS else self.default_model
        try:
            stream = client.chat.completions.create(
                model=actual_model,
                messages=messages,
                temperature=0.7,
                max_tokens=2500,
                stream=True
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception:
            stream = client.chat.completions.create(
                model="deepseek-v4-flash",
                messages=messages,
                temperature=0.7,
                max_tokens=2500,
                stream=True
            )
            for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

    def generate_content(
        self,
        topic: str,
        platform: str = "wechat",
        model: str = "deepseek-v4-flash",
        style_preference: str = "",
        rag_contexts: List[str] = None,
        chat_history: List[Dict[str, str]] = None
    ) -> GeneratedArticleJSON:
        client = self._get_client()

        if platform == "wechat":
            platform_name = "微信公众号长文"
        elif platform == "video_script":
            platform_name = "短视频口播与分镜脚本"
        else:
            platform_name = "通用专业内容"

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
3. `content`: 使用 Markdown 语法撰写高质量正文。若是微信公众号，注意段落层次与重点加粗，适合内联 CSS 排版；若是短视频脚本，请包含【画面/分镜描述】与【口播文案】双栏对照。
"""
        if style_preference:
            system_prompt += f"\n【用户文风喜好】\n{style_preference}\n"
        if rag_contexts:
            context_str = "\n---\n".join(rag_contexts)
            system_prompt += f"\n【参考背景知识库(RAG)】\n{context_str}\n"

        messages = [{"role": "system", "content": system_prompt}]
        if chat_history:
            for msg in chat_history[-6:]:
                messages.append({"role": msg["role"], "content": msg["content"]})

        user_prompt = f"请围绕主题【{topic}】为我生成一篇高赞{platform_name}内容。"
        messages.append({"role": "user", "content": user_prompt})

        target_model = model if model in SUPPORTED_MODELS else self.default_model

        try:
            response = client.chat.completions.create(
                model=target_model,
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=3500
            )
        except Exception:
            response = client.chat.completions.create(
                model="deepseek-v4-flash",
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=3500
            )

        raw_content = response.choices[0].message.content
        return self._parse_json_response(raw_content, topic=topic)

    def _parse_json_response(self, raw_text: str, topic: str = "") -> GeneratedArticleJSON:
        cleaned = raw_text.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        data = None
        # 1. Direct JSON parse attempt
        try:
            data = json.loads(cleaned)
        except Exception:
            pass

        # 2. Regex JSON block extraction attempt
        if not data:
            json_match = re.search(r'\{.*\}', cleaned, re.DOTALL)
            if json_match:
                try:
                    data = json.loads(json_match.group(0))
                except Exception:
                    pass

        # 3. Sanitized JSON parse attempt (fix unescaped newlines/quotes in string fields)
        if not data:
            try:
                # Replace unescaped control chars
                sanitized = re.sub(r'[\x00-\x1F\x7F]', '', cleaned)
                data = json.loads(sanitized)
            except Exception:
                pass

        # 4. Regex extraction for specific keys
        if not data:
            titles = []
            outline = []
            content = raw_text

            title_match = re.search(r'"titles"\s*:\s*\[(.*?)\]', cleaned, re.DOTALL)
            if title_match:
                found_titles = re.findall(r'"([^"]+)"', title_match.group(1))
                if found_titles:
                    titles = found_titles

            content_match = re.search(r'"content"\s*:\s*"(.*)"', cleaned, re.DOTALL)
            if content_match:
                content = content_match.group(1).replace('\\n', '\n').replace('\\"', '"')

            if titles or content != raw_text:
                data = {"titles": titles, "outline": outline, "content": content}

        # 5. Ultra-robust Fallback if model returned plain conversational text
        if not data:
            default_topic = topic if topic else "创意主题"
            data = {
                "titles": [
                    f"围绕「{default_topic}」的精选解析",
                    f"【深度剖析】{default_topic}",
                    f"{default_topic} 全景探索与指南",
                    f"{default_topic} 核心知识框架",
                    f"爆款视角：{default_topic}"
                ],
                "outline": ["1. 核心阐述", "2. 详细分析", "3. 总结与应用"],
                "content": raw_text
            }

        titles = data.get("titles", [])
        if not isinstance(titles, list):
            titles = [str(titles)]
        while len(titles) < 5:
            prefix_topic = topic if topic else "热点推荐"
            titles.append(f"【{prefix_topic}】候选爆款标题 #{len(titles)+1}")

        outline = data.get("outline", ["1. 引言", "2. 核心分析", "3. 总结"])
        if not isinstance(outline, list):
            outline = [str(outline)]

        content = data.get("content", raw_text)
        if not isinstance(content, str):
            content = str(content)

        return GeneratedArticleJSON(
            titles=[str(t) for t in titles[:5]],
            outline=[str(o) for o in outline],
            content=content
        )

ai_service = AIService()

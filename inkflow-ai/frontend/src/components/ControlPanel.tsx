'use client';

import React, { useState } from 'react';
import { Send, Upload, Settings, Brain, BookOpen, Layers, Terminal, CheckCircle2 } from 'lucide-react';
import { GenerateParams, uploadRagDocument } from '@/lib/api';

interface ControlPanelProps {
  onGenerate: (params: GenerateParams) => void;
  onRunSkill: (skillId: string) => void;
  isLoading: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onGenerate,
  onRunSkill,
  isLoading,
}) => {
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<'wechat' | 'video_script' | 'general'>('wechat');
  const [style, setStyle] = useState('专业爆款、干货满满、段落明快');
  const [enableRag, setEnableRag] = useState(true);
  const [enableMemory, setEnableMemory] = useState(true);

  // RAG upload state
  const [ragTitle, setRagTitle] = useState('');
  const [ragContent, setRagContent] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onGenerate({
      topic,
      platform,
      style,
      enable_rag: enableRag,
      enable_memory: enableMemory,
    });
  };

  const handleUploadKnowledge = async () => {
    if (!ragTitle || !ragContent) return;
    try {
      const res = await uploadRagDocument(ragTitle, ragContent);
      setUploadSuccess(`已成功切片索引 ${res.chunks_created} 个向量数据包！`);
      setRagTitle('');
      setRagContent('');
      setTimeout(() => setUploadSuccess(''), 4000);
    } catch (err: any) {
      alert(err.message || '上传知识库失败');
    }
  };

  return (
    <div className="w-full lg:w-[420px] shrink-0 bg-white border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto max-h-[calc(100vh-61px)]">
      {/* Platform Switcher */}
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
          1. 选择目标创作平台
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPlatform('wechat')}
            className={`p-3.5 rounded-xl border font-medium text-sm flex flex-col gap-1 items-start transition-all ${
              platform === 'wechat'
                ? 'border-blue-600 bg-blue-50/60 text-blue-700 shadow-sm ring-1 ring-blue-500/30'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="font-bold flex items-center gap-1.5">
              🟢 微信公众号
            </span>
            <span className="text-xs text-slate-500">深度长文 / 排版精美</span>
          </button>

          <button
            type="button"
            onClick={() => setPlatform('video_script')}
            className={`p-3.5 rounded-xl border font-medium text-sm flex flex-col gap-1 items-start transition-all ${
              platform === 'video_script'
                ? 'border-blue-600 bg-blue-50/60 text-blue-700 shadow-sm ring-1 ring-blue-500/30'
                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <span className="font-bold flex items-center gap-1.5">
              🎬 视频分镜脚本
            </span>
            <span className="text-xs text-slate-500">口播文案 / 画面分镜</span>
          </button>
        </div>
      </div>

      {/* Main Topic Input */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            2. 创作主题与关键词
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="例如：2026智能家居选购指南，突出避坑指南与实用品牌对比..."
            rows={4}
            className="w-full rounded-xl border border-slate-200 p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
          />
        </div>

        {/* Tone & Style */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
            3. 文风与Tone设置
          </label>
          <input
            type="text"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            placeholder="如：干货满分、幽默接地气、结论先行"
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Toggles: RAG & Memory */}
        <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-slate-700">RAG 知识库向量注入 (Chroma)</span>
            </div>
            <input
              type="checkbox"
              checked={enableRag}
              onChange={(e) => setEnableRag(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-xs font-semibold text-slate-700">长期记忆风格注入 (SQLite)</span>
            </div>
            <input
              type="checkbox"
              checked={enableMemory}
              onChange={(e) => setEnableMemory(e.target.checked)}
              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
            />
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>DeepSeek 思考与创作中...</span>
            </div>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>一键生成爆款内容 (JSON 结构化)</span>
            </>
          )}
        </button>
      </form>

      <hr className="border-slate-200" />

      {/* RAG Knowledge Ingestion Section */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>📚 RAG 向量知识库上传</span>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">ChromaDB</span>
        </label>
        
        {uploadSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <input
          type="text"
          value={ragTitle}
          onChange={(e) => setRagTitle(e.target.value)}
          placeholder="素材标题（如：以往高赞文章参考）"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
        />
        <textarea
          value={ragContent}
          onChange={(e) => setRagContent(e.target.value)}
          placeholder="粘贴想要作为知识库索引的参考文本或 Markdown 正文..."
          rows={3}
          className="w-full rounded-lg border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 resize-none"
        />
        <button
          type="button"
          onClick={handleUploadKnowledge}
          disabled={!ragTitle.trim() || !ragContent.trim()}
          className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>切片并建立向量索引</span>
        </button>
      </div>

      <hr className="border-slate-200" />

      {/* Docker Sandbox Skill Execution Quick Actions */}
      <div className="flex flex-col gap-2.5">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
          <span>🛡️ Docker 沙箱 Skill 运行器</span>
          <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Python Container</span>
        </label>
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => onRunSkill('wechat_html_formatter')}
            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-xs font-medium flex items-center gap-2 transition-all text-left"
          >
            <Terminal className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900">执行公众号 HTML 美化 Skill</div>
              <div className="text-[10px] text-slate-500">在 Docker 隔离沙箱中运行 Python 格式化逻辑</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onRunSkill('xiaohongshu_card_generator')}
            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-300 text-slate-700 text-xs font-medium flex items-center gap-2 transition-all text-left"
          >
            <Layers className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900">执行小红书卡片切片 Skill</div>
              <div className="text-[10px] text-slate-500">生成 3:4 比例卡片 JSON 数据架构</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

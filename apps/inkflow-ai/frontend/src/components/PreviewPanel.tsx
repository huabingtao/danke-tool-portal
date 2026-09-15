'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { GenerateResult } from '@/lib/api';
import { WeChatFormatter } from './WeChatFormatter';
import { XhsCardViewer } from './XhsCardViewer';
import { FileText, Layout, ListChecks, Code, Layers, Sparkles, Database, Terminal } from 'lucide-react';

interface PreviewPanelProps {
  data: GenerateResult | null;
  platform: 'wechat' | 'video_script' | 'general';
  skillOutput?: string;
  isLoading: boolean;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  data,
  platform,
  skillOutput,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'titles' | 'outline' | 'markdown' | 'skill'>('preview');
  const [selectedTitleIdx, setSelectedTitleIdx] = useState(0);

  if (isLoading) {
    return (
      <div className="flex-1 bg-slate-50 p-8 flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <h3 className="text-lg font-bold text-slate-800">DeepSeek 正在全力创作中...</h3>
        <p className="text-sm text-slate-500 mt-1">正在应用向量检索 (RAG) 与风格记忆，进行 JSON 结构化计算...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 bg-slate-50/50 p-8 flex flex-col items-center justify-center min-h-[500px] border-l border-slate-200 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4 border border-blue-100">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">开始创作您的首篇爆款内容</h3>
        <p className="text-sm text-slate-500 max-w-md mt-2 leading-relaxed">
          请在左侧输入创作主题与参数。系统将调用 DeepSeek 强制输出结构化 JSON 数据，并通过本地 ChromaDB 检索增强与 Docker 沙箱为您排版。
        </p>
      </div>
    );
  }

  const currentTitle = data.titles[selectedTitleIdx] || data.titles[0] || '默认标题';

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-[calc(100vh-61px)] overflow-hidden">
      {/* RAG Banner if used */}
      {data.rag_context_used && data.rag_context_used.length > 0 && (
        <div className="bg-blue-600 text-white text-xs px-6 py-2 flex items-center gap-2 font-medium">
          <Database className="w-3.5 h-3.5" />
          <span>已从本地 Chroma 知识库中检索并注入 3 段关联矢量片段：</span>
          <span className="truncate opacity-90">{data.rag_context_used[0].slice(0, 60)}...</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="bg-white border-b border-slate-200 px-6 pt-3 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('preview')}
          className={`pb-3 px-3.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'preview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>{platform === 'wechat' ? '微信排版预览' : '小红书卡片预览'}</span>
        </button>

        <button
          onClick={() => setActiveTab('titles')}
          className={`pb-3 px-3.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'titles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>爆款标题 ({data.titles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('outline')}
          className={`pb-3 px-3.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'outline'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          <span>核心大纲 ({data.outline.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('markdown')}
          className={`pb-3 px-3.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
            activeTab === 'markdown'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Markdown 正文</span>
        </button>

        {skillOutput && (
          <button
            onClick={() => setActiveTab('skill')}
            className={`pb-3 px-3.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'skill'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4 text-purple-600" />
            <span>沙箱 Skill 输出</span>
          </button>
        )}
      </div>

      {/* Main Content Viewport */}
      <div className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-120px)]">
        {/* TAB 1: Visual Platform Preview */}
        {activeTab === 'preview' && (
          <div>
            <WeChatFormatter content={data.content} />
          </div>
        )}

        {/* TAB 2: Titles Candidates */}
        {activeTab === 'titles' && (
          <div className="max-w-2xl mx-auto flex flex-col gap-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              🔥 DeepSeek 生成的 5 款爆款标题 (点击选中)
            </h3>
            <div className="flex flex-col gap-3">
              {data.titles.map((title, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedTitleIdx(idx)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedTitleIdx === idx
                      ? 'border-blue-600 bg-blue-50/80 text-blue-900 shadow-sm font-bold ring-1 ring-blue-500/30'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm">{title}</span>
                  </div>
                  {selectedTitleIdx === idx && (
                    <span className="text-xs px-2.5 py-1 rounded-md bg-blue-600 text-white font-medium">
                      当前选中
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Outline View */}
        {activeTab === 'outline' && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              📋 结构化大纲架构
            </h3>
            <div className="flex flex-col gap-3">
              {data.outline.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Raw Markdown */}
        {activeTab === 'markdown' && (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-sm prose prose-slate">
            <ReactMarkdown>{data.content}</ReactMarkdown>
          </div>
        )}

        {/* TAB 5: Sandbox Skill Output */}
        {activeTab === 'skill' && skillOutput && (
          <div className="max-w-3xl mx-auto bg-slate-900 text-slate-100 p-6 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto shadow-2xl">
            <div className="text-purple-400 font-bold mb-3 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <span>Docker Isolated Container Exec Output:</span>
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed text-slate-300">{skillOutput}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

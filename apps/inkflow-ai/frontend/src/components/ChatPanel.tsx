'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, ChevronDown, Bot, User, Layout, ArrowUp, Zap, FileText } from 'lucide-react';
import { GenerateResult } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string;
  created_at?: string;
  generatedData?: GenerateResult;
}

interface ChatPanelProps {
  projectTitle: string;
  messages: ChatMessage[];
  onSendMessage: (msg: string, model: string) => void;
  onOpenInEditModal: (data: GenerateResult) => void;
  isLoading: boolean;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  isExpandedWidth?: boolean;
  injectedPrompt?: string;
}

const LOADING_TEXTS = [
  'AI 正在深入思考中...',
  '正在分析核心意图与创作方案...',
  '正在整合背景素材与专业知识...',
  '正在组织语言，即将输出内容...',
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  projectTitle,
  messages,
  onSendMessage,
  onOpenInEditModal,
  isLoading,
  selectedModel,
  onSelectModel,
  isExpandedWidth = false,
  injectedPrompt = '',
}) => {
  const [inputMsg, setInputMsg] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [loadingTextIdx, setLoadingTextIdx] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle injected prompt from skills panel
  useEffect(() => {
    if (injectedPrompt) {
      setInputMsg(injectedPrompt);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(injectedPrompt.length, injectedPrompt.length);
        }
      }, 100);
    }
  }, [injectedPrompt]);

  // Cycle loading texts every 1800ms when loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setLoadingTextIdx(0);
      interval = setInterval(() => {
        setLoadingTextIdx((prev) => (prev + 1) % LOADING_TEXTS.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  // Click-outside listener to close AI Model Dropdown popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || isLoading) return;
    onSendMessage(inputMsg, selectedModel);
    setInputMsg('');
  };

  // Only keep available DeepSeek models
  const modelLabels: Record<string, string> = {
    'deepseek-v4-flash': 'DeepSeek V4 Flash (极速)',
    'deepseek-v4-pro': 'DeepSeek V4 Pro (深度推理)',
  };

  // Max width class based on whether right sidebar is collapsed
  const contentWidthClass = isExpandedWidth ? 'max-w-5xl' : 'max-w-3xl';

  return (
    <div className="flex-1 flex flex-col h-screen bg-white relative border-r border-slate-200/80 font-sans transition-all duration-300">
      {/* Top Header */}
      <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-sm text-slate-800 tracking-tight">{projectTitle}</h2>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-slate-400 font-medium">在线</span>
        </div>
      </div>

      {/* Chat Messages Stream */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {messages.length === 0 && (
          <div className={`my-auto flex flex-col items-center justify-center text-center p-8 ${contentWidthClass} mx-auto`}>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-rose-400 flex items-center justify-center text-white font-bold mb-4 shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-800 mb-2">欢迎来到 {projectTitle} 👋</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md">
              您可以在这里与 AI 进行对话沟通、探讨选题与创作方案。AI 会根据当前项目绑定的创作类型为您提供精准支持！
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 w-full ${contentWidthClass} mx-auto ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-rose-400 flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div className={`flex flex-col gap-1.5 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium px-1">
                  <span>{msg.model_used || selectedModel}</span>
                  {msg.created_at && <span>· {msg.created_at}</span>}
                </div>
              )}

              <div
                className={`p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs shadow-sm font-medium'
                    : 'bg-slate-100/80 text-slate-800 border border-slate-200/60 rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Render Embedded AI Generated Creation Card */}
                {msg.generatedData && (
                  <div className="mt-3 p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-sm flex flex-col gap-2.5 text-slate-800">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-600 border-b pb-2">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        AI 创作结果
                      </span>
                      <span className="text-[10px] bg-blue-50 px-2 py-0.5 rounded text-blue-700">
                        {msg.generatedData.titles.length} 个候选标题
                      </span>
                    </div>

                    <div className="font-bold text-xs text-slate-900">
                      主选标题：{msg.generatedData.titles[0]}
                    </div>

                    <div className="text-[11px] text-slate-500 line-clamp-3">
                      {msg.generatedData.content.slice(0, 120)}...
                    </div>

                    <button
                      onClick={() => onOpenInEditModal(msg.generatedData!)}
                      className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all mt-1"
                    >
                      <Layout className="w-3.5 h-3.5" />
                      <span>在编辑器中进行修改与排版</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className={`flex items-center gap-3 w-full ${contentWidthClass} mx-auto`}>
            {/* Avatar WITHOUT spinning animation */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-rose-400 flex items-center justify-center text-white text-xs shadow-xs">
              <Bot className="w-4 h-4" />
            </div>

            {/* Cycling Loading Text */}
            <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-2.5 shadow-2xs animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
              <span className="font-medium transition-all duration-300">
                {LOADING_TEXTS[loadingTextIdx]}
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={handleSend} className={`${contentWidthClass} mx-auto flex flex-col gap-2 transition-all duration-300`}>
          <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all p-3 flex flex-col gap-3">
            <textarea
              ref={textareaRef}
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="输入消息与 AI 自由沟通、探讨选题，或使用技能提示词..."
              rows={2}
              className="w-full text-xs text-slate-800 bg-transparent focus:outline-none resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {/* AI Model Selector Dropdown with Click-Outside Ref */}
                <div className="relative" ref={modelDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-slate-200/80 hover:border-slate-300 text-[11px] font-semibold text-slate-700 shadow-2xs transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>{modelLabels[selectedModel] || selectedModel}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showModelDropdown && (
                    <div className="absolute bottom-full mb-1 left-0 w-52 bg-white rounded-xl shadow-xl border border-slate-200/80 py-1.5 z-50 text-xs">
                      <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        切换 AI 模型引擎
                      </div>
                      {Object.entries(modelLabels).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            onSelectModel(key);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 ${
                            selectedModel === key ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                          }`}
                        >
                          <span>{label}</span>
                          {selectedModel === key && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!inputMsg.trim() || isLoading}
                  className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-sm"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

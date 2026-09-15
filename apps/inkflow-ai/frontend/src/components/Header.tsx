import React from 'react';
import { Sparkles, Database, ShieldCheck, Cpu } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
            InkFlow AI
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              MVP Local-First
            </span>
          </h1>
          <p className="text-xs text-slate-500">微信公众号长文 & 短视频脚本 AI 创作排版工作台</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
          <Database className="w-3.5 h-3.5 text-blue-500" />
          <span>Chroma RAG</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Docker Sandbox</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60">
          <Cpu className="w-3.5 h-3.5 text-purple-500" />
          <span>DeepSeek API</span>
        </div>
      </div>
    </header>
  );
};

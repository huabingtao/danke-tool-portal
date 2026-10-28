'use client';

import React, { useState } from 'react';
import { Heart, Bookmark, MessageCircle, Share2, Sparkles, Edit3, Save } from 'lucide-react';

interface XhsCardViewerProps {
  title: string;
  outline: string[];
  content: string;
  onSaveTitle?: (newTitle: string) => void;
}

export const XhsCardViewer: React.FC<XhsCardViewerProps> = ({
  title,
  outline,
  content,
  onSaveTitle,
}) => {
  const [editableTitle, setEditableTitle] = useState(title || '小红书爆款图文卡片');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const sections = outline.length > 0 ? outline : ['核心洞察与经验', '避坑建议与技巧', '终极总结'];

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (onSaveTitle) {
      onSaveTitle(editableTitle);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between bg-rose-50 p-3 rounded-xl border border-rose-200">
        <div className="text-xs text-rose-700 font-medium">
          🔴 小红书 3:4 (1080x1440) 视觉卡片编辑与实时预览
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
          共 {sections.length + 1} 张可编辑卡片
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cover Card */}
        <div className="aspect-[3/4] w-full rounded-2xl p-6 bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 text-white shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-rose-100 uppercase">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 爆款推荐
            </span>
            <span>CARD #1 (封面)</span>
          </div>

          <div className="my-auto flex flex-col gap-3">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  className="w-full text-base font-bold bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/40 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-2 rounded-lg bg-white text-rose-600 font-bold text-xs shrink-0"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="group/title relative">
                <h2 className="text-2xl font-black leading-tight tracking-tight drop-shadow-xs pr-6">
                  {editableTitle}
                </h2>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="absolute top-0 right-0 opacity-0 group-hover/title:opacity-100 p-1 text-white/80 hover:text-white transition-opacity"
                  title="修改封面标题"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="w-12 h-1 bg-white/40 rounded-full" />
            <p className="text-xs font-medium text-rose-100 bg-black/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
              📌 干货整理 · 建议先赞后看 · 避坑指南
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-white/20 pt-3 text-xs text-rose-100">
            <span>@InkFlow AI 创作</span>
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4" />
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Content Section Cards */}
        {sections.map((sec, idx) => (
          <div
            key={idx}
            className="aspect-[3/4] w-full rounded-2xl p-6 bg-slate-900 text-white shadow-xl flex flex-col justify-between relative overflow-hidden border border-slate-800"
          >
            <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-indigo-400 uppercase">
              <span>POINT 0{idx + 1}</span>
              <span>CARD #{idx + 2}</span>
            </div>

            <div className="my-auto flex flex-col gap-4">
              <h3 className="text-lg font-bold text-slate-100 border-l-4 border-indigo-500 pl-3 leading-snug">
                {sec}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                包含关于【{sec}】的核心分析与具体操作步骤。结构清晰，易于理解与落地实践。
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
              <span className="text-[10px]">滑动查看更多 👉</span>
              <div className="flex items-center gap-3 text-slate-400">
                <Heart className="w-3.5 h-3.5" />
                <MessageCircle className="w-3.5 h-3.5" />
                <Share2 className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Copy, Check, Edit3, Save } from 'lucide-react';

interface WeChatFormatterProps {
  content: string;
  formattedHtml?: string;
  onSaveContent?: (newContent: string) => void;
}

export const WeChatFormatter: React.FC<WeChatFormatterProps> = ({
  content,
  formattedHtml,
  onSaveContent,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableMarkdown, setEditableMarkdown] = useState(content);

  const generateBasicWeChatHtml = (markdown: string) => {
    if (formattedHtml && !isEditing) return formattedHtml;

    let html = markdown
      .replace(/^# (.*?)$/gm, '<h1 style="font-size: 22px; font-weight: bold; color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 24px 0 16px 0;">$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2 style="font-size: 18px; font-weight: bold; color: #2563eb; margin: 20px 0 12px 0; border-left: 4px solid #2563eb; padding-left: 10px;">$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3 style="font-size: 16px; font-weight: bold; color: #3b82f6; margin: 16px 0 8px 0;">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1d4ed8; background-color: #eff6ff; padding: 2px 5px; border-radius: 4px;">$1</strong>')
      .replace(/`(.*?)`/g, '<code style="background-color: #f1f5f9; color: #0f172a; padding: 2px 6px; border-radius: 4px; font-family: monospace;">$1</code>');

    const paragraphs = html.split(/\n\n+/);
    const formattedParagraphs = paragraphs.map((p) => {
      const trimmed = p.trim();
      if (trimmed.startsWith('<h1') || trimmed.startsWith('<h2') || trimmed.startsWith('<h3')) {
        return trimmed;
      }
      return `<p style="font-size: 15px; line-height: 1.8; color: #334155; margin-bottom: 16px; letter-spacing: 0.5px;">${trimmed}</p>`;
    });

    return `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">${formattedParagraphs.join('')}</div>`;
  };

  const finalHtml = generateBasicWeChatHtml(editableMarkdown);

  const handleCopy = () => {
    navigator.clipboard.writeText(finalHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setIsEditing(false);
    if (onSaveContent) {
      onSaveContent(editableMarkdown);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-slate-100 p-3 rounded-xl border border-slate-200">
        <div className="text-xs text-slate-600 font-medium flex items-center gap-2">
          <span>🟢 微信公众号富文本排版与实时修改</span>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>保存修改</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>直接修改文本</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>已复制 HTML</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>一键复制公众号 HTML</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={editableMarkdown}
          onChange={(e) => setEditableMarkdown(e.target.value)}
          rows={16}
          className="w-full p-4 bg-white border border-blue-400 rounded-2xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed resize-y"
        />
      ) : (
        <div
          className="w-full min-h-[450px] p-6 bg-slate-50 border border-slate-200 rounded-2xl overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: finalHtml }}
        />
      )}
    </div>
  );
};

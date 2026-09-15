'use client';

import React, { useState, useEffect } from 'react';
import { GenerateResult, updateDraft } from '@/lib/api';
import { WeChatFormatter } from './WeChatFormatter';
import { X, Save, Layout, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface ContentEditModalProps {
  data: GenerateResult | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedData: GenerateResult) => void;
}

export const ContentEditModal: React.FC<ContentEditModalProps> = ({
  data,
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const [selectedTitleIdx, setSelectedTitleIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [editableMarkdown, setEditableMarkdown] = useState('');
  const [editableTitles, setEditableTitles] = useState<string[]>([]);
  const [editableOutline, setEditableOutline] = useState<string[]>([]);

  useEffect(() => {
    if (data) {
      setEditableMarkdown(data.content);
      setEditableTitles(data.titles || []);
      setEditableOutline(data.outline || []);
    }
  }, [data]);

  if (!isOpen || !data) return null;

  const handleSaveDraft = async () => {
    if (!data.draft_id) return;
    setIsSaving(true);
    try {
      await updateDraft(data.draft_id, {
        selected_title: editableTitles[selectedTitleIdx] || editableTitles[0],
        candidate_titles: editableTitles,
        outline: editableOutline,
        markdown_content: editableMarkdown,
      });
      const updated = {
        ...data,
        titles: editableTitles,
        outline: editableOutline,
        content: editableMarkdown,
      };
      onSaveSuccess(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || '保存草稿修改失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end transition-opacity font-sans">
      <div className="w-full max-w-3xl bg-slate-50 h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200">
        {/* Modal Header */}
        <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Layout className="w-4 h-4 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-800">创作排版与双向修改编辑器</h3>
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 ml-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                已成功保存修改！
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-40"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? '保存中...' : '保存修改'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Editable Titles */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col gap-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                候选标题列表 (可选择主标题或直接编辑)
              </label>
              <button
                onClick={() => setEditableTitles([...editableTitles, `新候选标题 #${editableTitles.length + 1}`])}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加标题</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {editableTitles.map((t, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="modal_selected_title"
                    checked={selectedTitleIdx === idx}
                    onChange={() => setSelectedTitleIdx(idx)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <input
                    type="text"
                    value={t}
                    onChange={(e) => {
                      const copy = [...editableTitles];
                      copy[idx] = e.target.value;
                      setEditableTitles(copy);
                    }}
                    className={`w-full px-3 py-1.5 border rounded-lg text-xs ${
                      selectedTitleIdx === idx
                        ? 'border-blue-500 font-bold bg-blue-50/50 text-blue-900'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  />
                  <button
                    onClick={() => setEditableTitles(editableTitles.filter((_, i) => i !== idx))}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* WeChat Formatter & Markdown Editor */}
          <WeChatFormatter
            content={editableMarkdown}
            onSaveContent={(newMd) => setEditableMarkdown(newMd)}
          />
        </div>
      </div>
    </div>
  );
};

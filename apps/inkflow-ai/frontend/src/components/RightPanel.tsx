'use client';

import React, { useState, useEffect } from 'react';
import { GenerateResult, updateDraft, getUserPreferences, updateUserPreferences, uploadRagDocument, executeSkill } from '@/lib/api';
import { WeChatFormatter } from './WeChatFormatter';
import { XhsCardViewer } from './XhsCardViewer';
import { Layout, Brain, Cloud, Save, Sparkles, CheckCircle2, Upload, Terminal, Plus, Trash2, Edit3, Code } from 'lucide-react';

interface RightPanelProps {
  data: GenerateResult | null;
  onUpdateData: (newData: GenerateResult) => void;
  activeTab: 'canvas' | 'memory' | 'knowledge';
  onTabChange: (tab: 'canvas' | 'memory' | 'knowledge') => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  data,
  onUpdateData,
  activeTab,
  onTabChange,
}) => {
  const [platform, setPlatform] = useState<'wechat' | 'video_script' | 'general'>('wechat');
  const [selectedTitleIdx, setSelectedTitleIdx] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable draft states
  const [editableMarkdown, setEditableMarkdown] = useState('');
  const [editableTitles, setEditableTitles] = useState<string[]>([]);
  const [editableOutline, setEditableOutline] = useState<string[]>([]);

  // Memory states
  const [writingStyle, setWritingStyle] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('wechat');
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');
  const [memorySavedMsg, setMemorySavedMsg] = useState('');

  // Knowledge RAG states
  const [ragTitle, setRagTitle] = useState('');
  const [ragContent, setRagContent] = useState('');
  const [ragSuccessMsg, setRagSuccessMsg] = useState('');
  const [skillOutput, setSkillOutput] = useState('');

  useEffect(() => {
    if (data) {
      setEditableMarkdown(data.content);
      setEditableTitles(data.titles || []);
      setEditableOutline(data.outline || []);
    }
  }, [data]);

  useEffect(() => {
    if (activeTab === 'memory') {
      getUserPreferences()
        .then((pref) => {
          setWritingStyle(pref.writing_style);
          setTargetPlatform(pref.target_platform);
          setCustomSystemPrompt(pref.custom_system_prompt);
        })
        .catch(() => {});
    }
  }, [activeTab]);

  const handleSaveDraft = async () => {
    if (!data || !data.draft_id) return;
    setIsSaving(true);
    try {
      await updateDraft(data.draft_id, {
        selected_title: editableTitles[selectedTitleIdx] || editableTitles[0],
        candidate_titles: editableTitles,
        outline: editableOutline,
        markdown_content: editableMarkdown,
      });
      onUpdateData({
        ...data,
        titles: editableTitles,
        outline: editableOutline,
        content: editableMarkdown,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      alert(err.message || '草稿修改保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMemory = async () => {
    try {
      await updateUserPreferences({
        writing_style: writingStyle,
        target_platform: targetPlatform,
        custom_system_prompt: customSystemPrompt,
      });
      setMemorySavedMsg('长期创作偏好与记忆保存成功！');
      setTimeout(() => setMemorySavedMsg(''), 3000);
    } catch (err: any) {
      alert(err.message || '偏好保存失败');
    }
  };

  const handleUploadRag = async () => {
    if (!ragTitle || !ragContent) return;
    try {
      const res = await uploadRagDocument(ragTitle, ragContent);
      setRagSuccessMsg(`成功切片并索引 ${res.chunks_created} 个矢量段落到 ChromaDB！`);
      setRagTitle('');
      setRagContent('');
      setTimeout(() => setRagSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || '上传知识库失败');
    }
  };

  const handleRunSkill = async (skillId: string) => {
    if (!editableMarkdown) {
      alert('请先在画布中生成或提供 Markdown 正文，再执行沙箱 Skill！');
      return;
    }
    try {
      const res = await executeSkill(skillId, editableMarkdown);
      if (res.output) {
        setSkillOutput(res.output);
        alert(`Skill 在 Docker 沙箱 (${res.execution_mode}) 中运行成功！`);
      }
    } catch (err: any) {
      alert(err.message || 'Skill 执行失败');
    }
  };

  const currentTitle = editableTitles[selectedTitleIdx] || editableTitles[0] || '默认标题';

  return (
    <div className="w-[520px] xl:w-[600px] shrink-0 bg-slate-50 border-l border-slate-200/80 flex flex-col h-screen overflow-hidden">
      {/* Header Tabs */}
      <div className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onTabChange('canvas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'canvas'
                ? 'bg-blue-50 text-blue-600 border border-blue-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>✍️ 创作画布</span>
          </button>

          <button
            onClick={() => onTabChange('memory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'memory'
                ? 'bg-purple-50 text-purple-600 border border-purple-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>🧠 记忆偏好</span>
          </button>

          <button
            onClick={() => onTabChange('knowledge')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'knowledge'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>📁 知识库云盘</span>
          </button>
        </div>

        {activeTab === 'canvas' && data && (
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? '保存中...' : saveSuccess ? '已保存！' : '保存修改'}</span>
          </button>
        )}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-5">
        {/* TAB 1: Canvas Content Editor & Visual Renderer */}
        {activeTab === 'canvas' && (
          <div className="flex flex-col gap-6">
            {!data ? (
              <div className="my-auto text-center p-8 bg-white rounded-2xl border border-slate-200">
                <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h4 className="font-bold text-sm text-slate-800">创作编辑画布未激活</h4>
                <p className="text-xs text-slate-500 mt-1">
                  在中间栏向 AI 发送创作指令，生成的内容将实时展现在此处供您双向排版与修改。
                </p>
              </div>
            ) : (
              <>
                {/* Platform Mode Switcher */}
                <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-600">选择渲染模式：</span>
                  <button
                    onClick={() => setPlatform('wechat')}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white shadow-xs"
                  >
                    🟢 微信公众号长文
                  </button>
                </div>

                {/* Candidate Titles Picker & Editable List */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      1. 爆款标题列表 (可直接修改)
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
                          name="selected_title"
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

                {/* Visual Renderer & Markdown Editor */}
                {platform === 'wechat' ? (
                  <WeChatFormatter
                    content={editableMarkdown}
                    onSaveContent={(newMd) => setEditableMarkdown(newMd)}
                  />
                ) : (
                  <XhsCardViewer
                    title={currentTitle}
                    outline={editableOutline}
                    content={editableMarkdown}
                    onSaveTitle={(newTitle) => {
                      const copy = [...editableTitles];
                      copy[selectedTitleIdx] = newTitle;
                      setEditableTitles(copy);
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* TAB 2: Memory & Preferences Manager */}
        {activeTab === 'memory' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <span>长期写作风格与习惯记忆</span>
              </h3>
              {memorySavedMsg && (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {memorySavedMsg}
                </span>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">写作文风风格 Tone</label>
              <input
                type="text"
                value={writingStyle}
                onChange={(e) => setWritingStyle(e.target.value)}
                placeholder="例如：犀利、干货满满、结论先行、幽默"
                className="w-full px-3.5 py-2 border rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">常用目标平台</label>
              <select
                value={targetPlatform}
                onChange={(e) => setTargetPlatform(e.target.value)}
                className="w-full px-3.5 py-2 border rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-500"
              >
                <option value="wechat">🟢 微信公众号长文</option>
                <option value="video_script">🎬 短视频脚本</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">自定义 System Prompt 规则</label>
              <textarea
                value={customSystemPrompt}
                onChange={(e) => setCustomSystemPrompt(e.target.value)}
                rows={5}
                placeholder="例如：文章必须有吸引人的 Hook，段落简短明快..."
                className="w-full p-3 border rounded-xl text-xs text-slate-800 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
              />
            </div>

            <button
              onClick={handleSaveMemory}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs transition-all"
            >
              保存记忆至持久化 SQLite 数据库
            </button>
          </div>
        )}

        {/* TAB 3: Knowledge Base & Files */}
        {activeTab === 'knowledge' && (
          <div className="flex flex-col gap-5">
            {/* Upload form */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col gap-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-600" />
                  <span>上传知识库参考素材</span>
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">
                  Chroma Vector DB
                </span>
              </h3>

              {ragSuccessMsg && (
                <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{ragSuccessMsg}</span>
                </div>
              )}

              <input
                type="text"
                value={ragTitle}
                onChange={(e) => setRagTitle(e.target.value)}
                placeholder="素材标题（如：2026年爆款排版案例）"
                className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
              <textarea
                value={ragContent}
                onChange={(e) => setRagContent(e.target.value)}
                placeholder="粘贴想要建立向量检索索引的文章或资料段落..."
                rows={4}
                className="w-full p-3 border rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 resize-none"
              />
              <button
                onClick={handleUploadRag}
                disabled={!ragTitle.trim() || !ragContent.trim()}
                className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>切片并生成向量索引</span>
              </button>
            </div>

            {/* Docker Skill Execution */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col gap-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-600" />
                <span>Docker 沙箱 Skill 快速运行</span>
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleRunSkill('wechat_html_formatter')}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 text-left transition-all flex items-center gap-2"
                >
                  <Code className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-bold text-xs text-slate-900">执行公众号 HTML 美化 Skill</div>
                    <div className="text-[10px] text-slate-500">在 Docker 隔离沙箱中运行 Python 格式化逻辑</div>
                  </div>
                </button>

              </div>

              {skillOutput && (
                <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40">
                  <div className="text-purple-400 font-bold mb-1">Docker Execution Output:</div>
                  <pre className="whitespace-pre-wrap">{skillOutput}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

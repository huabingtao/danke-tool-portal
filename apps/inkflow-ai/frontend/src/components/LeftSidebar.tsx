'use client';

import React, { useState } from 'react';
import { Plus, Search, Folder, Terminal, Edit2, Trash2, Check, X, Settings, User } from 'lucide-react';
import { ProjectItem } from '@/lib/api';

interface LeftSidebarProps {
  projects: ProjectItem[];
  activeProjectId: number | null;
  onSelectProject: (id: number) => void;
  onCreateProject: (title: string, category: string) => void;
  onRenameProject: (id: number, newTitle: string) => void;
  onDeleteProject: (id: number) => void;
  activeNavTab: 'projects' | 'skills';
  onSelectNavTab: (tab: 'projects' | 'skills') => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  activeNavTab,
  onSelectNavTab,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('wechat');

  // Inline renaming state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateProject(newTitle, newCategory);
    setNewTitle('');
    setShowNewModal(false);
  };

  const handleStartRename = (e: React.MouseEvent, proj: ProjectItem) => {
    e.stopPropagation();
    setEditingId(proj.id);
    setEditingTitle(proj.title);
  };

  const handleSaveRename = (e: React.MouseEvent | React.FormEvent, projId: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (editingTitle.trim()) {
      onRenameProject(projId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleDelete = (e: React.MouseEvent, proj: ProjectItem) => {
    e.stopPropagation();
    if (confirm(`确定要删除项目「${proj.title}」吗？`)) {
      onDeleteProject(proj.id);
    }
  };

  return (
    <aside className="w-[240px] shrink-0 bg-[#f7f7f9] border-r border-slate-200/80 flex flex-col justify-between h-screen select-none font-sans">
      {/* Top Section */}
      <div className="flex flex-col p-3 gap-2 overflow-y-auto">
        {/* Top Minimal Header */}
        <div className="flex items-center justify-between px-2 py-2 mb-1 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              AI
            </div>
            <span className="font-bold text-xs text-slate-800 tracking-tight">AI 内容工作台</span>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors">
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Global Navigation Link (Keep ONLY ⚡ 技能) */}
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => onSelectNavTab('skills')}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
              activeNavTab === 'skills'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <Terminal className="w-4 h-4 text-purple-500" />
            <span>技能</span>
          </button>
        </div>

        <div className="my-2 border-t border-slate-200/60" />

        {/* Projects Section Header with + Add Button */}
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
            项目列表
          </span>
          <button
            onClick={() => setShowNewModal(true)}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 p-1 rounded-md transition-all flex items-center gap-0.5 text-xs"
            title="新建项目"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新建</span>
          </button>
        </div>

        {/* Projects List with Edit Name and Delete Actions */}
        <div className="flex flex-col gap-1">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => {
                onSelectNavTab('projects');
                onSelectProject(proj.id);
              }}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-all cursor-pointer group ${
                activeProjectId === proj.id && activeNavTab === 'projects'
                  ? 'bg-white text-slate-900 shadow-xs font-bold border border-slate-200/60'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              {editingId === proj.id ? (
                <form
                  onSubmit={(e) => handleSaveRename(e, proj.id)}
                  className="flex items-center gap-1 w-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="w-full px-1.5 py-0.5 border rounded border-blue-500 text-xs bg-white text-slate-900 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="text-emerald-600 hover:text-emerald-700 p-0.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(null);
                    }}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-2 truncate">
                    <Folder className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />
                    <span className="truncate">{proj.title}</span>
                  </div>

                  {/* Actions on hover */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                    <button
                      onClick={(e) => handleStartRename(e, proj)}
                      className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                      title="修改名称"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, proj)}
                      className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                      title="删除项目"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom User Footer */}
      <div className="p-3 border-t border-slate-200/80 bg-[#f7f7f9] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-800">用户_453075</span>
            <span className="text-[10px] text-slate-400">已登录</span>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* New Project Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl flex flex-col gap-4">
            <h3 className="font-bold text-base text-slate-900">新建 AI 创作项目</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">项目名称</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="例如：短视频运营策略拆解"
                  className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">创作类型</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="wechat">🟢 微信公众号长文</option>
                  <option value="video_script">🎬 短视频分镜脚本</option>
                  <option value="general">💬 通用对话项目</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-40"
                >
                  确认新建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

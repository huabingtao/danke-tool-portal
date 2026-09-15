'use client';

import React, { useState, useEffect } from 'react';
import { 
  SkillItem, 
  SkillCategory, 
  fetchSkillsList, 
  fetchSkillDetail 
} from '@/lib/api';
import { 
  Terminal, 
  Search, 
  Sparkles, 
  Layers, 
  PenTool, 
  Palette, 
  Image, 
  Send, 
  Video, 
  Wrench, 
  Scissors,
  Share2,
  UploadCloud,
  Tv,
  Mic,
  FileVideo,
  Film,
  Sliders,
  Globe,
  ScanText,
  Gift,
  GitBranch,
  Play, 
  X,
  UserCheck,
  FileText,
  Layout,
  Crop,
  Download,
  Check,
  Compass,
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Code
} from 'lucide-react';

interface SkillsPanelProps {
  onFillSkillPrompt?: (promptText: string) => void;
}

export const SkillsPanel: React.FC<SkillsPanelProps> = ({ onFillSkillPrompt }) => {
  const [activeSource, setActiveSource] = useState<'local' | 'market'>('local');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 9; // 3x3 Grid

  const [skills, setSkills] = useState<SkillItem[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Skill Detail Modal State
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Local state for installed market skills (stored in localStorage)
  const [installedMarketIds, setInstalledMarketIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('inkflow_installed_market_ids');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  const toggleMarketInstall = (skillId: string) => {
    const isInstalled = installedMarketIds.includes(skillId);
    const updated = isInstalled
      ? installedMarketIds.filter((id) => id !== skillId)
      : [...installedMarketIds, skillId];
    setInstalledMarketIds(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('inkflow_installed_market_ids', JSON.stringify(updated));
    }
  };

  const loadSkills = async () => {
    setIsLoading(true);
    try {
      const res = await fetchSkillsList({
        source: activeSource,
        category: selectedCategory,
        query: searchQuery,
        page: page,
        size: pageSize,
      });
      setSkills(res.skills);
      setCategories(res.categories);
      setTotalCount(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error('Failed to load paginated skills:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger data reload when parameters change
  useEffect(() => {
    loadSkills();
  }, [activeSource, selectedCategory, searchQuery, page]);

  // Reset page to 1 when tab, category, or search query changes
  const handleTabChange = (source: 'local' | 'market') => {
    setActiveSource(source);
    setSelectedCategory('all');
    setSearchQuery('');
    setPage(1);
  };

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    setPage(1);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    setPage(1);
  };

  const handleOpenDetail = async (skill: SkillItem) => {
    setDetailLoading(true);
    setSelectedSkill(skill);
    try {
      const detailed = await fetchSkillDetail(skill.name);
      setSelectedSkill(detailed);
    } catch (err) {
      console.error('Failed to fetch skill detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'content':
        return <PenTool className="w-3.5 h-3.5" />;
      case 'formatting':
        return <Palette className="w-3.5 h-3.5" />;
      case 'slicing':
        return <Image className="w-3.5 h-3.5" />;
      case 'publishing':
        return <Send className="w-3.5 h-3.5" />;
      case 'multimodal':
        return <Video className="w-3.5 h-3.5" />;
      case 'utilities':
        return <Wrench className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  const getBadgeClass = (category: string) => {
    switch (category) {
      case 'content':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'formatting':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'slicing':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'publishing':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'multimodal':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'utilities':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getSkillIcon = (skill: SkillItem) => {
    if (skill.icon_type === 'Globe') return <Globe className="w-4 h-4 text-blue-500" />;
    if (skill.icon_type === 'Mic') return <Mic className="w-4 h-4 text-amber-500" />;
    if (skill.icon_type === 'Send') return <Send className="w-4 h-4 text-emerald-500" />;
    if (skill.icon_type === 'Layout') return <Layout className="w-4 h-4 text-purple-500" />;
    if (skill.icon_type === 'PenTool') return <PenTool className="w-4 h-4 text-indigo-500" />;
    if (skill.icon_type === 'Scissors') return <Scissors className="w-4 h-4 text-pink-500" />;

    switch (skill.category) {
      case 'content':
        return <PenTool className="w-4 h-4 text-indigo-500" />;
      case 'formatting':
        return <Palette className="w-4 h-4 text-purple-500" />;
      case 'slicing':
        return <Scissors className="w-4 h-4 text-pink-500" />;
      case 'publishing':
        return <Send className="w-4 h-4 text-emerald-500" />;
      case 'multimodal':
        return <Video className="w-4 h-4 text-amber-500" />;
      case 'utilities':
        return <Wrench className="w-4 h-4 text-blue-500" />;
      default:
        return <Terminal className="w-4 h-4 text-slate-500" />;
    }
  };

  // Generate pagination buttons array
  const renderPaginationButtons = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages.map((p, idx) => {
      if (p === '...') {
        return (
          <span key={`dots_${idx}`} className="px-2 py-1 text-slate-400 text-xs select-none">
            ...
          </span>
        );
      }
      const pageNum = Number(p);
      return (
        <button
          key={pageNum}
          onClick={() => setPage(pageNum)}
          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
            page === pageNum
              ? 'bg-purple-600 text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-200/60 bg-slate-100/70'
          }`}
        >
          {pageNum}
        </button>
      );
    });
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-slate-50 overflow-hidden font-sans select-none">
      {/* Top Header */}
      <div className="h-14 px-6 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs">
              <Terminal className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-sm text-slate-800 tracking-tight">
              技能中心
            </h2>
          </div>

          {/* Dual Sub-Tabs (本地已安装 vs 技能发现广场) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => handleTabChange('local')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeSource === 'local'
                  ? 'bg-white text-purple-700 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>本地已安装技能</span>
            </button>
            <button
              onClick={() => handleTabChange('market')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeSource === 'market'
                  ? 'bg-white text-purple-700 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>技能发现广场</span>
            </button>
          </div>
        </div>

        {/* Search Bar & Refresh */}
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索技能名称、描述或触发词..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500 transition-all shadow-2xs"
            />
          </div>

          <button
            onClick={loadSkills}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
            title="重新扫描技能库"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-6 py-3 bg-white border-b border-slate-200/60 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/20'
                : 'bg-slate-100/80 hover:bg-slate-200/60 text-slate-600'
            }`}
          >
            {getCategoryIcon(cat.id)}
            <span>{cat.label}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
              selectedCategory === cat.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Skills 3x3 Grid (Cards Viewport) */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col justify-between">
        {isLoading ? (
          <div className="flex items-center justify-center h-64 gap-2 text-slate-400 text-xs">
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span>正在加载技能列表...</span>
          </div>
        ) : skills.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center max-w-sm mx-auto">
            <Layers className="w-10 h-10 text-slate-300 mb-2" />
            <h4 className="font-bold text-xs text-slate-700">未找到匹配的技能</h4>
            <p className="text-[11px] text-slate-400 mt-1">请尝试更换搜索词或切换用途分类标签。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {skills.map((skill) => {
              const isMarketInstalled = installedMarketIds.includes(skill.id);

              return (
                <div
                  key={skill.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Top Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                          {getSkillIcon(skill)}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getBadgeClass(skill.category)}`}>
                          {skill.category_label}
                        </span>
                      </div>

                      {skill.scripts && skill.scripts.length > 0 ? (
                        <span className="text-[10px] bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Code className="w-3 h-3 text-slate-400" />
                          <span>{skill.scripts.length} 脚本</span>
                        </span>
                      ) : skill.downloads ? (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {skill.downloads} 次使用
                        </span>
                      ) : null}
                    </div>

                    {/* Skill Name */}
                    <h3 className="font-bold text-xs text-slate-800 group-hover:text-purple-600 transition-colors mb-1.5 truncate" title={skill.name}>
                      {skill.name}
                    </h3>

                    {/* Description */}
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {skill.description || '暂无详细描述。'}
                    </p>

                    {/* Triggers / Tags */}
                    {skill.tags && skill.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {skill.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <button
                      onClick={() => handleOpenDetail(skill)}
                      className="text-xs font-semibold text-slate-500 hover:text-purple-600 transition-colors"
                    >
                      查看文档
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* If in Explore Market: Show Install / Enabled button */}
                      {activeSource === 'market' && (
                        isMarketInstalled ? (
                          <button
                            onClick={() => toggleMarketInstall(skill.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-1"
                            title="点击可取消启用"
                          >
                            <Check className="w-3 h-3" />
                            <span>已启用</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleMarketInstall(skill.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors border border-purple-200 flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>启用</span>
                          </button>
                        )
                      )}

                      {/* Use Skill Prompt in Chat Button */}
                      {onFillSkillPrompt && (
                        <button
                          onClick={() => onFillSkillPrompt(skill.prompt_template || `请调用技能【${skill.name}】：\n`)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-2xs flex items-center gap-1"
                          title="复制技能提示词到对话框（不立即发送）"
                        >
                          <Play className="w-3 h-3" />
                          <span>使用</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Classic Pagination Bar */}
        <div className="h-12 bg-white rounded-2xl border border-slate-200/80 px-4 mt-4 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">
            共 <span className="font-bold text-slate-800">{totalCount}</span> 个技能
            <span className="mx-2 text-slate-300">|</span>
            第 <span className="font-bold text-purple-600">{page}</span> / {totalPages} 页
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1 transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>上一页</span>
            </button>

            <div className="flex items-center gap-1 mx-1">
              {renderPaginationButtons()}
            </div>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent flex items-center gap-1 transition-all"
            >
              <span>下一页</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Skill Detail Modal */}
      {selectedSkill && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-xs">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{selectedSkill.name}</h3>
                  <span className="text-[11px] text-slate-500">{selectedSkill.category_label}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-xs">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                  <span>正在加载技能文档...</span>
                </div>
              ) : (
                <>
                  {/* Skill Metadata Box */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col gap-2">
                    {selectedSkill.path && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-bold">物理目录路径：</span>
                        <span className="font-mono text-[11px] text-slate-500 select-all">{selectedSkill.path}</span>
                      </div>
                    )}
                    {selectedSkill.scripts && selectedSkill.scripts.length > 0 && (
                      <div className="flex items-center justify-between text-slate-700">
                        <span className="font-bold">可执行脚本：</span>
                        <span className="font-mono text-[11px] text-purple-600 font-semibold">{selectedSkill.scripts.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Markdown Content */}
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs mb-2">📖 SKILL.md 文档全貌</h4>
                    <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-[360px] overflow-y-auto">
                      {selectedSkill.full_markdown || selectedSkill.content_preview || '暂无文档内容'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedSkill(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                关闭
              </button>
              {onFillSkillPrompt && (
                <button
                  onClick={() => {
                    const prompt = selectedSkill.prompt_template || `请使用技能【${selectedSkill.name}】：\n`;
                    setSelectedSkill(null);
                    onFillSkillPrompt(prompt);
                  }}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-xs flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>填入当前对话框</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

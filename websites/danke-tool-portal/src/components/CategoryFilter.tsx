'use client';

import React from 'react';
import { PORTAL_CATEGORIES } from '../data/portalConfig';

interface CategoryFilterProps {
  activeCategory: string;
  onSelectCategory: (categoryKey: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-white/10">
      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
        {PORTAL_CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => onSelectCategory(cat.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600/25 border border-blue-500/50 text-blue-300 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900/40 border border-white/5 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CategoryFilter;

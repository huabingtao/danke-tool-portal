'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Car,
  ShoppingBag,
  BookOpen,
  Wrench,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Star,
} from 'lucide-react';
import { PortalItem } from '../data/portalConfig';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Car,
  ShoppingBag,
  BookOpen,
  Wrench,
  Smartphone,
};

interface PortalCardProps {
  item: PortalItem;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const PortalCard: React.FC<PortalCardProps> = ({
  item,
  isFavorite,
  onToggleFavorite,
}) => {
  const IconComponent = ICON_MAP[item.iconName] || ExternalLink;

  const badgeStyles = {
    emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  };

  const currentBadgeStyle = item.badgeType ? badgeStyles[item.badgeType] : badgeStyles.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-card rounded-2xl p-6 flex flex-col justify-between space-y-5 relative group border hover:border-blue-500/40"
    >
      {/* Top Section */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-cyan-400 group-hover:border-blue-500/40 group-hover:scale-105 transition-all shadow-md">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{item.subtitle}</p>
            </div>
          </div>

          <button
            onClick={() => onToggleFavorite(item.id)}
            title={isFavorite ? '取消收藏' : '收藏到顶部'}
            className={`p-2 rounded-xl border transition-all ${
              isFavorite
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-slate-900/40 border-white/5 text-slate-500 hover:text-amber-400 hover:border-amber-500/20'
            }`}
          >
            <Star className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-white/5">
          {item.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-md bg-slate-900/60 border border-white/5 text-slate-400 text-[10px] font-mono"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
        {item.badge && (
          <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold ${currentBadgeStyle}`}>
            {item.badge}
          </span>
        )}

        <a
          href={item.url}
          target={item.url.startsWith('http') ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="ml-auto px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md group-hover:border-blue-400"
        >
          <span>进入项目</span>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </a>
      </div>
    </motion.div>
  );
};

export default PortalCard;

import React from 'react';
import { Rocket, Shield, Zap, Users, Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="glass-panel rounded-2xl p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" /> Next.js + Minimalist Art Architecture
        </div>
        
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
          <span className="text-gradient">并列发车</span> · 极致战力匹配平台
        </h1>
        
        <p className="max-w-2xl mx-auto text-slate-400 text-sm md:text-base leading-relaxed">
          高效协同组队、装备组合模拟与攻略发布，极简艺术风格设计系统，为玩家提供流畅优质的发车体验。
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <button className="glass-button px-6 py-3 rounded-xl text-white font-medium flex items-center gap-2 shadow-lg shadow-blue-500/25">
            <Rocket className="w-4 h-4" /> 快速加入发车
          </button>
          <button className="glass-card px-6 py-3 rounded-xl text-slate-300 font-medium hover:text-white border border-white/10 flex items-center gap-2">
            <Shield className="w-4 h-4" /> 浏览组队攻略
          </button>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">并行车队匹配</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            实时多车发车模式，精准按战力与装备需求自动分配位置。
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">极简设计语言</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            深色夜幕主题搭配 Glassmorphism 玻璃拟态，专注核心游戏数据呈现。
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-white">Zustand 状态响应</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            轻量轻快的状态同步架构，无缝连接客户端与协作机制。
          </p>
        </div>
      </section>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  Rocket,
  ShieldCheck,
  UserCheck,
  LogIn,
  Sparkles,
  BookOpen,
  Calculator,
  User,
  LogOut,
  ChevronDown,
  Settings,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { AuthModal } from './AuthModal';

export const Header: React.FC = () => {
  const { user, isAdmin, setUser, setIsAdmin } = useStore();
  const [mounted, setMounted] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleRole = () => {
    setIsAdmin(!isAdmin);
  };

  const handleLogout = () => {
    setUser(null);
    setIsUserDropdownOpen(false);
  };

  return (
    <>
      <header className="glass-header sticky top-0 z-40 py-3 mb-6 transition-all duration-300">
        <div className="app-container flex items-center justify-between gap-4">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                弹
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg md:text-xl font-black tracking-tight text-gradient">
                  弹壳特工队 · 并列发车平台
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  Next.js Edition
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:block">
                Minimalist Art 极致战力匹配 & 攻略协作
              </span>
            </div>
          </div>

          {/* Center Nav Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/40 p-1 rounded-xl border border-white/5 text-xs font-medium">
            <a
              href="#"
              className="px-3 py-1.5 rounded-lg text-slate-200 bg-white/10 flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Rocket className="w-3.5 h-3.5 text-blue-400" />
              <span>发车大厅</span>
            </a>
            <a
              href="#"
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 flex items-center gap-1.5 transition-all"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>攻略中心</span>
            </a>
            <a
              href="#"
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 flex items-center gap-1.5 transition-all"
            >
              <Calculator className="w-3.5 h-3.5 text-purple-400" />
              <span>战力计算器</span>
            </a>
          </nav>

          {/* Right Actions: Mode Toggle & Auth State */}
          <div className="flex items-center gap-3">
            {mounted && user ? (
              <>
                {/* Creator / Player Mode Toggle Button */}
                <button
                  onClick={handleToggleRole}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                    isAdmin
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-lg shadow-amber-500/10'
                      : 'bg-blue-500/15 border-blue-500/40 text-blue-300 hover:bg-blue-500/25 shadow-lg shadow-blue-500/10'
                  }`}
                  title="点击切换 创作者 / 玩家 身份视角"
                >
                  {isAdmin ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>创作者模式</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>玩家模式</span>
                    </>
                  )}
                </button>

                {/* Authenticated User Badge & Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 transition-all text-left"
                  >
                    {/* User Avatar */}
                    {/* eslint-disable-next-html-element-suppression */}
                    <img
                      src={user.avatar}
                      alt={user.gameNickname || user.wechatName}
                      className="w-7 h-7 rounded-lg object-cover border border-emerald-500/40 shadow-sm"
                    />

                    {/* User Info details */}
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-100 max-w-[100px] truncate leading-tight">
                        {user.gameNickname || user.wechatName}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono leading-tight">
                        ID: {user.gameId || '9582014'}
                      </span>
                    </div>

                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl glass-panel border border-white/10 shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                      <div className="px-3 py-2 border-b border-white/10 mb-1">
                        <p className="font-semibold text-slate-200 truncate">
                          {user.gameNickname}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          ID: {user.gameId} · 微信: {user.wechatName}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          setIsAuthModalOpen(true);
                        }}
                        className="w-full px-3 py-2 text-left text-slate-300 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-blue-400" />
                        <span>修改绑定资料</span>
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full px-3 py-2 text-left text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>退出登录</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Unauthenticated Trigger Button */
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all flex items-center gap-2 group"
              >
                <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                <span>微信一键登录</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal Component */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
};

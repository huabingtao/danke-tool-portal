'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, Shield, User as UserIcon, Gamepad2, Hash, AlertCircle } from 'lucide-react';
import { useStore } from '../store/useStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  {
    name: '特工阿猫',
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: '特工科考',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: '大师杨猫',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  },
  {
    name: '金特工',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, setUser } = useStore();

  const [wechatName, setWechatName] = useState('');
  const [gameId, setGameId] = useState('');
  const [gameNickname, setGameNickname] = useState('');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0].url);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setWechatName(user.wechatName || '');
      setGameId(user.gameId || '');
      setGameNickname(user.gameNickname || '');
      setAvatar(user.avatar || PRESET_AVATARS[0].url);
    } else {
      setWechatName('特工阿猫');
      setGameId('9582014');
      setGameNickname('极速发车-阿猫');
      setAvatar(PRESET_AVATARS[0].url);
    }
    setErrorMsg('');
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId.trim()) {
      setErrorMsg('请输入《弹壳特工队》游戏 ID (如 9582014)');
      return;
    }
    if (!gameNickname.trim()) {
      setErrorMsg('请输入游戏昵称');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    setTimeout(() => {
      setUser({
        openId: user?.openId || `wx_${Math.random().toString(36).substring(2, 11)}`,
        wechatName: wechatName.trim() || '微信用户',
        avatar,
        gameId: gameId.trim(),
        gameNickname: gameNickname.trim(),
      });
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      <div 
        className="glass-panel relative w-full max-w-md rounded-2xl p-6 shadow-2xl border border-white/10 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Glow Decorator */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 shadow-md">
              <Sparkles className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                微信快捷授权与资料绑定
              </h3>
              <p className="text-xs text-slate-400">
                绑定游戏 ID 以同步发车与战力数据
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="关闭对话框"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Avatar Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              选择特工头像
            </label>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_AVATARS.map((item) => {
                const isSelected = avatar === item.url;
                return (
                  <button
                    key={item.url}
                    type="button"
                    onClick={() => setAvatar(item.url)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all p-1 flex flex-col items-center bg-slate-900/50 ${
                      isSelected
                        ? 'border-emerald-400 ring-2 ring-emerald-500/30 scale-105'
                        : 'border-white/10 hover:border-slate-500 opacity-75 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-html-element-suppression */}
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <span className="text-[10px] text-slate-300 mt-1 truncate w-full text-center">
                      {item.name}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* WeChat Nickname */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              微信昵称
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={wechatName}
                onChange={(e) => setWechatName(e.target.value)}
                placeholder="例如：特工阿猫"
                className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-sm placeholder-slate-500"
              />
            </div>
          </div>

          {/* Game ID */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              游戏 ID <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                placeholder="例如：9582014"
                required
                className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-sm placeholder-slate-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              可进入《弹壳特工队》个人主页复制 7-9 位数字 ID
            </p>
          </div>

          {/* Game Nickname */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              游戏昵称 <span className="text-emerald-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={gameNickname}
                onChange={(e) => setGameNickname(e.target.value)}
                placeholder="例如：阿猫冲超高分"
                required
                className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-sm placeholder-slate-500"
              />
            </div>
          </div>

          {/* Buttons Footer */}
          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/5 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>绑定中...</span>
              ) : (
                <>
                  <Shield className="w-4 h-4" /> 确认授权并绑定
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Lock,
  Users,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  Info,
  Calendar,
  Target,
  ShieldAlert,
  LogIn,
  Search,
  Filter,
  ArrowRight,
  UserCheck,
  X,
  Radio,
  Flame,
  Award,
  ChevronRight,
} from 'lucide-react';
import { useStore, Batch } from '../store/useStore';
import { AuthModal } from './AuthModal';

export interface BatchLobbyProps {
  onEnterCabin?: (batchId: string) => void;
}

// Sample mock roster players for detailed player info display
const MOCK_ROSTER_PLAYERS = [
  {
    openId: 'wx_mock_01',
    wechatName: '特工队长阿猫',
    gameNickname: '极速发车-阿猫',
    gameId: '9582014',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    bookedAt: Date.now() - 1000 * 60 * 12,
    role: '队长/发车人',
  },
  {
    openId: 'wx_mock_02',
    wechatName: '战力担当科考',
    gameNickname: '特工科考神杀',
    gameId: '9582018',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    bookedAt: Date.now() - 1000 * 60 * 8,
    role: '核心打手',
  },
  {
    openId: 'wx_mock_03',
    wechatName: '大师杨猫',
    gameNickname: '大师-无敌猫咪',
    gameId: '9582022',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    bookedAt: Date.now() - 1000 * 60 * 5,
    role: '队友',
  },
  {
    openId: 'wx_mock_04',
    wechatName: '金特工小王',
    gameNickname: '黄金特工宝',
    gameId: '9582099',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    bookedAt: Date.now() - 1000 * 60 * 2,
    role: '队友',
  },
];

export const BatchLobby: React.FC<BatchLobbyProps> = ({ onEnterCabin }) => {
  const { user, batches, bookings, bookBatch } = useStore();

  // Timer refresh ticker (updates state every 1 sec to refresh remaining cooldown countdown)
  const [now, setNow] = useState<number>(Date.now());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedRosterBatch, setSelectedRosterBatch] = useState<Batch | null>(null);
  const [selectedQrBatch, setSelectedQrBatch] = useState<Batch | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'my'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Set up 1-second interval to update remaining seconds live
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Show auto-disappearing toast alerts
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Get current user's booking info
  const userBooking = user ? bookings[user.openId] : null;

  // Calculate cooldown state for current user
  const getUserCooldownInfo = () => {
    if (!userBooking) return { isBooked: false, secondsLeft: 0, isLocked: false };
    const bookedAt = userBooking.bookedAt || now;
    const elapsedSeconds = Math.floor((now - bookedAt) / 1000);
    const secondsLeft = Math.max(0, 180 - elapsedSeconds);
    return {
      isBooked: true,
      batchId: userBooking.batchId,
      secondsLeft,
      isCooldown: secondsLeft > 0,
      isLocked: true, // Hard lock remains active both during and after cooldown
    };
  };

  const cooldownInfo = getUserCooldownInfo();

  // Reservation click handler
  const handleReserve = (batch: Batch) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    if (batch.status === 'invalid') {
      showToast('⚠️ 该班次当前处于失效/暂停状态，无法预约');
      return;
    }

    if (userBooking) {
      if (userBooking.batchId === batch.id) {
        showToast('ℹ️ 你已预约此班次');
      } else {
        showToast('⚠️ 每位玩家同一时间只能预约一个发车班次，请勿重复预约');
      }
      return;
    }

    bookBatch(user.openId, batch.id);
    showToast(`🎉 预约成功！3 分钟 (180 秒) 实时冷静锁已启动`);
  };

  // Handle attempt to cancel / modify reservation
  const handleCancelClick = () => {
    if (!cooldownInfo.isBooked) return;
    if (cooldownInfo.isCooldown) {
      showToast(`🔒 预约锁死中 (冷静期还剩 ${cooldownInfo.secondsLeft} 秒)，期间严格禁止任何退改撤销操作！`);
    } else {
      showToast(`🔒 3 分钟冷静期已结束，班次维持硬锁定状态。如需变更请联系班次发起人！`);
    }
  };

  // Handle entering cabin
  const handleEnterCabinClick = (batchId: string) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (onEnterCabin) {
      onEnterCabin(batchId);
    } else {
      showToast(`🚗 正在进入班次车厢 [${batchId}]...`);
    }
  };

  // Filtered batch list
  const filteredBatches = batches.filter((b) => {
    if (filter === 'active' && b.status !== 'active') return false;
    if (filter === 'my' && (!userBooking || userBooking.batchId !== b.id)) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchNotice = b.notice.toLowerCase().includes(term);
      const matchTime = b.time.includes(term);
      const matchDate = b.date.includes(term);
      return matchNotice || matchTime || matchDate;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-md bg-slate-900/95 border border-emerald-500/40 text-emerald-300 p-4 rounded-2xl shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 animate-spin-slow" />
            <p className="text-xs font-semibold leading-relaxed">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lobby Header & Statistics */}
      <div className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden border border-white/10">
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>实时并行发车大厅</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>每日发车班次大厅</span>
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                严格预约锁死
              </span>
            </h2>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl">
              选择适合的攻防发车班次，准时卡点打满 106 分。预约后享 3 分钟 (180 秒) 实时冷静锁保护，期满后维持硬锁定。
            </p>
          </div>

          {/* Key Stat Cards */}
          <div className="grid grid-cols-3 gap-3 md:gap-4 shrink-0">
            <div className="glass-card p-3 md:p-4 rounded-xl border border-white/10 text-center">
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>总班次数</span>
              </div>
              <div className="text-xl md:text-2xl font-black text-white">{batches.length}</div>
            </div>

            <div className="glass-card p-3 md:p-4 rounded-xl border border-white/10 text-center">
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1 mb-1">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>总上车特工</span>
              </div>
              <div className="text-xl md:text-2xl font-black text-emerald-400">
                {batches.reduce((sum, b) => sum + b.currentCount, 0)}
              </div>
            </div>

            <div className="glass-card p-3 md:p-4 rounded-xl border border-white/10 text-center">
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1 mb-1">
                <Target className="w-3.5 h-3.5 text-amber-400" />
                <span>目标分数</span>
              </div>
              <div className="text-xl md:text-2xl font-black text-amber-300">106分</div>
            </div>
          </div>
        </div>

        {/* Global User Lock Status Banner */}
        {cooldownInfo.isBooked && (
          <div className="mt-6 p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    你已成功预约班次：[{cooldownInfo.batchId}]
                  </span>
                  {cooldownInfo.isCooldown ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                      🔒 预约锁死中 (冷静期还剩 {cooldownInfo.secondsLeft} 秒)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      🔒 已硬锁定 (冷静期已结束)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {cooldownInfo.isCooldown
                    ? `冷静期内严格禁止任何退改撤销操作 (${cooldownInfo.secondsLeft}s 倒计时中)`
                    : '已完成冷静期锁定，保持班次阵型稳定，等待发车信号。'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleCancelClick}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex-1 sm:flex-initial transition-colors cursor-not-allowed"
                title="处于硬锁定及冷静保护期，无法撤销"
              >
                🔒 禁止退改撤销
              </button>

              <button
                onClick={() => handleEnterCabinClick(cooldownInfo.batchId!)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial"
              >
                🚗 进入发车车厢
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-medium w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>全部班次 ({batches.length})</span>
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              filter === 'active'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>发车中班次</span>
          </button>
          <button
            onClick={() => setFilter('my')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              filter === 'my'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>我的预约</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索班次、时间或指令..."
            className="w-full glass-input pl-9 pr-3 py-2 rounded-xl text-xs placeholder-slate-500"
          />
        </div>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBatches.length === 0 ? (
          <div className="col-span-full glass-panel rounded-2xl p-12 text-center text-slate-400 space-y-3">
            <Info className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-semibold">暂无符合条件的发车班次</p>
            <p className="text-xs text-slate-500">请更改筛选条件或等待创作者发布最新发车班次。</p>
          </div>
        ) : (
          filteredBatches.map((batch) => {
            const isUserBookedThis = cooldownInfo.isBooked && cooldownInfo.batchId === batch.id;
            const isFull = batch.currentCount >= batch.maxCapacity;
            const isInvalid = batch.status === 'invalid';
            const progressPercent = Math.min(100, Math.round((batch.currentCount / batch.maxCapacity) * 100));

            return (
              <div
                key={batch.id}
                className={`glass-card rounded-2xl p-6 transition-all duration-300 border relative overflow-hidden flex flex-col justify-between ${
                  isUserBookedThis
                    ? 'border-emerald-500/50 bg-emerald-950/20 shadow-xl shadow-emerald-500/10'
                    : isInvalid
                    ? 'border-rose-500/20 bg-rose-950/10 opacity-75'
                    : 'border-white/10 hover:border-slate-500/40 hover:shadow-lg'
                }`}
              >
                {/* Status Badges Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {/* eslint-disable-next-html-element-suppression */}
                      <img
                        src={batch.avatarUrl}
                        alt="班次头像"
                        className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-md"
                      />
                      {isUserBookedThis && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center shadow-md">
                          <CheckCircle2 className="w-3.5 h-3.5 font-bold" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-white tracking-tight">
                          {batch.time} 发车班次
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-white/10">
                          {batch.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        <span>日期: {batch.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status Pill */}
                  <div>
                    {isInvalid ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> 已失效
                      </span>
                    ) : isUserBookedThis ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> 已预约锁死
                      </span>
                    ) : isFull ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> 已满员
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/20 border border-blue-500/40 text-blue-300 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" /> 招募中
                      </span>
                    )}
                  </div>
                </div>

                {/* Batch Announcement / Instructions */}
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 mb-4 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" /> 创作者班次指令/公告
                    </span>
                    <span className="text-amber-300 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" /> 目标: {batch.targetScore} 分停手
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-medium">
                    {batch.notice}
                  </p>
                </div>

                {/* Capacity Progress Bar & Detailed Player Info Trigger */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-300" />
                      当前班次容量
                    </span>
                    <span className="font-mono font-bold text-white">
                      <span className="text-emerald-400">{batch.currentCount}</span> / {batch.maxCapacity} 人 ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        progressPercent >= 100
                          ? 'bg-amber-400'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Trigger to view detailed player roster */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setSelectedRosterBatch(batch)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>查看明细玩家列表 (头像/昵称/ID)</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setSelectedQrBatch(batch)}
                      className="text-xs text-slate-400 hover:text-white font-medium flex items-center gap-1 transition-colors"
                    >
                      <QrCode className="w-3.5 h-3.5 text-purple-400" />
                      <span>查看发车二维码</span>
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-white/10 flex items-center gap-3">
                  {isUserBookedThis ? (
                    <div className="w-full flex items-center gap-2">
                      <button
                        onClick={handleCancelClick}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold border border-white/10 hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center gap-1 cursor-not-allowed"
                        title="冷静期及硬锁定保护中"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>退改锁死</span>
                      </button>

                      <button
                        onClick={() => handleEnterCabinClick(batch.id)}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group"
                      >
                        <span>🚗 进入发车车厢</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex items-center gap-2">
                      <button
                        onClick={() => handleReserve(batch)}
                        disabled={isFull || isInvalid || cooldownInfo.isBooked}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          isInvalid || isFull || cooldownInfo.isBooked
                            ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 shadow-md'
                        }`}
                      >
                        {cooldownInfo.isBooked ? (
                          <>
                            <Lock className="w-3.5 h-3.5" /> 已预约其他班次
                          </>
                        ) : isFull ? (
                          <>
                            <Users className="w-3.5 h-3.5" /> 班次已满
                          </>
                        ) : isInvalid ? (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" /> 班次失效
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5" /> 预约本班次 (3分钟冷静锁)
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleEnterCabinClick(batch.id)}
                        className="px-4 py-2.5 rounded-xl glass-button text-slate-200 text-xs font-semibold hover:text-white flex items-center gap-1 transition-all"
                      >
                        <span>进入车厢</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detailed Player Info Modal (明细玩家信息) */}
      {selectedRosterBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div
            className="glass-panel relative w-full max-w-xl rounded-2xl p-6 shadow-2xl border border-white/10 overflow-hidden text-slate-100 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    班次明细玩家列表 [{selectedRosterBatch.time}]
                  </h3>
                  <p className="text-xs text-slate-400">
                    查看此班次预约特工的微信头像、游戏昵称与游戏 ID
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRosterBatch(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Roster List Body */}
            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {/* If current user is booked in this batch, show user first */}
              {user && userBooking?.batchId === selectedRosterBatch.id && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-html-element-suppression */}
                    <img
                      src={user.avatar}
                      alt={user.gameNickname}
                      className="w-10 h-10 rounded-xl object-cover border border-emerald-400 shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-white">
                          {user.gameNickname}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          你自己
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 font-mono">
                        <span>微信号: {user.wechatName}</span>
                        <span>游戏 ID: {user.gameId}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> 已锁定
                  </span>
                </div>
              )}

              {/* Render Mock Roster Players */}
              {MOCK_ROSTER_PLAYERS.map((player) => (
                <div
                  key={player.openId}
                  className="p-3 rounded-xl bg-slate-900/50 border border-white/5 hover:border-white/10 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-html-element-suppression */}
                    <img
                      src={player.avatar}
                      alt={player.gameNickname}
                      className="w-10 h-10 rounded-xl object-cover border border-white/10"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">
                          {player.gameNickname}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {player.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 font-mono">
                        <span>微信: {player.wechatName}</span>
                        <span>游戏 ID: {player.gameId}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">
                      预约已锁定
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">106分匹配中</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-white/10 mt-3 flex justify-end">
              <button
                onClick={() => setSelectedRosterBatch(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedQrBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div
            className="glass-panel relative w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-white/10 text-center text-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-purple-400" />
                <span>[{selectedQrBatch.time}] 发车群/特工二维码</span>
              </h3>
              <button
                onClick={() => setSelectedQrBatch(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-white rounded-2xl inline-block shadow-xl">
              {/* eslint-disable-next-html-element-suppression */}
              <img
                src={selectedQrBatch.qrCodeUrl}
                alt="发车二维码"
                className="w-48 h-48 mx-auto object-contain"
              />
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              扫码加入班次群或在游戏内搜索 ID / 特工头像完成匹配。
            </p>

            <button
              onClick={() => setSelectedQrBatch(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal Trigger for Unauthenticated users */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

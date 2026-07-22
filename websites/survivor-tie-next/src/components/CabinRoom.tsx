'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Users,
  QrCode,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ZoomIn,
  X,
  Radio,
  Flame,
  Shield,
  RefreshCw,
  UserCheck,
  Zap,
  Info,
  Check,
} from 'lucide-react';
import { useStore, Batch, User } from '../store/useStore';
import { usePrecisionTimer } from '../hooks/usePrecisionTimer';

export interface CabinRoomProps {
  batch: Batch;
  onBackLobby: () => void;
}

// 示例队员名录 (当显示发车车厢队员时使用)
const MOCK_CABIN_MEMBERS = [
  {
    openId: 'wx_player_001',
    gameNickname: '暗影特工·阿猫01',
    gameId: '9582014',
    avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
    role: '队长 / 发车人',
    status: 'ready',
  },
  {
    openId: 'wx_player_002',
    gameNickname: '战力担当·科考猫',
    gameId: '8849201',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    role: '核心打手',
    status: 'ready',
  },
  {
    openId: 'wx_player_003',
    gameNickname: '极光漫游猫',
    gameId: '7730129',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    role: '队员',
    status: 'ready',
  },
  {
    openId: 'wx_player_004',
    gameNickname: '绝境突围·猫哥',
    gameId: '6629104',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    role: '队员',
    status: 'ready',
  },
  {
    openId: 'wx_player_005',
    gameNickname: '战术大师·猫叔',
    gameId: '9920183',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80',
    role: '队员',
    status: 'ready',
  },
];

export const CabinRoom: React.FC<CabinRoomProps> = ({ batch, onBackLobby }) => {
  const { user, unlockBooking, markBatchInvalid } = useStore();
  
  // 1. 调用高精度秒/毫秒级跳跃倒计时 Hook
  const { hours, mins, secs, ms } = usePrecisionTimer(batch.time);

  // 状态管理
  const [showQrModal, setShowQrModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  // 提示消息淡出
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg(null);
    }, 3000);
  };

  // 复制公告说明
  const handleCopyNotice = () => {
    if (batch.notice) {
      navigator.clipboard.writeText(batch.notice);
      setCopiedNotice(true);
      triggerToast('已复制战术公告至剪贴板');
      setTimeout(() => setCopiedNotice(false), 2000);
    }
  };

  // 2. 混入路人即小队作废与一键重新排队处理
  const handleConfirmAutoInvalidAndRequeue = () => {
    setShowConfirmModal(false);

    // 如果用户已登录，解除用户预约锁定
    if (user && user.openId) {
      unlockBooking(user.openId);
    }

    // 标记当前班次状态 (可选)
    if (batch.id) {
      markBatchInvalid(batch.id);
    }

    // 弹出“已自动解除锁定”提示
    triggerToast('已自动解除锁定，即刻为您返回大厅重新预约排队！');

    // 延迟片刻后平滑返回大厅引导玩家重新排队
    setTimeout(() => {
      onBackLobby();
    }, 1000);
  };

  // 组装队员名录 (加入当前登录用户)
  const rosterMembers = [...MOCK_CABIN_MEMBERS];
  if (user) {
    const exists = rosterMembers.some((m) => m.openId === user.openId);
    if (!exists) {
      rosterMembers.unshift({
        openId: user.openId,
        gameNickname: user.gameNickname || user.wechatName || '特工指挥官',
        gameId: user.gameId || '9582014',
        avatar: user.avatar || batch.avatarUrl,
        role: '自己 (己方特工)',
        status: 'ready',
      });
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Toast 提示浮窗 */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/90 text-white font-semibold text-sm shadow-2xl backdrop-blur-md border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 顶部导航与班次概况 Header Bar */}
      <div className="glass-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 border border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackLobby}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white transition-all text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回发车大厅</span>
          </button>

          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center gap-1.5 animate-pulse">
              <Radio className="w-3.5 h-3.5" /> 高精发车车厢
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              【{batch.time} 冲刺班】发车大厅
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            🎯 目标: {batch.targetScore} 分
          </span>
          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            👥 已预订 {batch.currentCount} / {batch.maxCapacity} 人
          </span>
        </div>
      </div>

      {/* 高精度秒级/毫秒级卡点倒计时 Hero Display Section */}
      <section className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 shadow-2xl shadow-cyan-500/10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-sm font-bold text-slate-200 tracking-wide">
              距离 {batch.time} 统一卡点出击倒计时
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-3.5 py-1.5 rounded-full border border-cyan-500/20">
            <Zap className="w-3.5 h-3.5" />
            <span>performance.now() 毫秒级防休眠引擎已校准</span>
          </div>
        </div>

        {/* 大字号 HH:MM:SS.ms 动态跳跃展示 */}
        <div className="py-4 my-2 flex items-center justify-center gap-2 md:gap-4 font-mono select-none relative z-10">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <div className="w-20 sm:w-28 md:w-36 h-20 sm:h-28 md:h-36 rounded-2xl bg-black/50 border border-white/15 flex items-center justify-center shadow-inner backdrop-blur-md">
              <span className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-wider drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                {hours}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400 mt-2">时</span>
          </div>

          <span className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-cyan-400 self-center -mt-6">
            :
          </span>

          {/* Mins */}
          <div className="flex flex-col items-center">
            <div className="w-20 sm:w-28 md:w-36 h-20 sm:h-28 md:h-36 rounded-2xl bg-black/50 border border-white/15 flex items-center justify-center shadow-inner backdrop-blur-md">
              <span className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-wider drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                {mins}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400 mt-2">分</span>
          </div>

          <span className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-cyan-400 self-center -mt-6">
            :
          </span>

          {/* Secs */}
          <div className="flex flex-col items-center">
            <div className="w-20 sm:w-28 md:w-36 h-20 sm:h-28 md:h-36 rounded-2xl bg-black/50 border border-cyan-500/40 flex items-center justify-center shadow-inner backdrop-blur-md bg-cyan-950/20">
              <span className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-cyan-300 tracking-wider drop-shadow-[0_0_20px_rgba(6,182,212,0.6)]">
                {secs}
              </span>
            </div>
            <span className="text-xs font-semibold text-cyan-400 mt-2">秒</span>
          </div>

          <span className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-amber-400 self-center -mt-6">
            .
          </span>

          {/* Milliseconds */}
          <div className="flex flex-col items-center">
            <div className="w-16 sm:w-24 md:w-28 h-20 sm:h-28 md:h-36 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center shadow-inner backdrop-blur-md">
              <span className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-amber-400 tracking-wider drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                {ms}
              </span>
            </div>
            <span className="text-xs font-semibold text-amber-400 mt-2">毫秒</span>
          </div>
        </div>

        {/* 底部秒针提醒 Banner */}
        <div className="mt-6 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-3 text-cyan-300 text-xs md:text-sm leading-relaxed relative z-10">
          <Info className="w-5 h-5 shrink-0 text-cyan-400" />
          <span>
            <strong>踩点提示：</strong>发车前 10 秒请保持在游戏发车主界面，听到秒针发车指示音后，踩点 <strong>00 毫秒</strong> 所有人同时点击进入副本！
          </span>
        </div>
      </section>

      {/* 战术公告与专属微信群、统一头像更换 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 卡片 1: 专属微信战术群二维码 */}
        <div className="glass-panel rounded-2xl p-6 space-y-4 border border-white/10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">专属微信战术群</h3>
                  <p className="text-xs text-slate-400">扫码入群，听取队长实时语音指引</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                官方战队群
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-black/30 border border-white/5">
              <div
                onClick={() => setShowQrModal(true)}
                className="relative group cursor-pointer shrink-0"
              >
                <img
                  src={batch.qrCodeUrl}
                  alt="微信群二维码"
                  className="w-36 h-36 rounded-xl object-cover border-2 border-emerald-500/30 transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-white text-xs font-medium">
                  <ZoomIn className="w-5 h-5" />
                  <span>放大预览</span>
                </div>
              </div>

              <div className="space-y-2 text-center sm:text-left">
                <div className="text-xs text-slate-300">
                  <span className="text-slate-400">发车总指挥：</span>
                  <strong className="text-amber-400 font-bold">特工队长阿猫</strong>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  请各位车友加入发车战术群，保持群消息提醒开启。入群后改群名片为游戏内 ID 方便对号。
                </p>
                <button
                  onClick={() => setShowQrModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold pt-1"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> 点击放大查看完整二维码
                </button>
              </div>
            </div>
          </div>

          {/* 战术公告 */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-white/5 flex items-start justify-between gap-3 text-xs text-slate-300">
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold">📢 班次战术公告:</span>
              <p className="line-clamp-2">{batch.notice}</p>
            </div>
            <button
              onClick={handleCopyNotice}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white shrink-0 transition-all flex items-center gap-1"
              title="复制公告"
            >
              {copiedNotice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{copiedNotice ? '已复制' : '复制'}</span>
            </button>
          </div>
        </div>

        {/* 卡片 2: 统一游戏头像更换说明 (特工阿猫) */}
        <div className="glass-panel rounded-2xl p-6 space-y-4 border border-white/10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">统一游戏头像更换说明</h3>
                  <p className="text-xs text-slate-400">防路人混入核心校验暗语</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                必须更换
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-black/30 border border-amber-500/20">
              <div className="relative shrink-0">
                <img
                  src={batch.avatarUrl}
                  alt="特工阿猫统一头像"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-400 shadow-lg shadow-amber-500/20"
                />
                <span className="absolute -bottom-2 inset-x-0 mx-auto w-max px-2 py-0.5 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider shadow">
                  特工阿猫
                </span>
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    进入游戏个人主页 &rarr; 点击更换头像 &rarr; 选中 <strong>「特工阿猫」</strong> 头像。
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    匹配成功后立刻核对本小队同组头像，如发现非特工阿猫玩家即为野生路人。
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    确认全员更换后打到目标分数 <strong>{batch.targetScore} 分</strong> 即刻停手并列拿奖！
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-300/90 leading-relaxed flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>重要：统一更换头像可确保精准识别同路车友，防止野生路人卷分破坏并列大局。</span>
          </div>
        </div>
      </div>

      {/* 车队已集结队员名录 Roster Grid */}
      <section className="glass-panel rounded-2xl p-6 space-y-4 border border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              车厢集结特工名录 ({rosterMembers.length} / {batch.maxCapacity} 人)
            </h3>
          </div>
          <span className="text-xs text-slate-400">已微信校验锁定席位</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {rosterMembers.map((member, idx) => (
            <div
              key={`${member.openId}-${idx}`}
              className="p-3 rounded-xl bg-slate-800/40 border border-white/5 flex items-center justify-between hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-center gap-3">
                <img
                  src={member.avatar}
                  alt={member.gameNickname}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-200">
                      {member.gameNickname}
                    </span>
                    {member.openId === user?.openId && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold">
                        我
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-mono">ID: {member.gameId}</span>
                </div>
              </div>

              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> 已就绪
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ⚠️ 混入路人即小队作废与一键重新排队 (Auto Invalid & Re-queue) Danger Box */}
      <section className="glass-panel rounded-2xl p-6 border border-rose-500/30 bg-rose-950/10 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-base font-bold text-rose-200">
              避险保护规则：混入路人即小队作废与一键重新排队
            </h4>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              如果在匹配进入对决后，发现本组内混入了未更换「特工阿猫」头像的野生路人玩家，全组将无法保证 200 人同分并列。
              点击下方按钮确认后，系统将自动调用 <code>unlockBooking</code> 解除您的预约锁定限制，并引导您返回发车大厅重新排队预约新班次！
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setShowConfirmModal(true)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-600 text-white font-bold text-sm shadow-xl shadow-rose-900/30 border border-rose-400/30 transition-all flex items-center justify-center gap-2 group"
          >
            <AlertTriangle className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
            <span>【⚠️ 本组有路人混入，直接作废并重新排队】</span>
          </button>
        </div>
      </section>

      {/* 微信二维码放大预览 Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 relative border border-white/20 space-y-4 text-center">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white pt-2">微信扫描加入战术微信群</h3>
            <p className="text-xs text-slate-400">【{batch.time} 冲刺班】专属沟通群</p>

            <div className="p-4 rounded-2xl bg-white flex items-center justify-center max-w-xs mx-auto shadow-2xl">
              <img
                src={batch.qrCodeUrl}
                alt="微信二维码大图"
                className="w-64 h-64 object-contain"
              />
            </div>

            <p className="text-xs text-slate-300">
              长按保存图片或打开微信识别二维码加入战队
            </p>
          </div>
        </div>
      )}

      {/* 路人混入作废/重新排队 Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-6 md:p-8 relative border border-rose-500/40 space-y-6 text-slate-200">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-7 h-7" />
              <h3 className="text-xl font-extrabold text-white">确认本小队有路人混入？</h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/10">
              <p className="font-semibold text-rose-300">系统将执行以下避险解除操作：</p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                <li>自动调用 <code>unlockBooking</code> 解除您当前账号的班次预约锁定</li>
                <li>弹出提示“已自动解除锁定”</li>
                <li>即刻返回发车大厅引导您重新排队预约全新班次</li>
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-medium text-sm transition-all"
              >
                取消操作
              </button>
              <button
                onClick={handleConfirmAutoInvalidAndRequeue}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/40 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>确认解除并重新排队</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CabinRoom;

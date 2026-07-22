'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Target,
  Users,
  Image as ImageIcon,
  QrCode,
  Megaphone,
  PlusCircle,
  Edit3,
  Ban,
  Trash2,
  Check,
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Filter,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useStore, Batch } from '../store/useStore';

// Preset Avatars for quick selection
const PRESET_AVATARS = [
  {
    name: '特工阿猫',
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: '特工阿狗',
    url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: '特工熊熊',
    url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&auto=format&fit=crop&q=80',
  },
  {
    name: '特工狐狐',
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
  },
];

// Preset QR Code templates for quick creation
const PRESET_QRS = [
  {
    label: '冲刺106分群',
    url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TieGroup106',
  },
  {
    label: '早班车组队群',
    url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MorningGroup',
  },
  {
    label: '夜战精英群',
    url: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NightGroup',
  },
];

export const AdminPanel: React.FC = () => {
  const { batches, addBatch, updateBatch, deleteBatch, markBatchInvalid } =
    useStore();

  // Form State with specified defaults: targetScore = 106, maxCapacity = 200
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '20:00:00',
    targetScore: 106,
    maxCapacity: 200,
    avatarUrl: PRESET_AVATARS[0].url,
    qrCodeUrl: PRESET_QRS[0].url,
    notice:
      '【全员必看】统一佩戴指定战队头像！请在入场后控制输出，达到 106 分即刻停手共享史诗配件！',
  });

  // UI States
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'invalid'>('all');
  const [notification, setNotification] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (type: 'success' | 'info' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  // Handle new batch submission
  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.time) {
      showNotification('error', '请填写发车日期与发车时间');
      return;
    }

    const newBatch: Batch = {
      id: `batch-${Date.now().toString().slice(-6)}`,
      date: formData.date,
      time: formData.time,
      targetScore: Number(formData.targetScore) || 106,
      maxCapacity: Number(formData.maxCapacity) || 200,
      currentCount: 0,
      avatarUrl: formData.avatarUrl.trim(),
      qrCodeUrl: formData.qrCodeUrl.trim(),
      notice: formData.notice.trim(),
      status: 'active',
    };

    addBatch(newBatch);
    showNotification('success', `成功发布发车班次 #${newBatch.id}！`);

    // Reset optional notice field while keeping useful defaults
    setFormData((prev) => ({
      ...prev,
      time: '21:00:00',
      notice:
        '【新发车班次】统一头像入场，目标 106 分并列拿满奖励！',
    }));
  };

  // Handle edit batch submit
  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    updateBatch(editingBatch);
    showNotification('info', `班次 #${editingBatch.id} 已成功修改`);
    setEditingBatch(null);
  };

  // Handle delete execution
  const handleDeleteBatch = (id: string) => {
    deleteBatch(id);
    setDeleteConfirmId(null);
    showNotification('info', `班次 #${id} 已安全删除`);
  };

  // Filtered batches logic
  const filteredBatches = batches.filter((b) => {
    if (filterStatus === 'active') return b.status === 'active';
    if (filterStatus === 'invalid') return b.status === 'invalid';
    return true;
  });

  // Calculate summary metrics
  const totalActive = batches.filter((b) => b.status === 'active').length;
  const totalInvalid = batches.filter((b) => b.status === 'invalid').length;
  const totalRecruiting = batches.reduce((acc, b) => acc + b.maxCapacity, 0);
  const totalBooked = batches.reduce((acc, b) => acc + b.currentCount, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification Banner */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 text-xs font-semibold backdrop-blur-md transition-all animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : 'bg-blue-950/90 border-blue-500/50 text-blue-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Banner */}
      <section className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden border border-amber-500/20">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 创作者控制台
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> 权限已认证
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight">
              发车班次管理与控制中心
            </h1>
            <p className="text-xs text-slate-400">
              发布新发车班次、配置战队统一头像、微信群二维码及查看管理已发布车次。
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card p-3 rounded-xl border border-white/5 text-center">
              <div className="text-[10px] text-slate-400">总发车班次</div>
              <div className="text-lg font-extrabold text-slate-100">{batches.length}</div>
            </div>
            <div className="glass-card p-3 rounded-xl border border-emerald-500/20 text-center bg-emerald-500/5">
              <div className="text-[10px] text-emerald-400 font-medium">进行中车次</div>
              <div className="text-lg font-extrabold text-emerald-300">{totalActive}</div>
            </div>
            <div className="glass-card p-3 rounded-xl border border-blue-500/20 text-center bg-blue-500/5">
              <div className="text-[10px] text-blue-400 font-medium">累计招募率</div>
              <div className="text-lg font-extrabold text-blue-300">
                {totalRecruiting > 0 ? Math.round((totalBooked / totalRecruiting) * 100) : 0}%
              </div>
            </div>
            <div className="glass-card p-3 rounded-xl border border-rose-500/20 text-center bg-rose-500/5">
              <div className="text-[10px] text-rose-400 font-medium">已作废班次</div>
              <div className="text-lg font-extrabold text-rose-300">{totalInvalid}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Publish Form (Left) & Batches List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Publish Form Section */}
        <section className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">发布新发车班次</h2>
                  <p className="text-[11px] text-slate-400">填写班次参数后一键发布至大厅</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              {/* Row 1: Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>发车日期</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full glass-input px-3 py-2 rounded-xl text-slate-100 text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>发车时间</span>
                  </label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full glass-input px-3 py-2 rounded-xl text-slate-100 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Row 2: Target Score & Capacity (Defaults: 106分 & 200人) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-amber-400" />
                      <span>目标积分</span>
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">默认 106 分</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={999}
                      value={formData.targetScore}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          targetScore: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full glass-input px-3 py-2 rounded-xl text-slate-100 text-xs font-mono pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-slate-400">分</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>招募名额</span>
                    </span>
                    <span className="text-[10px] text-purple-400 font-mono">默认 200 人</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={1}
                      max={1000}
                      value={formData.maxCapacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxCapacity: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full glass-input px-3 py-2 rounded-xl text-slate-100 text-xs font-mono pr-8"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] text-slate-400">人</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Unified Avatar Selection & Custom URL */}
              <div className="space-y-2 pt-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
                  <span>统一头像指示图 URL</span>
                </label>

                {/* Preset Avatars Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatarUrl: item.url })}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] transition-all flex-shrink-0 ${
                        formData.avatarUrl === item.url
                          ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-bold'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {/* eslint-disable-next-html-element-suppression */}
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    required
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    placeholder="请输入头像图片链接 (https://...)"
                    className="w-full glass-input px-3 py-2 rounded-xl text-slate-100 text-xs font-mono"
                  />
                  {formData.avatarUrl && (
                    <div className="w-9 h-9 rounded-xl border border-white/20 overflow-hidden flex-shrink-0 bg-slate-950">
                      {/* eslint-disable-next-html-element-suppression */}
                      <img
                        src={formData.avatarUrl}
                        alt="Avatar Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Row 4: WeChat Group QR Code */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>微信群二维码 URL</span>
                </label>

                {/* Preset QR options */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_QRS.map((qr) => (
                    <button
                      key={qr.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, qrCodeUrl: qr.url })}
                      className={`px-2 py-1 rounded-lg border text-[10px] transition-all flex-shrink-0 ${
                        formData.qrCodeUrl === qr.url
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold'
                          : 'bg-slate-900/40 border-white/10 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {qr.label}
                    </button>
                  ))}
                </div>

                <input
                  type="url"
                  required
                  value={formData.qrCodeUrl}
                  onChange={(e) => setFormData({ ...formData, qrCodeUrl: e.target.value })}
                  placeholder="微信群二维码图片链接"
                  className="w-full glass-input px-3 py-2 rounded-xl text-slate-100 text-xs font-mono"
                />
              </div>

              {/* Row 5: Shift Announcement */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-blue-400" />
                  <span>班次公告说明</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.notice}
                  onChange={(e) => setFormData({ ...formData, notice: e.target.value })}
                  placeholder="请输入针对该班次玩家的打分要求与战队规范..."
                  className="w-full glass-input p-3 rounded-xl text-slate-100 text-xs leading-relaxed"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full glass-button py-3 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>立即发布该班次</span>
              </button>
            </form>
          </div>
        </section>

        {/* Batches List & Management Section */}
        <section className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-6">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">已发布班次列表</h2>
                  <p className="text-[11px] text-slate-400">
                    管理已发布的班次卡片（修改 / 作废 / 删除）
                  </p>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5 text-[11px]">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    filterStatus === 'all'
                      ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>全部 ({batches.length})</span>
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    filterStatus === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>发车中 ({totalActive})</span>
                </button>
                <button
                  onClick={() => setFilterStatus('invalid')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                    filterStatus === 'invalid'
                      ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Ban className="w-3 h-3" />
                  <span>已作废 ({totalInvalid})</span>
                </button>
              </div>
            </div>

            {/* Empty State */}
            {filteredBatches.length === 0 ? (
              <div className="py-12 text-center space-y-3 glass-card rounded-xl border border-white/5">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto opacity-70" />
                <p className="text-xs text-slate-400">暂无符合筛选条件的发车班次</p>
              </div>
            ) : (
              /* Batch Cards List */
              <div className="space-y-4">
                {filteredBatches.map((batch) => {
                  const capacityPercent = Math.min(
                    100,
                    Math.round((batch.currentCount / batch.maxCapacity) * 100)
                  );

                  return (
                    <div
                      key={batch.id}
                      className={`glass-card p-5 rounded-2xl space-y-4 border transition-all ${
                        batch.status === 'invalid'
                          ? 'border-rose-500/30 bg-rose-950/10 opacity-75'
                          : 'border-white/10 hover:border-blue-500/40'
                      }`}
                    >
                      {/* Top Bar: ID, Status, Date/Time */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-blue-400 px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20">
                            #{batch.id}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              batch.status === 'active'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {batch.status === 'active' ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                正常发车中
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3" />
                                已标记作废
                              </>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-300 font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            {batch.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            {batch.time}
                          </span>
                        </div>
                      </div>

                      {/* Main Card Content */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        {/* Avatar & QR Thumbnails */}
                        <div className="sm:col-span-4 flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            {/* eslint-disable-next-html-element-suppression */}
                            <img
                              src={batch.avatarUrl}
                              alt="Avatar"
                              className="w-12 h-12 rounded-xl object-cover border border-emerald-500/40 shadow-md"
                            />
                            <span className="text-[9px] text-slate-400 mt-1">统一头像</span>
                          </div>

                          <div className="flex flex-col items-center">
                            {/* eslint-disable-next-html-element-suppression */}
                            <img
                              src={batch.qrCodeUrl}
                              alt="QR Code"
                              className="w-12 h-12 rounded-xl object-cover border border-blue-500/40 shadow-md bg-white p-0.5"
                            />
                            <span className="text-[9px] text-slate-400 mt-1">微信群码</span>
                          </div>
                        </div>

                        {/* Details & Capacity Progress */}
                        <div className="sm:col-span-8 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-300 flex items-center gap-1">
                              <Target className="w-3.5 h-3.5 text-amber-400" />
                              目标积分: {batch.targetScore} 分
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              已招募: <strong className="text-slate-100">{batch.currentCount}</strong> / {batch.maxCapacity} 人
                            </span>
                          </div>

                          {/* Capacity Progress Bar */}
                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
                            <div
                              className={`h-full transition-all duration-500 ${
                                capacityPercent >= 90
                                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                              }`}
                              style={{ width: `${capacityPercent}%` }}
                            />
                          </div>

                          {/* Notice snippet */}
                          <p className="text-[11px] text-slate-300 line-clamp-2 bg-slate-950/40 p-2 rounded-lg border border-white/5 leading-relaxed">
                            {batch.notice}
                          </p>
                        </div>
                      </div>

                      {/* Card Action Controls: 修改 / 作废 / 删除 */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/5">
                        {/* Edit Button */}
                        <button
                          onClick={() => setEditingBatch({ ...batch })}
                          className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>修改</span>
                        </button>

                        {/* Invalidate / Reactivate Button */}
                        <button
                          onClick={() => {
                            markBatchInvalid(batch.id);
                            showNotification(
                              'info',
                              batch.status === 'active'
                                ? `班次 #${batch.id} 已标记作废`
                                : `班次 #${batch.id} 已恢复正常`
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            batch.status === 'active'
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                          }`}
                        >
                          {batch.status === 'active' ? (
                            <>
                              <Ban className="w-3.5 h-3.5" />
                              <span>作废班次</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>恢复班次</span>
                            </>
                          )}
                        </button>

                        {/* Delete Button with Confirmation Inline UI */}
                        {deleteConfirmId === batch.id ? (
                          <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/50 p-1 rounded-xl animate-in fade-in">
                            <span className="text-[10px] text-rose-200 px-1 font-bold">确认删除?</span>
                            <button
                              onClick={() => handleDeleteBatch(batch.id)}
                              className="p-1 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors"
                              title="确认删除"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                              title="取消"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(batch.id)}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>删除</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Edit Batch Modal */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-white/20 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-bold text-slate-100">
                  修改发车班次 #{editingBatch.id}
                </h3>
              </div>
              <button
                onClick={() => setEditingBatch(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold mb-1 block">发车日期</label>
                  <input
                    type="date"
                    required
                    value={editingBatch.date}
                    onChange={(e) =>
                      setEditingBatch({ ...editingBatch, date: e.target.value })
                    }
                    className="w-full glass-input px-3 py-2 rounded-xl text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold mb-1 block">发车时间</label>
                  <input
                    type="time"
                    step="1"
                    required
                    value={editingBatch.time}
                    onChange={(e) =>
                      setEditingBatch({ ...editingBatch, time: e.target.value })
                    }
                    className="w-full glass-input px-3 py-2 rounded-xl text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold mb-1 block">目标积分</label>
                  <input
                    type="number"
                    required
                    value={editingBatch.targetScore}
                    onChange={(e) =>
                      setEditingBatch({
                        ...editingBatch,
                        targetScore: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full glass-input px-3 py-2 rounded-xl text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold mb-1 block">招募名额</label>
                  <input
                    type="number"
                    required
                    value={editingBatch.maxCapacity}
                    onChange={(e) =>
                      setEditingBatch({
                        ...editingBatch,
                        maxCapacity: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full glass-input px-3 py-2 rounded-xl text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                  统一头像指示图 URL
                </label>
                <input
                  type="url"
                  required
                  value={editingBatch.avatarUrl}
                  onChange={(e) =>
                    setEditingBatch({ ...editingBatch, avatarUrl: e.target.value })
                  }
                  className="w-full glass-input px-3 py-2 rounded-xl text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                  微信群二维码 URL
                </label>
                <input
                  type="url"
                  required
                  value={editingBatch.qrCodeUrl}
                  onChange={(e) =>
                    setEditingBatch({ ...editingBatch, qrCodeUrl: e.target.value })
                  }
                  className="w-full glass-input px-3 py-2 rounded-xl text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                  班次公告
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingBatch.notice}
                  onChange={(e) =>
                    setEditingBatch({ ...editingBatch, notice: e.target.value })
                  }
                  className="w-full glass-input p-3 rounded-xl text-slate-100 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl glass-button text-white text-xs font-bold shadow-lg shadow-blue-500/20"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;

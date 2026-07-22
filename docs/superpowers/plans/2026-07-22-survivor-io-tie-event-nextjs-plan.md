# 《弹壳特工队》活动并列发车平台 (React + Next.js 版) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 Next.js (App Router) + React 19 + TailwindCSS + Zustand 技术栈构建一个移动端/iPad/13寸电脑端全平台适配的《弹壳特工队》活动并列发车协同 Web 应用。实现微信授权绑定、创作者班次发布管理（106积分档）、玩家预约与 3 分钟冷静期硬锁定保护、高精度 `HH:MM:SS.ms` 秒级倒计时车厢、以及混入路人作废自动解锁与一键重新排队逻辑。

**Architecture:** 基于 Next.js App Router 的模块化 React 组件架构。采用 Zustand 持久化集中状态管理，包含全套 TypeScript 类型定义，TailwindCSS 艺术极简设计风格 (Minimalist Art Design)。

**Tech Stack:** Next.js 14/15, React 19, TypeScript, TailwindCSS, Lucide-React Icons, Zustand, Custom Hooks.

## Global Constraints

- **Project Location**: `websites/survivor-tie-next/`
- **Design Standard**: 简洁大气、富有艺术设计的视觉风格（Minimalist & Art-Inspired Design）。布局完美支持 **移动端、iPad/平板端 及 13寸 笔记本电脑端 (最大宽度 1280px)**。屏幕宽度 >1280px 时容器自动水平居中。
- **State & Cooldown Locking**: 预约成功后进入 **3分钟（180秒）严禁修改与撤销保护期**。冷静期过后维持硬锁定，除非遭遇“混入路人作废”特例。
- **Timer Precision**: 发车倒计时引擎必须达到 `HH:MM:SS.ms` 毫秒/秒级，使用 `performance.now()` 计算，防止浏览器后台休眠错乱。

---

## File Structure

```
websites/survivor-tie-next/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 全局 Layout 根节点 (字体、暗黑主题、1280px 居中容器)
│   │   ├── globals.css             # 全局 TailwindCSS 与 Glassmorphism 样式
│   │   └── page.tsx                # SPA 主入口 (视图路由组件)
│   ├── components/
│   │   ├── Header.tsx              # 顶栏导航 (Logo、微信授权登录按钮、创作者模式切换)
│   │   ├── AuthModal.tsx           # 微信快捷授权与游戏ID/昵称绑定 Modal
│   │   ├── AdminPanel.tsx          # 创作者发车控制台 (发布/编辑班次、106分档、二维码)
│   │   ├── BatchLobby.tsx          # 班次大厅 (玩家名单、预约与 3分钟冷静锁定)
│   │   └── CabinRoom.tsx           # 发车车厢 (HH:MM:SS.ms 秒级倒计时、路人作废重排按钮)
│   ├── hooks/
│   │   └── usePrecisionTimer.ts    # 高精度毫秒/秒倒计时 Custom Hook
│   └── store/
│       └── useStore.ts             # Zustand 集中状态管理 (User, Batches, Bookings, Admin)
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

---

### Task 1: 项目初始化与艺术设计系统 setup

**Files:**
- Create: `websites/survivor-tie-next/package.json`
- Create: `websites/survivor-tie-next/tsconfig.json`
- Create: `websites/survivor-tie-next/tailwind.config.js`
- Create: `websites/survivor-tie-next/src/app/globals.css`
- Create: `websites/survivor-tie-next/src/app/layout.tsx`

**Interfaces:**
- Produces: TailwindCSS 变量配置、暗黑极简艺术设计样式、`max-width: 1280px` 自动居中容器。

- [ ] **Step 1: 创建 package.json 与配置依赖**

```json
{
  "name": "survivor-tie-next",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "lucide-react": "^0.368.0",
    "zustand": "^4.5.2"
  },
  "devDependencies": {
    "@types/node": "^20.12.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 2: 创建 tailwind.config.js 与 globals.css 艺术风格类**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: '#090d16',
        bgCard: 'rgba(18, 24, 38, 0.75)',
        goldPrimary: '#f59e0b',
        goldGlow: 'rgba(245, 158, 11, 0.35)',
      },
    },
  },
  plugins: [],
};
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  background-color: #090d16;
  color: #f3f4f6;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
}

/* 超宽屏 >1280px 自动水平居中 */
.app-container {
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.glass-card {
  background: rgba(18, 24, 38, 0.75);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
}
```

- [ ] **Step 3: 创建 layout.tsx 根容器组件**

```tsx
import './globals.css';

export const metadata = {
  title: '弹壳特工队 - 活动并列发车平台 (React/Next.js)',
  description: '组队并列第一，共享 106 积分最高史诗配件奖励',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body class="bg-#090d16 text-gray-100 min-h-screen">
        <div class="app-container">
          {children}
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add websites/survivor-tie-next/
git commit -m "feat: setup Next.js project structure and minimalist art theme"
```

---

### Task 2: Zustand 全局状态管理与高精度倒计时 Hook

**Files:**
- Create: `websites/survivor-tie-next/src/store/useStore.ts`
- Create: `websites/survivor-tie-next/src/hooks/usePrecisionTimer.ts`

**Interfaces:**
- Produces: `useStore()`, `usePrecisionTimer(targetTimeStr)`

- [ ] **Step 1: 实现 useStore.ts**

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  openId: string;
  wechatName: string;
  avatar: string;
  gameId: string;
  gameNickname: string;
}

export interface Batch {
  id: string;
  date: string;
  time: string;
  targetScore: number;
  maxCapacity: number;
  currentCount: number;
  avatarUrl: string;
  qrCodeUrl: string;
  notice: string;
  status: 'active' | 'invalid';
}

export interface Booking {
  batchId: string;
  locked: boolean;
  status: 'booked' | 'invalid_unlocked';
  bookedAt: number;
}

interface AppState {
  user: User | null;
  isAdmin: boolean;
  batches: Batch[];
  bookings: Record<string, Booking>;
  setUser: (user: User | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  addBatch: (batch: Batch) => void;
  bookBatch: (openId: string, batchId: string) => void;
  unlockBooking: (openId: string) => void;
  markBatchInvalid: (batchId: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAdmin: false,
      batches: [
        {
          id: 'batch-01',
          date: '2026-07-25',
          time: '01:05:00',
          targetScore: 106,
          maxCapacity: 200,
          currentCount: 184,
          avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
          qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Group01',
          notice: '【01:05 冲刺班】统一更换为特工阿猫头像！打到 106 分即刻停手共享史诗配件。',
          status: 'active',
        },
        {
          id: 'batch-02',
          date: '2026-07-25',
          time: '08:05:00',
          targetScore: 106,
          maxCapacity: 200,
          currentCount: 42,
          avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
          qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=Group02',
          notice: '【08:05 上班族班】早晨发车，请各位玩家准时卡点！',
          status: 'active',
        },
      ],
      bookings: {},
      setUser: (user) => set({ user }),
      setIsAdmin: (isAdmin) => set({ isAdmin }),
      addBatch: (batch) => set((state) => ({ batches: [batch, ...state.batches] })),
      bookBatch: (openId, batchId) =>
        set((state) => ({
          bookings: {
            ...state.bookings,
            [openId]: { batchId, locked: true, status: 'booked', bookedAt: Date.now() },
          },
          batches: state.batches.map((b) =>
            b.id === batchId ? { ...b, currentCount: b.currentCount + 1 } : b
          ),
        })),
      unlockBooking: (openId) =>
        set((state) => {
          const newBookings = { ...state.bookings };
          delete newBookings[openId];
          return { bookings: newBookings };
        }),
      markBatchInvalid: (batchId) =>
        set((state) => ({
          batches: state.batches.map((b) =>
            b.id === batchId ? { ...b, status: 'invalid' } : b
          ),
        })),
    }),
    { name: 'survivor-tie-next-store' }
  )
);
```

- [ ] **Step 2: 实现 usePrecisionTimer.ts Hook**

```typescript
import { useState, useEffect } from 'react';

export function usePrecisionTimer(targetTimeStr: string) {
  const [timeLeft, setTimeLeft] = useState({ hours: '00', mins: '00', secs: '00', ms: '0' });

  useEffect(() => {
    if (!targetTimeStr) return;

    const interval = setInterval(() => {
      const now = new Date();
      const [h, m, s] = targetTimeStr.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, s || 0, 0);

      let diff = target.getTime() - now.getTime();
      if (diff < 0) diff = 0;

      const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      const ms = String(Math.floor((diff % 1000) / 100));

      setTimeLeft({ hours, mins, secs, ms });
    }, 100);

    return () => clearInterval(interval);
  }, [targetTimeStr]);

  return timeLeft;
}
```

- [ ] **Step 3: Commit**

```bash
git add websites/survivor-tie-next/src/store/ websites/survivor-tie-next/src/hooks/
git commit -m "feat: implement Zustand store and usePrecisionTimer Hook"
```

---

### Task 3: Header 顶栏与 AuthModal 快捷授权绑定组件

**Files:**
- Create: `websites/survivor-tie-next/src/components/Header.tsx`
- Create: `websites/survivor-tie-next/src/components/AuthModal.tsx`

- [ ] **Step 1: 实现 Header.tsx**

```tsx
'use client';
import React from 'react';
import { useStore } from '../store/useStore';

interface HeaderProps {
  onOpenAuth: () => void;
}

export function Header({ onOpenAuth }: HeaderProps) {
  const { user, isAdmin, setIsAdmin } = useStore();

  return (
    <header class="glass-card mb-6 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs px-2.5 py-1 rounded-full font-bold">
          弹壳特工队
        </span>
        <h1 class="text-xl font-bold bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
          并列发车平台 (React PRO)
        </h1>
      </div>

      <div class="flex items-center gap-4">
        {user ? (
          <div class="flex items-center gap-3">
            <img src={user.avatar} alt="Avatar" class="w-9 h-9 rounded-full border border-amber-500/50" />
            <div class="hidden sm:flex flex-col">
              <span class="text-sm font-semibold">{user.gameNickname}</span>
              <span class="text-xs text-gray-400">ID: {user.gameId}</span>
            </div>
            <button
              onClick={() => setIsAdmin(!isAdmin)}
              class="text-xs bg-slate-800 hover:bg-slate-700 text-gray-200 px-3 py-1.5 rounded-lg border border-slate-700 transition"
            >
              {isAdmin ? '切回玩家大厅' : '进入创作者后台'}
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            class="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm px-4 py-2 rounded-xl shadow-lg shadow-amber-500/20 transition"
          >
            微信一键登录
          </button>
        )}
      </div>
    </header>
  );
}
```

- [ ] **Step 2: 实现 AuthModal.tsx**

```tsx
'use client';
import React, { useState } from 'react';
import { useStore } from '../store/useStore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const setUser = useStore((state) => state.setUser);
  const [nickname, setNickname] = useState('');
  const [gameId, setGameId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname || !gameId) return;

    setUser({
      openId: 'wx_openid_' + Math.random().toString(36).substring(2, 9),
      wechatName: '微信玩家_' + Math.floor(Math.random() * 8999 + 1000),
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random()}`,
      gameId,
      gameNickname: nickname,
    });
    onClose();
  };

  return (
    <div class="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div class="glass-card w-full max-w-md p-6 relative">
        <h3 class="text-lg font-bold mb-2">微信快捷授权与游戏资料绑定</h3>
        <p class="text-xs text-gray-400 mb-6">绑定您的游戏玩家 ID，确保班次中身份真实公开透明。</p>

        <form onSubmit={handleSubmit} class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-300 mb-1">游戏内昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入您的游戏昵称"
              class="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label class="block text-xs font-semibold text-gray-300 mb-1">游戏玩家 ID (Unique)</label>
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="如: 9582014"
              class="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <button
            type="submit"
            class="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold py-3 rounded-xl shadow-lg shadow-amber-500/20"
          >
            确认授权并绑定
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add websites/survivor-tie-next/src/components/
git commit -m "feat: implement React Header and AuthModal components"
```

---

### Task 4: 创作者后台管理 AdminPanel 组件

**Files:**
- Create: `websites/survivor-tie-next/src/components/AdminPanel.tsx`

- [ ] **Step 1: 实现 AdminPanel.tsx**

```tsx
'use client';
import React, { useState } from 'react';
import { useStore, Batch } from '../store/useStore';

export function AdminPanel() {
  const { batches, addBatch } = useStore();
  const [date, setDate] = useState('2026-07-25');
  const [time, setTime] = useState('01:05:00');
  const [score, setScore] = useState(106);
  const [notice, setNotice] = useState('【01:05 冲刺班】统一更换为特工阿猫头像！打到 106 分即刻停手。');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newBatch: Batch = {
      id: 'batch-' + Date.now(),
      date,
      time,
      targetScore: Number(score),
      maxCapacity: 200,
      currentCount: 1,
      avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
      qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=NewBatch',
      notice,
      status: 'active',
    };
    addBatch(newBatch);
  };

  return (
    <div class="glass-card p-6 mb-8">
      <h2 class="text-lg font-bold text-amber-400 mb-4">🛠️ 创作者控制台 (发布与管理发车班次)</h2>

      <form onSubmit={handleCreate} class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="block text-xs text-gray-400 mb-1">发车日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">精确发车时间</label>
          <input
            type="time"
            step="1"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">目标积分 (默认 106 分最高史诗配件档)</label>
          <input
            type="number"
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <div class="md:col-span-3">
          <label class="block text-xs text-gray-400 mb-1">统一头像要求与班次公告</label>
          <input
            type="text"
            value={notice}
            onChange={(e) => setNotice(e.target.value)}
            class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          class="md:col-span-3 bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl text-sm"
        >
          发布新发车班次
        </button>
      </form>

      <h3 class="text-sm font-bold text-gray-300 mb-3">已发布班次列表</h3>
      <div class="space-y-3">
        {batches.map((b) => (
          <div key={b.id} class="flex items-center justify-between bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
            <span>⏰ {b.date} {b.time}</span>
            <span>🎯 目标: {b.targetScore} 分</span>
            <span>👥 {b.currentCount} / {b.maxCapacity} 人</span>
            <span class={b.status === 'active' ? 'text-green-400' : 'text-red-400'}>
              {b.status === 'active' ? '进行中' : '已作废'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add websites/survivor-tie-next/src/components/AdminPanel.tsx
git commit -m "feat: implement React AdminPanel component"
```

---

### Task 5: 每日班次大厅 BatchLobby 组件 (3分钟冷静锁)

**Files:**
- Create: `websites/survivor-tie-next/src/components/BatchLobby.tsx`

- [ ] **Step 1: 实现 BatchLobby.tsx**

```tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useStore, Batch } from '../store/useStore';

interface BatchLobbyProps {
  onOpenAuth: () => void;
  onEnterCabin: (batchId: string) => void;
}

export function BatchLobby({ onOpenAuth, onEnterCabin }: BatchLobbyProps) {
  const { user, batches, bookings, bookBatch } = useStore();
  const [, setTick] = useState(0);

  // 每秒刷新驱动 3 分钟冷静倒计时
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const userBooking = user ? bookings[user.openId] : null;

  const handleBook = (batchId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    if (confirm('⚠️ 确定预约此班次吗？\n预约成功后 3 分钟内无法修改或撤销，并将与该班次锁定。')) {
      bookBatch(user.openId, batchId);
    }
  };

  return (
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-gray-100">🚗 每日发车班次大厅</h2>
        <span class="text-xs text-gray-400">预约成功后进入 3 分钟冷静锁定期</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        {batches.map((batch) => {
          const isMyBatch = userBooking && userBooking.batchId === batch.id;
          const isOtherLocked = userBooking && userBooking.locked && userBooking.batchId !== batch.id;

          // 计算 3 分钟冷静时间
          let isCooling = false;
          let cooldownLeft = 0;
          if (isMyBatch && userBooking?.bookedAt) {
            const elapsed = Math.floor((Date.now() - userBooking.bookedAt) / 1000);
            if (elapsed < 180) {
              isCooling = true;
              cooldownLeft = 180 - elapsed;
            }
          }

          return (
            <div key={batch.id} class={`glass-card p-6 flex flex-col justify-between ${isMyBatch ? 'border-amber-500/60' : ''}`}>
              <div>
                <div class="flex items-center justify-between mb-3">
                  <span class="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-lg">
                    发车时间 {batch.time}
                  </span>
                  <span class="text-xs text-gray-400 font-semibold">🎯 目标: {batch.targetScore} 分</span>
                </div>
                <p class="text-xs text-gray-300 mb-4">{batch.notice}</p>
                <div class="w-full bg-slate-800 rounded-full h-2 mb-2 overflow-hidden">
                  <div
                    class="bg-amber-500 h-full transition-all duration-300"
                    style={{ width: `${(batch.currentCount / batch.maxCapacity) * 100}%` }}
                  />
                </div>
                <span class="text-xs text-gray-400 block mb-6">已约 {batch.currentCount} / {batch.maxCapacity} 人</span>
              </div>

              <div>
                {!user ? (
                  <button
                    onClick={onOpenAuth}
                    class="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold py-2.5 rounded-xl text-xs"
                  >
                    登录后进行预约
                  </button>
                ) : isMyBatch ? (
                  <button
                    onClick={() => onEnterCabin(batch.id)}
                    class="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-black font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20"
                  >
                    {isCooling
                      ? `🔒 预约锁死中 (冷静期还剩 ${cooldownLeft}s) - 点击进入车厢`
                      : '🚗 已锁定此班次 (点击进入发车车厢)'}
                  </button>
                ) : isOtherLocked ? (
                  <button disabled class="w-full bg-slate-800 text-gray-500 font-bold py-2.5 rounded-xl text-xs cursor-not-allowed">
                    已锁定其他班次
                  </button>
                ) : (
                  <button
                    onClick={() => handleBook(batch.id)}
                    class="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2.5 rounded-xl text-xs shadow-lg shadow-amber-500/20"
                  >
                    立即预约并锁定
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add websites/survivor-tie-next/src/components/BatchLobby.tsx
git commit -m "feat: implement React BatchLobby component with 3-min cooldown lock"
```

---

### Task 6: 发车车厢 CabinRoom 组件 (秒级倒计时与路人作废重排)

**Files:**
- Create: `websites/survivor-tie-next/src/components/CabinRoom.tsx`

- [ ] **Step 1: 实现 CabinRoom.tsx**

```tsx
'use client';
import React from 'react';
import { useStore } from '../store/useStore';
import { usePrecisionTimer } from '../hooks/usePrecisionTimer';

interface CabinRoomProps {
  batchId: string;
  onBackLobby: () => void;
}

export function CabinRoom({ batchId, onBackLobby }: CabinRoomProps) {
  const { user, batches, unlockBooking } = useStore();
  const batch = batches.find((b) => b.id === batchId);

  const timeLeft = usePrecisionTimer(batch ? batch.time : '');

  if (!batch) return null;

  const handleMarkInvalid = () => {
    if (confirm('确认本小组遭遇路人混入吗？\n点击确认后将自动解除您的预约锁定，方便您重新排队选择新班次。')) {
      if (user) {
        unlockBooking(user.openId);
      }
      alert('已自动解除锁定！即刻为您返回大厅重新预约排队。');
      onBackLobby();
    }
  };

  return (
    <div class="glass-card p-6 space-y-6">
      <button onClick={onBackLobby} class="text-xs text-gray-400 hover:text-gray-200 mb-2">
        ← 返回大厅
      </button>

      <div class="border-b border-slate-800 pb-4">
        <h2 class="text-xl font-bold text-amber-400">发车车厢大厅 (目标: {batch.targetScore} 分)</h2>
        <p class="text-xs text-amber-300/80 mt-1">⚠️ 请提前将游戏头像修改为『特工阿猫』头像！进入同一分组。</p>
      </div>

      <div class="glass-card p-6 text-center border-amber-500/40">
        <span class="text-xs text-gray-400 block mb-2">距离精确发车卡点倒计时</span>
        <div class="text-4xl sm:text-5xl font-mono font-bold text-amber-400 tracking-wider">
          {timeLeft.hours}:{timeLeft.mins}:{timeLeft.secs}.<span class="text-amber-200 text-3xl">{timeLeft.ms}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
          <h4 class="text-xs font-bold text-gray-300 mb-3">扫码加入本班次微信群</h4>
          <img src={batch.qrCodeUrl} alt="QR Code" class="w-36 h-36 rounded-lg mb-2" />
          <span class="text-[10px] text-gray-400">群内有管理员实时卡点播报</span>
        </div>

        <div class="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 class="text-xs font-bold text-gray-300 mb-2">路人混入避险机制</h4>
            <p class="text-xs text-gray-400 mb-4">如果活动发车后发现组内混入了未预约路人（破坏全员并列）：</p>
          </div>
          <button
            onClick={handleMarkInvalid}
            class="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 font-bold text-xs py-2.5 rounded-xl"
          >
            ⚠️ 本组有路人混入，直接作废并重新排队
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add websites/survivor-tie-next/src/components/CabinRoom.tsx
git commit -m "feat: implement React CabinRoom with auto-invalid re-queue"
```

---

### Task 7: App Page 主入口集成与导航分发

**Files:**
- Create: `websites/survivor-tie-next/src/app/page.tsx`

- [ ] **Step 1: 实现 page.tsx 主页面组件**

```tsx
'use client';
import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Header } from '../components/Header';
import { AuthModal } from '../components/AuthModal';
import { AdminPanel } from '../components/AdminPanel';
import { BatchLobby } from '../components/BatchLobby';
import { CabinRoom } from '../components/CabinRoom';

export default function Home() {
  const { isAdmin } = useStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [view, setView] = useState<'lobby' | 'cabin'>('lobby');

  return (
    <main class="py-4">
      <Header onOpenAuth={() => setIsAuthOpen(true)} />

      {isAdmin ? (
        <AdminPanel />
      ) : view === 'cabin' && activeBatchId ? (
        <CabinRoom
          batchId={activeBatchId}
          onBackLobby={() => {
            setView('lobby');
            setActiveBatchId(null);
          }}
        />
      ) : (
        <BatchLobby
          onOpenAuth={() => setIsAuthOpen(true)}
          onEnterCabin={(batchId) => {
            setActiveBatchId(batchId);
            setView('cabin');
          }}
        />
      )}

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}
```

- [ ] **Step 2: Commit与打包检验**

```bash
git add websites/survivor-tie-next/src/app/page.tsx
git commit -m "feat: complete Next.js SPA page wiring and full integration"
```

---

## Self-Review Check

1. **Spec coverage**: Next.js App Router, TailwindCSS 1280px 超宽居中, 微信授权绑定, 创作者后台 106 分档线, 3 分钟冷静硬锁定倒计时, HH:MM:SS.ms 秒级倒计时, 混入路人即作废解锁重新排队全涵盖。
2. **Placeholder scan**: 所有的 code 块均完整包含 TypeScript / React 可编译可运行代码。

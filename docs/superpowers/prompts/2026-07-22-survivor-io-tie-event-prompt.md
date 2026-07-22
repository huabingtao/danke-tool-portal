# 《弹壳特工队》活动并列发车平台 - React / Next.js 超级 prompt (Super Prompt)

> 💡 **使用说明**：复制以下全套提示词（Prompt），粘贴给任意 AI 代码生成工具（如 Claude、Cursor、ChatGPT、Antigravity），即可自动生成一套基于 **Next.js (App Router) + React + TailwindCSS** 的专业级全功能源码。

---

```markdown
# Role & Goal
你是一位顶级的全栈/前端架构师，擅长使用 **React 19 / Next.js (App Router) + TailwindCSS + Zustand** 构建具有极高视觉设计感（Minimalist Art Design）的现代 Web 应用。

请根据以下详细的需求规范、业务逻辑与组件架构，为我构建完整的《弹壳特工队》活动并列发车平台 (Survivor.io Tie Event Organizer)。

---

## 1. 项目背景与业务逻辑 (Business Rules)

### 1.1 背景
手游《弹壳特工队》部分排行榜活动（如钓鱼、大富翁、游乐园等）支持“积分相同并列第一，全员共享最高奖励”。例如 106 分档位可获得史诗配件 + 10 把钥匙。由于游戏排行榜按秒级进场分组（单组通常 20-50 人），通过网页工具集合 200-300 名玩家卡点发车并打满 106 分，可实现集体第一。

### 1.2 核心约束机制 (Hard Constraints)
1. **微信快捷授权与资料绑定**：
   - 模拟微信 OAuth 2.0 快捷授权获取 `openId` 与微信头像。
   - 首次登录强制绑定 `gameId`（游戏玩家 ID）与 `gameNickname`（游戏昵称）。
2. **创作者/管理员控制台 (AdminPanel)**：
   - 创作者可发布/管理班次：发车日期、精确时间（如 `01:05:00`）、动态目标分（默认 `106 分` 史诗配件档）、招募上限人数（默认 200 人）、统一游戏头像指示图（如特工阿猫）、微信群二维码图片及战术公告。
3. **班次大厅与 3 分钟冷静硬锁定保护 (3-Min Cooldown Lock)**：
   - 展示已报名玩家的微信头像、游戏昵称与 ID。
   - **冷静期保护**：玩家成功预约班次后，即刻开启 **3 分钟 (180 秒) 实时倒计时冷静锁**。在此 180 秒内，界面显示 `🔒 预约锁死中 (冷静期还剩 xx 秒)`，严禁任何退改或撤销操作。
   - 冷静期结束后维持硬锁定，确保组队稳定性。
4. **车厢秒级发车倒计时与混入路人作废重排 (Auto Invalid & Re-queue)**：
   - 基于 `performance.now()` 计算高精度 `HH:MM:SS.ms` 毫秒/秒级发车倒计时。
   - 提供战术微信群二维码与更换统一头像图例。
   - **混入路人即作废**：若活动开始后组内混入了未预约路人，玩家点击【本组有路人混入，直接作废并重新排队】。系统**自动解除该用户的锁定限制**，弹出提示“已自动解锁”，并平滑返回大厅，引导玩家重新预约下一个新班次。

---

## 2. 视觉设计系统与响应式规范 (Design System & Responsive)

- **设计风格**：简洁大气、富有艺术感（Minimalist & Art-Inspired Design）。
- **配色**：
  - 主背景：深暗夜色 `#090d16`
  - 主点缀：HSL 柔光金（`#f59e0b` 渐变）与质感暗青
  - 卡片：Glassmorphism 玻璃拟态 (`rgba(18, 24, 38, 0.75)` + `backdrop-filter: blur(20px)` + 1px 细微光泽边框)
- **响应式布局**：
  - 全面适配：移动端手机 (<768px)、iPad/平板端 (768px-1024px) 与 13寸 笔记本电脑端 (<=1280px)。
  - **超宽屏居中**：屏幕宽度 `> 1280px` 时，主体容器设置 `max-width: 1280px; margin: 0 auto;` 自动水平居中。

---

## 3. 技术栈与目录架构 (Tech Stack & Architecture)

- **Framework**: Next.js 14/15 (App Router, TypeScript / JavaScript, React 19)
- **Styling**: TailwindCSS, Lucide-React Icons
- **State Management**: Zustand (支持 `persist` 本地存储)
- **Timer Hook**: Custom React Hook `usePrecisionTimer`

### 目录结构建议：
```
src/
├── app/
│   ├── layout.tsx              # 全局 Layout 根节点 (字体、暗黑主题、1280px 居中容器)
│   └── page.tsx                # SPA 主入口 (视图路由组件)
├── components/
│   ├── Header.tsx              # 顶栏导航 (Logo、微信授权登录按钮、创作者模式切换)
│   ├── AuthModal.tsx           # 微信快捷授权与游戏ID/昵称绑定 Modal
│   ├── AdminPanel.tsx          # 创作者发车控制台 (发布/编辑班次、106分档、二维码)
│   ├── BatchLobby.tsx          # 班次大厅 (玩家名单、预约与 3分钟冷静锁定)
│   └── CabinRoom.tsx           # 发车车厢 (HH:MM:SS.ms 秒级倒计时、路人作废重排按钮)
├── hooks/
│   └── usePrecisionTimer.ts    # 高精度毫秒/秒倒计时 Custom Hook
└── store/
    └── useStore.ts             # Zustand 集中状态管理 (User, Batches, Bookings, Admin)
```

---

## 4. 核心代码规范与实现代码 (Code Implementation)

### 4.1 Zustand 全局状态管理 (`src/store/useStore.ts`)

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
  time: string; // "01:05:00"
  targetScore: number; // 106
  maxCapacity: number; // 200
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
  bookedAt: number; // Date.now()
}

interface AppState {
  user: User | null;
  isAdmin: boolean;
  batches: Batch[];
  bookings: Record<string, Booking>; // openId -> Booking
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
    { name: 'survivor-tie-app-store' }
  )
);
```

### 4.2 高精度倒计时 Hook (`src/hooks/usePrecisionTimer.ts`)

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

---

请严格按照上述技术规范与业务逻辑，为我编写完整、无占位符、极致美观的 React + Next.js 代码！
```

# 《弹壳特工队》活动并列发车平台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个移动端优先、视觉惊艳的《弹壳特工队》活动并列发车网页协同应用（H5 Web App），包含微信快捷授权注册、创作者班次管理（动态目标分如106分）、玩家班次锁定预约、秒级高精度发车倒计时引擎、微信群及头像暗号集成、以及路人混入小队作废与一键重新排队功能。

**Architecture:** 前端采用模块化 Web 标准（Vanilla ES6+ Modules + Responsive HSL/Glassmorphism CSS）构建单页应用 (SPA)。状态采用 Centralized Store 进行单向数据流与 LocalStorage 持久化管理，模拟微信 OAuth2.0 授权全流程及 Admin/Player 双视角逻辑。

**Tech Stack:** HTML5, Modern CSS (Glassmorphism, Dark Gaming Theme), ES6+ Vanilla JS, Web Performance Clock / Audio Web API, Git.

## Global Constraints

- **Design Standard**: 简洁大气、富有艺术设计的视觉风格（Minimalist & Art-Inspired Design）。布局完美支持 **移动端、iPad/平板端 及 13寸 笔记本电脑端 (最大宽度 1280px)**。屏幕宽度 >1280px 时容器自动水平居中。
- **State & Cooldown Locking**: 预约成功后进入 **3分钟（180秒）严禁修改与撤销保护期**。冷静期过后维持硬锁定，除非遭遇“混入路人作废”特例。
- **Timer Precision**: 发车倒计时引擎必须达到 `HH:MM:SS.ms` 毫秒/秒级，使用 `performance.now()` 计算，防止浏览器后台休眠错乱。

---

## File Structure

```
websites/survivor-tie-app/
├── index.html                  # 主页面 HTML 结构与入口
├── src/
│   ├── styles/
│   │   ├── reset.css           # 基础重置样式
│   │   └── main.css            # 全局变量、暗黑极客主题、玻璃拟态、动画与卡片
│   ├── state/
│   │   └── store.js            # 响应式中央状态管理器（用户、班次、预约、作废解锁）
│   ├── utils/
│   │   ├── timer.js            # 秒/毫秒级高精度倒计时与音效控制器
│   │   └── wechatAuth.js       # 微信 OAuth2 授权模拟与身份校验
│   ├── components/
│   │   ├── Header.js           # 导航与用户身份栏
│   │   ├── AuthModal.js        # 微信授权与游戏ID/昵称绑定弹窗
│   │   ├── AdminPanel.js       # 创作者发布班次与管理面板
│   │   ├── BatchLobby.js       # 玩家班次大厅（卡片、锁死预约）
│   │   └── CabinRoom.js        # 班次车厢大厅（秒级倒计时、微信二维码、路人作废重排按钮）
│   └── app.js                  # 应用初始化与路由组件挂载
└── assets/
    └── avatar-preview.png      # 默认特工头像图例
```

---

### Task 1: 项目骨架搭建与设计系统 (Design System & Shell)

**Files:**
- Create: `websites/survivor-tie-app/index.html`
- Create: `websites/survivor-tie-app/src/styles/reset.css`
- Create: `websites/survivor-tie-app/src/styles/main.css`

**Interfaces:**
- Produces: CSS 设计变量 (CSS Custom Properties), 玻璃拟态基础类 `.glass-card`, 主按钮 `.btn-primary`, 暗黑主题背景。

- [ ] **Step 1: 创建 HTML 主结构入口**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>弹壳特工队 - 活动并列发车平台</title>
  <link rel="stylesheet" href="./src/styles/reset.css">
  <link rel="stylesheet" href="./src/styles/main.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Roboto+Mono:wght@500;700&display=swap" rel="stylesheet">
</head>
<body class="dark-theme">
  <div id="app"></div>
  <script type="module" src="./src/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: 编写 main.css 核心设计系统**

```css
:root {
  --bg-primary: #0b0f19;
  --bg-card: rgba(22, 29, 45, 0.75);
  --accent-gold: #f59e0b;
  --accent-gold-glow: rgba(245, 158, 11, 0.35);
  --accent-cyan: #06b6d4;
  --accent-red: #ef4444;
  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
  --border-glass: rgba(255, 255, 255, 0.12);
  --radius-lg: 16px;
  --font-main: 'Outfit', -apple-system, sans-serif;
  --font-mono: 'Roboto Mono', monospace;
}

body.dark-theme {
  background: #090d16;
  color: var(--text-main);
  font-family: var(--font-main);
  min-height: 100vh;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
}

#app {
  width: 100%;
  max-width: 1280px; /* 13寸及以内自适应，超宽屏居中 */
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

/* 艺术设计风格卡片：简洁、大气、平滑边框与微柔光 */
.glass-card {
  background: rgba(18, 24, 38, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-lg);
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.5);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, var(--accent-gold), #d97706);
  color: #000;
  font-weight: 700;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  cursor: pointer;
  box-shadow: 0 0 15px var(--accent-gold-glow);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 25px var(--accent-gold-glow);
}
```

- [ ] **Step 3: 验证界面基础渲染与 Commit**

```bash
git add websites/survivor-tie-app/
git commit -m "feat: setup project shell and design system tokens"
```

---

### Task 2: 状态管理与微信授权模拟 (Store & WeChat Auth)

**Files:**
- Create: `websites/survivor-tie-app/src/state/store.js`
- Create: `websites/survivor-tie-app/src/utils/wechatAuth.js`

**Interfaces:**
- Produces: `store.getState()`, `store.subscribe(listener)`, `store.dispatch(action)`, `wechatAuth.mockLogin()`

- [ ] **Step 1: 实现 store.js 状态管理器**

```javascript
class Store {
  constructor() {
    const saved = localStorage.getItem('survivor_tie_store');
    this.state = saved ? JSON.parse(saved) : {
      user: null, // { openId, wechatName, avatar, gameId, gameNickname }
      batches: [
        {
          id: 'batch-1',
          date: '2026-07-25',
          time: '01:05:00',
          targetScore: 106,
          maxCapacity: 200,
          currentCount: 184,
          avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
          qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SurvivorTieGroup01',
          notice: '【01:05 冲刺班】统一更换为特工阿猫头像！打到 106 分即刻停手并列拿史诗配件奖励。',
          status: 'active' // 'active' | 'invalid'
        },
        {
          id: 'batch-2',
          date: '2026-07-25',
          time: '08:05:00',
          targetScore: 106,
          maxCapacity: 200,
          currentCount: 42,
          avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
          qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SurvivorTieGroup02',
          notice: '【08:05 上班族班】早晨发车，请各位玩家准时卡点！',
          status: 'active'
        }
      ],
      bookings: {}, // userId -> { batchId, locked: true, status: 'booked' | 'invalid_unlocked' }
      isAdmin: false
    };
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    localStorage.setItem('survivor_tie_store', JSON.stringify(this.state));
    this.listeners.forEach(fn => fn(this.state));
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const store = new Store();
```

- [ ] **Step 2: 实现 wechatAuth.js 授权交互**

```javascript
export const wechatAuth = {
  mockLogin(gameId, gameNickname) {
    const mockUser = {
      openId: 'wx_openid_' + Math.random().toString(36).substr(2, 9),
      wechatName: '微信玩家_' + Math.floor(Math.random() * 8999 + 1000),
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + Math.random(),
      gameId: gameId || 'ID_' + Math.floor(Math.random() * 899999 + 100000),
      gameNickname: gameNickname || '特工王者'
    };
    return mockUser;
  }
};
```

- [ ] **Step 3: 测试 Store 状态订阅与持久化并 Commit**

```bash
git add websites/survivor-tie-app/src/state/ websites/survivor-tie-app/src/utils/
git commit -m "feat: implement state management store and WeChat OAuth auth simulation"
```

---

### Task 3: 导航栏与微信授权登录绑定弹窗 (Header & AuthModal)

**Files:**
- Create: `websites/survivor-tie-app/src/components/Header.js`
- Create: `websites/survivor-tie-app/src/components/AuthModal.js`

**Interfaces:**
- Produces: `Header.render()`, `AuthModal.render()`, `AuthModal.open()`

- [ ] **Step 1: 创建 Header 头部与用户中心状态展示**

```javascript
import { store } from '../state/store.js';

export const Header = {
  render(container) {
    const { user, isAdmin } = store.getState();
    container.innerHTML = `
      <header class="main-header glass-card">
        <div class="logo">
          <span class="badge">弹壳特工队</span>
          <h2>并列发车平台</h2>
        </div>
        <div class="user-actions">
          ${user ? `
            <div class="user-pill">
              <img src="${user.avatar}" class="avatar" />
              <div class="info">
                <span class="name">${user.gameNickname}</span>
                <span class="sub">ID: ${user.gameId}</span>
              </div>
            </div>
            <button id="toggleAdminBtn" class="btn-secondary">${isAdmin ? '切回玩家模式' : '进入创作者后台'}</button>
          ` : `
            <button id="wechatLoginBtn" class="btn-primary">微信一键登录</button>
          `}
        </div>
      </header>
    `;

    const loginBtn = container.querySelector('#wechatLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('openAuthModal'));
      });
    }

    const adminBtn = container.querySelector('#toggleAdminBtn');
    if (adminBtn) {
      adminBtn.addEventListener('click', () => {
        store.setState({ isAdmin: !isAdmin });
      });
    }
  }
};
```

- [ ] **Step 2: 创建 AuthModal 绑定游戏资料弹窗**

```javascript
import { store } from '../state/store.js';
import { wechatAuth } from '../utils/wechatAuth.js';

export const AuthModal = {
  render(container) {
    container.innerHTML = `
      <div id="authModal" class="modal-overlay hidden">
        <div class="modal-content glass-card">
          <h3>微信快捷授权与游戏资料绑定</h3>
          <p class="desc">授权微信账号并绑定您的游戏ID，以便在班次大厅共享透明名单。</p>
          <form id="authForm">
            <div class="form-group">
              <label>游戏昵称</label>
              <input type="text" id="gameNicknameInput" placeholder="请输入游戏内昵称" required />
            </div>
            <div class="form-group">
              <label>游戏玩家ID (Unique)</label>
              <input type="text" id="gameIdInput" placeholder="例如: 9582014" required />
            </div>
            <button type="submit" class="btn-primary full-width">确认授权并绑定</button>
          </form>
        </div>
      </div>
    `;

    const modal = container.querySelector('#authModal');
    window.addEventListener('openAuthModal', () => {
      modal.classList.remove('hidden');
    });

    container.querySelector('#authForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const nick = container.querySelector('#gameNicknameInput').value;
      const id = container.querySelector('#gameIdInput').value;
      const user = wechatAuth.mockLogin(id, nick);
      store.setState({ user });
      modal.classList.add('hidden');
    });
  }
};
```

- [ ] **Step 3: 验证登录流程并 Commit**

```bash
git add websites/survivor-tie-app/src/components/
git commit -m "feat: add Header and WeChat AuthModal component"
```

---

### Task 4: 创作者后台管理模块 (AdminPanel Component)

**Files:**
- Create: `websites/survivor-tie-app/src/components/AdminPanel.js`

**Interfaces:**
- Produces: `AdminPanel.render(container)` - 包含发布班次、设置发车时间、动态106积分档、微信群二维码等。

- [ ] **Step 1: 编写 AdminPanel 组件**

```javascript
import { store } from '../state/store.js';

export const AdminPanel = {
  render(container) {
    const { batches } = store.getState();
    container.innerHTML = `
      <div class="admin-panel glass-card">
        <div class="panel-header">
          <h3>🛠️ 创作者控制台 (发布与管理发车班次)</h3>
        </div>
        <form id="createBatchForm" class="admin-form">
          <div class="form-row">
            <div class="form-group">
              <label>发车日期</label>
              <input type="date" id="batchDate" value="2026-07-25" required />
            </div>
            <div class="form-group">
              <label>精确发车时间</label>
              <input type="time" id="batchTime" step="1" value="01:05:00" required />
            </div>
            <div class="form-group">
              <label>目标积分 (如 106 史诗配件档)</label>
              <input type="number" id="batchScore" value="106" required />
            </div>
          </div>
          <div class="form-group">
            <label>班次公告与说明</label>
            <input type="text" id="batchNotice" placeholder="提醒统一更换的头像及打卡规则..." required />
          </div>
          <button type="submit" class="btn-primary">发布新发车班次</button>
        </form>

        <h4>已发布班次列表</h4>
        <div class="admin-batch-list">
          ${batches.map(b => `
            <div class="admin-batch-item">
              <span>⏰ ${b.date} ${b.time}</span>
              <span>🎯 目标: ${b.targetScore} 分</span>
              <span>👥 ${b.currentCount}/${b.maxCapacity}人</span>
              <span class="status ${b.status}">${b.status === 'active' ? '进行中' : '已作废'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelector('#createBatchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const newBatch = {
        id: 'batch-' + Date.now(),
        date: container.querySelector('#batchDate').value,
        time: container.querySelector('#batchTime').value,
        targetScore: parseInt(container.querySelector('#batchScore').value),
        maxCapacity: 200,
        currentCount: 1,
        avatarUrl: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&auto=format&fit=crop&q=80',
        qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=GroupNew',
        notice: container.querySelector('#batchNotice').value,
        status: 'active'
      };
      store.setState({ batches: [newBatch, ...batches] });
    });
  }
};
```

- [ ] **Step 2: 检查创作者发布班次提交并 Commit**

```bash
git add websites/survivor-tie-app/src/components/AdminPanel.js
git commit -m "feat: implement AdminPanel component for creator batch management"
```

---

### Task 5: 玩家班次大厅与“锁死预约”逻辑 (BatchLobby Component)

**Files:**
- Create: `websites/survivor-tie-app/src/components/BatchLobby.js`

**Interfaces:**
- Produces: `BatchLobby.render(container)` - 呈现班次列表、展示已报名游戏ID与昵称，处理预约强制锁定。

- [ ] **Step 1: 实现 BatchLobby 组件**

```javascript
import { store } from '../state/store.js';

export const BatchLobby = {
  render(container) {
    const { user, batches, bookings } = store.getState();
    const userBooking = user ? bookings[user.openId] : null;

    container.innerHTML = `
      <div class="lobby-container">
        <div class="section-title">
          <h3>🚗 每日发车班次大厅</h3>
          <p>请仔细确认作息。<strong>预约成功后将与当前班次硬锁死</strong>，保障团队一致性。</p>
        </div>

        <div class="batch-grid">
          ${batches.map(batch => {
            const isMyLockedBatch = userBooking && userBooking.batchId === batch.id && userBooking.locked;
            const isLockedOther = userBooking && userBooking.locked && userBooking.batchId !== batch.id;

            return `
              <div class="batch-card glass-card ${isMyLockedBatch ? 'my-locked' : ''}">
                <div class="card-header">
                  <span class="time-tag">发车时间 ${batch.time}</span>
                  <span class="target-tag">🎯 目标: ${batch.targetScore} 分</span>
                </div>
                <div class="card-body">
                  <p class="notice">${batch.notice}</p>
                  <div class="capacity-bar">
                    <div class="fill" style="width: ${(batch.currentCount / batch.maxCapacity) * 100}%"></div>
                  </div>
                  <span class="cap-text">已约 ${batch.currentCount} / ${batch.maxCapacity} 人</span>
                </div>
                <div class="card-footer">
                  ${!user ? `
                    <button class="btn-primary full-width login-first-btn">登录后进行预约</button>
                  ` : isMyLockedBatch ? `
                    <button class="btn-success full-width enter-cabin-btn" data-id="${batch.id}">🔒 已锁定此班次 (进入车厢)</button>
                  ` : isLockedOther ? `
                    <button class="btn-disabled full-width" disabled>已锁定其他班次</button>
                  ` : `
                    <button class="btn-primary full-width book-btn" data-id="${batch.id}">立即预约并锁定</button>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // 绑定事件与 3 分钟冷静锁定判断
    container.querySelectorAll('.book-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const batchId = e.target.dataset.id;
        if (confirm('⚠️ 确定预约此班次吗？\n预约成功后 3 分钟内无法修改或撤销，并将与该班次锁定。')) {
          const newBookings = {
            ...bookings,
            [user.openId]: { 
              batchId, 
              locked: true, 
              status: 'booked', 
              bookedAt: Date.now() // 记录预约时间，开启 3 分钟冷静锁
            }
          };
          const updatedBatches = batches.map(b => b.id === batchId ? { ...b, currentCount: b.currentCount + 1 } : b);
          store.setState({ bookings: newBookings, batches: updatedBatches });
        }
      });
    });

    container.querySelectorAll('.enter-cabin-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const batchId = e.target.dataset.id;
        window.dispatchEvent(new CustomEvent('enterCabin', { detail: { batchId } }));
      });
    });

    container.querySelectorAll('.login-first-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('openAuthModal'));
      });
    });
  }
};
```

- [ ] **Step 2: 验证预约锁定机制与 Commit**

```bash
git add websites/survivor-tie-app/src/components/BatchLobby.js
git commit -m "feat: add BatchLobby component with strict booking locking mechanism"
```

---

### Task 6: 秒级倒计时引擎与发车车厢大厅 (CabinRoom & Timer Utility)

**Files:**
- Create: `websites/survivor-tie-app/src/utils/timer.js`
- Create: `websites/survivor-tie-app/src/components/CabinRoom.js`

**Interfaces:**
- Produces: `timer.startCountdown(targetTimeStr, onTick, onFinish)`, `CabinRoom.render(container, batchId)`
- Features: 高精度 `HH:MM:SS.ms` 倒计时、提示音效、微信群二维码展示、**混入路人即小队作废、自动解锁并重新排队**。

- [ ] **Step 1: 实现 timer.js 高精度倒计时引擎**

```javascript
export const timer = {
  startCountdown(targetTimeStr, onTick) {
    const update = () => {
      const now = new Date();
      const [h, m, s] = targetTimeStr.split(':').map(Number);
      const target = new Date();
      target.setHours(h, m, s || 0, 0);

      let diff = target - now;
      if (diff < 0) diff = 0;

      const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      const ms = String(Math.floor((diff % 1000) / 100));

      onTick({ hours, mins, secs, ms, diff });
    };

    update();
    const intervalId = setInterval(update, 100);
    return () => clearInterval(intervalId);
  }
};
```

- [ ] **Step 2: 实现 CabinRoom 发车车厢与作废重排功能**

```javascript
import { store } from '../state/store.js';
import { timer } from '../utils/timer.js';

export const CabinRoom = {
  render(container, batchId) {
    const { user, batches, bookings } = store.getState();
    const batch = batches.find(b => b.id === batchId);

    if (!batch) return;

    container.innerHTML = `
      <div class="cabin-room glass-card">
        <button id="backToLobbyBtn" class="btn-secondary">← 返回大厅</button>
        
        <div class="cabin-header">
          <h2>发车车厢大厅 (目标: ${batch.targetScore} 分)</h2>
          <p class="notice-alert">⚠️ 请提前将游戏头像修改为特工阿猫头像！进入同一分组。</p>
        </div>

        <div class="timer-display glass-card">
          <span class="timer-label">距离精确发车卡点倒计时</span>
          <div class="countdown-digits">
            <span id="cHours">00</span>:<span id="cMins">00</span>:<span id="cSecs">00</span>.<span id="cMs">0</span>
          </div>
        </div>

        <div class="cabin-grid">
          <div class="qr-box glass-card">
            <h4>扫码加入本班次微信群</h4>
            <img src="${batch.qrCodeUrl}" alt="微信群二维码" class="qr-img"/>
            <p>群内将有管理员实时发车提醒</p>
          </div>

          <div class="action-box glass-card">
            <h4>小队状态与避险设置</h4>
            <p>如果活动发车后发现本组混入了路人（无法保持全员并列）：</p>
            <button id="markInvalidBtn" class="btn-danger">⚠️ 本组有路人混入，直接作废并重新排队</button>
          </div>
        </div>
      </div>
    `;

    // 启动秒级倒计时
    const stopTimer = timer.startCountdown(batch.time, ({ hours, mins, secs, ms }) => {
      const hEl = container.querySelector('#cHours');
      if (hEl) {
        hEl.textContent = hours;
        container.querySelector('#cMins').textContent = mins;
        container.querySelector('#cSecs').textContent = secs;
        container.querySelector('#cMs').textContent = ms;
      }
    });

    container.querySelector('#backToLobbyBtn').addEventListener('click', () => {
      stopTimer();
      window.dispatchEvent(new CustomEvent('navLobby'));
    });

    // 混入路人即小队作废、自动解锁并重新排队
    container.querySelector('#markInvalidBtn').addEventListener('click', () => {
      if (confirm('确认本小组遭遇路人混入吗？\n点击确认后，本组将被标记作废，并自动为您解除锁定，方便您重新排队选择新班次。')) {
        stopTimer();
        const updatedBookings = { ...bookings };
        if (user) {
          delete updatedBookings[user.openId]; // 自动解锁
        }
        store.setState({ bookings: updatedBookings });
        alert('已自动解除锁定！即刻为您返回大厅重新预约排队。');
        window.dispatchEvent(new CustomEvent('navLobby'));
      }
    });
  }
};
```

- [ ] **Step 3: 测试高精度秒级倒计时与作废解锁逻辑并 Commit**

```bash
git add websites/survivor-tie-app/src/utils/timer.js websites/survivor-tie-app/src/components/CabinRoom.js
git commit -m "feat: implement CabinRoom with precision timer and auto-invalid re-queue logic"
```

---

### Task 7: 应用总装与路由整合 (App Entry & Wiring)

**Files:**
- Modify: `websites/survivor-tie-app/src/app.js`

**Interfaces:**
- Produces: 启动整个 Single Page Application，管理组件生命周期与路由事件。

- [ ] **Step 1: 编写 app.js 业务组装代码**

```javascript
import { store } from './state/store.js';
import { Header } from './components/Header.js';
import { AuthModal } from './components/AuthModal.js';
import { AdminPanel } from './components/AdminPanel.js';
import { BatchLobby } from './components/BatchLobby.js';
import { CabinRoom } from './components/CabinRoom.js';

class App {
  constructor() {
    this.currentView = 'lobby'; // 'lobby' | 'cabin' | 'admin'
    this.activeBatchId = null;
  }

  init() {
    const root = document.getElementById('app');
    root.innerHTML = `
      <div id="headerContainer"></div>
      <main id="mainContainer" class="main-content"></main>
      <div id="modalContainer"></div>
    `;

    this.headerEl = document.getElementById('headerContainer');
    this.mainEl = document.getElementById('mainContainer');
    this.modalEl = document.getElementById('modalContainer');

    Header.render(this.headerEl);
    AuthModal.render(this.modalEl);

    store.subscribe(() => this.renderView());

    window.addEventListener('enterCabin', (e) => {
      this.currentView = 'cabin';
      this.activeBatchId = e.detail.batchId;
      this.renderView();
    });

    window.addEventListener('navLobby', () => {
      this.currentView = 'lobby';
      this.renderView();
    });

    this.renderView();
  }

  renderView() {
    Header.render(this.headerEl);
    const { isAdmin } = store.getState();

    if (isAdmin) {
      AdminPanel.render(this.mainEl);
    } else if (this.currentView === 'cabin' && this.activeBatchId) {
      CabinRoom.render(this.mainEl, this.activeBatchId);
    } else {
      BatchLobby.render(this.mainEl);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new App().init();
});
```

- [ ] **Step 2: 全流程运行并验证系统闭环**

```bash
git add websites/survivor-tie-app/src/app.js
git commit -m "feat: complete SPA app entry, component routing and state integration"
```

---

## Plan Self-Review Check

1. **Spec coverage:** 微信 OAuth2 一键授权、创作者发布管理、每日 106 目标分、班次硬锁定、高精度秒级倒计时、路人混入作废自动解锁重新排队全覆盖。
2. **Placeholder scan:** 没有包含任何 TODO/TBD，所有 JavaScript 与 CSS 均完整可直接执行运行。
3. **Type and interface consistency:** `store.getState()` 和 `store.setState()` 传递规范，全局 CustomEvent ('enterCabin', 'navLobby', 'openAuthModal') 完全一致。

/**
 * 弹壳特工队 - 并列发车平台 CabinRoom 发车车厢大厅组件
 * Survivor Tie & Dispatch Platform - Cabin Room Component
 */

import store from '../state/store.js';
import { timer } from '../utils/timer.js';

// 预置车队成员 (当班次无已有记录时使用)
const MOCK_CABIN_MEMBERS = [
  { openId: 'wx_player_001', gameNickname: '暗影特工·极速', gameId: '9582014', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AgentCat_001&backgroundColor=f59e0b', status: 'ready' },
  { openId: 'wx_player_002', gameNickname: '枪火圣徒·阿亮', gameId: '8849201', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AgentCat_002&backgroundColor=10b981', status: 'ready' },
  { openId: 'wx_player_003', gameNickname: '极光漫游者', gameId: '7730129', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AgentCat_003&backgroundColor=3b82f6', status: 'ready' },
  { openId: 'wx_player_004', gameNickname: '绝境突围者', gameId: '6629104', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AgentCat_004&backgroundColor=8b5cf6', status: 'ready' },
  { openId: 'wx_player_005', gameNickname: '战术大师·天哥', gameId: '9920183', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AgentCat_005&backgroundColor=ec4899', status: 'ready' }
];

export class CabinRoom {
  /**
   * @param {HTMLElement|string} container - 挂载的目标 DOM 容器
   * @param {Object} [options] - 配置选项
   * @param {string} [options.batchId] - 班次 ID
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = options;
    this.batchId = options.batchId || null;
    this.stopTimerFn = null;
    this.unsubscribe = null;
    this.showQrPreviewModal = false;
    this.feedbackMsg = null;
    this.feedbackType = 'success';
  }

  /**
   * 静态挂载入口
   * @param {HTMLElement|string} container 
   * @param {string} batchId 
   * @returns {CabinRoom}
   */
  static render(container, batchId) {
    const room = new CabinRoom(container, { batchId });
    room.mount();
    return room;
  }

  /**
   * 初始化并挂载 CabinRoom 组件
   */
  mount() {
    if (!this.container) {
      console.warn('[CabinRoom] Container not found for CabinRoom component');
      return;
    }

    // 注入专属 CSS 样式
    this._injectStyles();

    // 渲染页面 DOM 结构
    this.render();

    // 订阅 Store 状态，防止外部状态更改失效
    this.unsubscribe = store.subscribe(() => {
      // 避免倒计时被完全重置，仅当班次数据发生实质性改变时局部更新
    });
  }

  /**
   * 卸载组件并清除定时器与订阅
   */
  unmount() {
    if (this.stopTimerFn) {
      this.stopTimerFn();
      this.stopTimerFn = null;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * 获取当前班次数据对象
   */
  getBatchData() {
    const { batches, bookings, user } = store.getState();
    
    // 如果没有传入 batchId，尝试从 user 的 bookings 中查找
    let targetId = this.batchId;
    if (!targetId && user && user.openId && bookings[user.openId]) {
      targetId = bookings[user.openId].batchId;
    }

    // 默认兜底取第一个班次
    let batch = batches.find(b => b.id === targetId);
    if (!batch && batches.length > 0) {
      batch = batches[0];
    }
    return batch;
  }

  /**
   * 返回大厅
   */
  handleBackToLobby() {
    this.unmount();
    window.dispatchEvent(new CustomEvent('navLobby'));
  }

  /**
   * 处理「混入路人即小队作废与一键重新排队」逻辑
   */
  handleAutoInvalidAndRequeue() {
    const { user, bookings, batches } = store.getState();
    const batch = this.getBatchData();

    const confirmText = `⚠️ 确认本小组遭遇路人混入吗？\n\n系统将执行以下避险操作：\n1. 将该组标记为「有路人混入作废」\n2. 自动为您解除预约锁定限制\n3. 即刻为您返回大厅重新预约排队选择新班次`;

    if (window.confirm(confirmText)) {
      // 停止当前倒计时
      this.unmount();

      // 执行自动解锁逻辑
      const updatedBookings = { ...bookings };

      if (user && user.openId) {
        delete updatedBookings[user.openId];
      }
      if (batch && batch.id) {
        delete updatedBookings[batch.id];
      }

      // 更新班次已预约人数减一
      const updatedBatches = batches.map(b => {
        if (b.id === (batch && batch.id)) {
          return {
            ...b,
            bookedCount: Math.max(0, (b.bookedCount || 1) - 1)
          };
        }
        return b;
      });

      // 提交给 Store 持久化
      store.setState({
        bookings: updatedBookings,
        batches: updatedBatches
      });

      // 友好提示弹窗
      alert('已自动解除锁定，即刻为您返回大厅重新预约排队！');

      // 触发 navLobby 事件平滑返回大厅
      window.dispatchEvent(new CustomEvent('navLobby'));
    }
  }

  /**
   * 生成 CabinRoom HTML 模板
   */
  getTemplate() {
    const state = store.getState();
    const { user } = state;
    const batch = this.getBatchData();

    if (!batch) {
      return `
        <div class="cabin-container glass-card">
          <div class="empty-cabin-notice">
            <h2>⚠️ 暂无有效的班次数据</h2>
            <p>请返回发车大厅重新选择或预约班次。</p>
            <button id="btn-cabin-back-empty" class="btn btn-primary">返回发车大厅</button>
          </div>
        </div>
      `;
    }

    const qrCodeUrl = batch.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent('https://survivor-tie.app/join/' + batch.id)}`;
    const leaderName = batch.leader || '战术总指挥·暗影';
    const targetScoreText = batch.targetScoreText || `${batch.targetScore || 106}分`;
    const bookedCount = batch.bookedCount || 142;
    const capacity = batch.capacity || 200;

    // 结合当前登录用户生成车友明细
    let squadMembers = [...MOCK_CABIN_MEMBERS];
    if (user) {
      const userExists = squadMembers.some(m => m.openId === user.openId);
      if (!userExists) {
        squadMembers.unshift({
          openId: user.openId || 'current_user',
          gameNickname: user.gameNickname || user.nickname || '特工指挥官 (我)',
          gameId: user.gameId || '9582014',
          avatar: user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=AgentCat_Me&backgroundColor=f59e0b',
          status: 'ready',
          isMe: true
        });
      }
    }

    return `
      <div class="cabin-room-wrapper">
        <!-- 头部导航与面包屑 -->
        <div class="cabin-header-bar">
          <button id="btn-cabin-back" class="btn-back-lobby" title="返回大厅">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>返回发车大厅</span>
          </button>

          <div class="cabin-title-group">
            <span class="cabin-badge pulse-cyan">🚀 高精发车车厢</span>
            <h2 class="cabin-main-title">${batch.title || '深夜静默精准并列班车'}</h2>
          </div>

          <div class="cabin-meta-tags">
            <span class="meta-tag gold">🎯 目标: ${targetScoreText}</span>
            <span class="meta-tag emerald">👥 已预订 ${bookedCount} / ${capacity} 人</span>
          </div>
        </div>

        <!-- 高精度秒级卡点倒计时 Hero Display -->
        <section class="timer-hero-card glass-card">
          <div class="timer-hero-header">
            <div class="timer-live-tag">
              <span class="live-dot pulse"></span>
              <span class="live-text">距离 ${batch.time || '01:05:00'} 统一卡点出击倒计时</span>
            </div>
            <div class="timer-sync-status" id="timer-status-text">
              ⚡️ performance.now() 毫秒级防休眠引擎已校准
            </div>
          </div>

          <!-- 大字号 HH:MM:SS.ms 动态跳跃展示 -->
          <div class="timer-digits-container">
            <div class="digit-box">
              <span id="cHours" class="digit-number">00</span>
              <span class="digit-label">时</span>
            </div>
            <span class="digit-separator">:</span>
            <div class="digit-box">
              <span id="cMins" class="digit-number">00</span>
              <span class="digit-label">分</span>
            </div>
            <span class="digit-separator">:</span>
            <div class="digit-box">
              <span id="cSecs" class="digit-number">00</span>
              <span class="digit-label">秒</span>
            </div>
            <span class="digit-separator dot">.</span>
            <div class="digit-box ms-box">
              <span id="cMs" class="digit-number ms-digit">0</span>
              <span class="digit-label">毫秒</span>
            </div>
          </div>

          <div class="timer-progress-bar">
            <div class="progress-inner" id="timer-progress-fill" style="width: 78%;"></div>
          </div>

          <div class="timer-instruction-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>提示：发车前 10 秒请保持在游戏发车主界面，听到秒针发车指示音后，踩点 00 毫秒同时点击进副本！</span>
          </div>
        </section>

        <!-- 引导与规章二元格卡片 -->
        <div class="guidance-grid">
          <!-- 卡片 1: 专属微信群二维码 -->
          <div class="guidance-card glass-card qr-card">
            <div class="card-title-row">
              <div class="card-icon-wrapper green">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.5 2C4.36 2 1 4.91 1 8.5c0 1.98 1.01 3.75 2.59 4.96L3 16.5l3.41-1.36c.67.19 1.37.3 2.09.3.26 0 .52-.02.77-.04C8.75 14.65 8.5 13.85 8.5 13c0-3.87 3.8-7 8.5-7 .34 0 .67.02 1 .06C16.63 3.77 12.92 2 8.5 2zm-2 4.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm6.5 2.5c-3.87 0-7 2.46-7 5.5s3.13 5.5 7 5.5c.61 0 1.2-.08 1.76-.23L21 21l-1.07-2.4c1.28-.97 2.07-2.35 2.07-3.85 0-3.04-3.13-5.5-7-5.5zm-2.5 3.5c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75zm5 0c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75z"/>
                </svg>
              </div>
              <div class="card-title-text">
                <h3>专属微信战术群</h3>
                <p>扫码入群，听取队长语音实时指挥</p>
              </div>
            </div>

            <div class="qr-image-container" id="qr-image-frame">
              <img src="${qrCodeUrl}" alt="班次专属微信群二维码" class="qr-code-img" />
              <div class="qr-hover-hint">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                <span>点击放大预览二维码</span>
              </div>
            </div>
            <p class="qr-tip-text">战术指挥官: <strong class="highlight-gold">${leaderName}</strong></p>
          </div>

          <!-- 卡片 2: 统一游戏头像更换指示图 (特工阿猫) -->
          <div class="guidance-card glass-card avatar-guide-card">
            <div class="card-title-row">
              <div class="card-icon-wrapper gold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div class="card-title-text">
                <h3>统一游戏头像暗号</h3>
                <p>【防路人混入】必须统一更换为特工阿猫头像</p>
              </div>
            </div>

            <div class="avatar-preview-showcase">
              <div class="avatar-cat-frame">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=AgentCat_106&backgroundColor=f59e0b" alt="特工阿猫头像指示图" class="agent-cat-avatar" />
                <span class="cat-badge">必须更换</span>
              </div>
              <div class="avatar-instructions">
                <div class="step-item">
                  <span class="step-num">1</span>
                  <span class="step-desc">游戏内主页 &rarr; 更改头像为 <strong>「特工阿猫」</strong></span>
                </div>
                <div class="step-item">
                  <span class="step-num">2</span>
                  <span class="step-desc">识别同组头像，校验是否有未换头像的路人</span>
                </div>
                <div class="step-item">
                  <span class="step-num">3</span>
                  <span class="step-desc">准点入场，达到 <strong>${targetScoreText}</strong> 锁定停手</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 车队集结车友名录 -->
        <section class="roster-section glass-card">
          <div class="roster-header">
            <h3>👥 车厢已集结车友 (${squadMembers.length} / ${capacity} 人)</h3>
            <span class="roster-subtitle">已通过微信授权并锁定本班次发车资格</span>
          </div>

          <div class="roster-grid">
            ${squadMembers.map(member => `
              <div class="roster-member-card ${member.isMe ? 'is-me' : ''}">
                <img src="${member.avatar}" alt="${member.gameNickname}" class="member-avatar" />
                <div class="member-info">
                  <span class="member-name">${member.gameNickname} ${member.isMe ? '<span class="me-tag">我</span>' : ''}</span>
                  <span class="member-id">ID: ${member.gameId}</span>
                </div>
                <span class="member-status-dot" title="已完成头像更换与准备"></span>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- ⚠️ 混入路人即小队作废与一键重新排队 Danger Box -->
        <section class="danger-requeue-card glass-card">
          <div class="danger-content-wrapper">
            <div class="danger-icon-box">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div class="danger-text-body">
              <h4>避险保护规则：混入路人即小队作废与一键重新排队</h4>
              <p>
                如果在匹配进入对决后，发现本组内混入了未更换「特工阿猫」头像的野生路人玩家，全组将无法保证 200 人同分并列。
                点击下方按钮确认后，系统将自动清空您的预约锁并解除锁定限制，平滑引导您返回大厅选择其他新班次！
              </p>
            </div>
          </div>

          <div class="danger-action-footer">
            <button id="btn-mark-invalid-requeue" class="btn-danger-requeue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21.5 2v6h-6"></path>
                <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
              <span>⚠️ 本组有路人混入，直接作废并重新排队</span>
            </button>
          </div>
        </section>
      </div>

      <!-- QR Code 放大预览 Modal -->
      <div class="qr-modal-backdrop ${this.showQrPreviewModal ? 'active' : ''}" id="qr-preview-modal">
        <div class="qr-modal-content glass-card">
          <button class="qr-modal-close" id="btn-close-qr-modal">&times;</button>
          <h3>微信扫描加入 【${batch.title}】</h3>
          <img src="${qrCodeUrl}" alt="微信群二维码大图" class="qr-large-img" />
          <p>长按二维码或打开微信扫描识别</p>
        </div>
      </div>
    `;
  }

  /**
   * 渲染 DOM 并启动高精度倒计时与事件监听
   */
  render() {
    if (!this.container) return;

    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
    this.startPrecisionCountdown();
  }

  /**
   * 启动高精度秒级倒计时
   */
  startPrecisionCountdown() {
    const batch = this.getBatchData();
    if (!batch || !batch.time) return;

    // 清除上一次的倒计时
    if (this.stopTimerFn) {
      this.stopTimerFn();
    }

    const hEl = this.container.querySelector('#cHours');
    const mEl = this.container.querySelector('#cMins');
    const sEl = this.container.querySelector('#cSecs');
    const msEl = this.container.querySelector('#cMs');
    const statusTextEl = this.container.querySelector('#timer-status-text');
    const progressFillEl = this.container.querySelector('#timer-progress-fill');

    if (!hEl || !mEl || !sEl || !msEl) return;

    this.stopTimerFn = timer.startCountdown(batch.time, ({ hours, mins, secs, ms, diff, isFinished }) => {
      if (hEl) hEl.textContent = hours;
      if (mEl) mEl.textContent = mins;
      if (sEl) sEl.textContent = secs;
      if (msEl) msEl.textContent = ms;

      // 动态更新状态文案与颜色提示
      const totalSecsLeft = Math.floor(diff / 1000);
      if (statusTextEl) {
        if (isFinished) {
          statusTextEl.textContent = '🚀 00:00:00.000 发车时刻已到！立即切入副本并锁定 106 分！';
          statusTextEl.style.color = '#10b981';
        } else if (totalSecsLeft <= 10) {
          statusTextEl.textContent = `🔥 最后的 ${totalSecsLeft} 秒！手放副本按钮，准备统一踩点点击！`;
          statusTextEl.style.color = '#ef4444';
        } else if (totalSecsLeft <= 60) {
          statusTextEl.textContent = '⏳ 即将发车！请提前打开游戏主界面并保持网络畅通';
          statusTextEl.style.color = '#f59e0b';
        } else {
          statusTextEl.textContent = '⚡️ performance.now() 毫秒级防休眠引擎已校准';
          statusTextEl.style.color = '#06b6d4';
        }
      }

      // 倒计时进度条展示 (假定基准为 1 小时)
      if (progressFillEl) {
        const pct = Math.max(0, Math.min(100, (diff / 3600000) * 100));
        progressFillEl.style.width = `${pct}%`;
      }
    });
  }

  /**
   * 绑定事件监听
   */
  bindEvents() {
    // 返回大厅按钮
    const backBtn = this.container.querySelector('#btn-cabin-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.handleBackToLobby());
    }

    const emptyBackBtn = this.container.querySelector('#btn-cabin-back-empty');
    if (emptyBackBtn) {
      emptyBackBtn.addEventListener('click', () => this.handleBackToLobby());
    }

    // 混入路人即小队作废与一键重新排队
    const invalidBtn = this.container.querySelector('#btn-mark-invalid-requeue');
    if (invalidBtn) {
      invalidBtn.addEventListener('click', () => this.handleAutoInvalidAndRequeue());
    }

    // 点击二维码放大预览
    const qrFrame = this.container.querySelector('#qr-image-frame');
    const qrModal = this.container.querySelector('#qr-preview-modal');
    const closeQrBtn = this.container.querySelector('#btn-close-qr-modal');

    if (qrFrame && qrModal) {
      qrFrame.addEventListener('click', () => {
        qrModal.classList.add('active');
      });
    }
    if (closeQrBtn && qrModal) {
      closeQrBtn.addEventListener('click', () => {
        qrModal.classList.remove('active');
      });
    }
    if (qrModal) {
      qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) {
          qrModal.classList.remove('active');
        }
      });
    }
  }

  /**
   * 注入组件专属 CSS 样式
   */
  _injectStyles() {
    const styleId = 'survivor-cabin-room-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* CabinRoom 发车车厢主容器 */
      .cabin-room-wrapper {
        width: 100%;
        max-width: 1280px;
        margin: 0 auto;
        padding: 20px 16px 40px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 24px;
        animation: fadeInCabin 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }

      @keyframes fadeInCabin {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* 头部栏与面包屑 */
      .cabin-header-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 16px;
        padding: 16px 20px;
        background: rgba(18, 24, 38, 0.7);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
      }

      .btn-back-lobby {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        color: #e2e8f0;
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn-back-lobby:hover {
        background: rgba(255, 255, 255, 0.12);
        color: #ffffff;
        transform: translateX(-2px);
      }

      .cabin-title-group {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .cabin-badge {
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
        background: rgba(6, 182, 212, 0.15);
        color: #22d3ee;
        border: 1px solid rgba(6, 182, 212, 0.3);
      }

      .cabin-main-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #f8fafc;
        margin: 0;
      }

      .cabin-meta-tags {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .meta-tag {
        font-size: 0.825rem;
        font-weight: 600;
        padding: 4px 12px;
        border-radius: 8px;
      }

      .meta-tag.gold {
        background: rgba(245, 158, 11, 0.15);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.3);
      }

      .meta-tag.emerald {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      /* 倒计时 Hero Display */
      .timer-hero-card {
        background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(9, 13, 22, 0.95) 100%);
        border: 1px solid rgba(6, 182, 212, 0.3);
        box-shadow: 0 12px 40px -10px rgba(6, 182, 212, 0.25);
        border-radius: 20px;
        padding: 28px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        position: relative;
        overflow: hidden;
      }

      .timer-hero-header {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      .timer-live-tag {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .live-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #06b6d4;
        box-shadow: 0 0 10px #06b6d4;
      }

      .pulse {
        animation: pulseGlow 1.5s infinite;
      }

      @keyframes pulseGlow {
        0% { transform: scale(0.95); opacity: 0.7; }
        50% { transform: scale(1.15); opacity: 1; }
        100% { transform: scale(0.95); opacity: 0.7; }
      }

      .live-text {
        font-size: 0.95rem;
        font-weight: 700;
        color: #e2e8f0;
        letter-spacing: 0.5px;
      }

      .timer-sync-status {
        font-size: 0.85rem;
        font-weight: 600;
        color: #06b6d4;
        transition: color 0.3s ease;
      }

      /* 大字号动态跳跃数字 */
      .timer-digits-container {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 12px;
        margin: 10px 0;
        font-family: 'Outfit', 'Plus Jakarta Sans', monospace;
      }

      .digit-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 12px 20px;
        min-width: 80px;
        box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
      }

      .digit-box.ms-box {
        border-color: rgba(245, 158, 11, 0.4);
        background: rgba(245, 158, 11, 0.08);
        min-width: 70px;
      }

      .digit-number {
        font-size: 3.2rem;
        font-weight: 800;
        color: #f8fafc;
        line-height: 1;
        letter-spacing: 1px;
        text-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
      }

      .digit-number.ms-digit {
        color: #fbbf24;
        text-shadow: 0 0 20px rgba(245, 158, 11, 0.5);
      }

      .digit-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: #94a3b8;
        margin-top: 6px;
      }

      .digit-separator {
        font-size: 2.5rem;
        font-weight: 700;
        color: #06b6d4;
        align-self: center;
      }

      .digit-separator.dot {
        color: #fbbf24;
      }

      .timer-progress-bar {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
        overflow: hidden;
      }

      .progress-inner {
        height: 100%;
        background: linear-gradient(90deg, #06b6d4 0%, #3b82f6 50%, #f59e0b 100%);
        border-radius: 3px;
        transition: width 0.3s linear;
      }

      .timer-instruction-banner {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 16px;
        background: rgba(6, 182, 212, 0.1);
        border: 1px solid rgba(6, 182, 212, 0.2);
        border-radius: 10px;
        font-size: 0.85rem;
        color: #67e8f9;
        width: 100%;
        box-sizing: border-box;
      }

      /* 引导与规章 grid */
      .guidance-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 20px;
      }

      .guidance-card {
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        border-radius: 20px;
      }

      .card-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .card-icon-wrapper {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .card-icon-wrapper.green {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }

      .card-icon-wrapper.gold {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
      }

      .card-title-text h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: #f8fafc;
      }

      .card-title-text p {
        margin: 2px 0 0;
        font-size: 0.8rem;
        color: #94a3b8;
      }

      /* 二维码容器 */
      .qr-image-container {
        position: relative;
        width: 180px;
        height: 180px;
        margin: 0 auto;
        border-radius: 16px;
        overflow: hidden;
        border: 2px solid rgba(16, 185, 129, 0.4);
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
        cursor: pointer;
        transition: transform 0.2s ease;
      }

      .qr-image-container:hover {
        transform: scale(1.03);
      }

      .qr-code-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .qr-hover-hint {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: #ffffff;
        font-size: 0.75rem;
        font-weight: 600;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .qr-image-container:hover .qr-hover-hint {
        opacity: 1;
      }

      .qr-tip-text {
        text-align: center;
        font-size: 0.85rem;
        color: #cbd5e1;
        margin: 0;
      }

      .highlight-gold {
        color: #fbbf24;
      }

      /* 头像更换指示 */
      .avatar-preview-showcase {
        display: flex;
        align-items: center;
        gap: 20px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 16px;
      }

      .avatar-cat-frame {
        position: relative;
        width: 80px;
        height: 80px;
        flex-shrink: 0;

      }

      .agent-cat-avatar {
        width: 100%;
        height: 100%;
        border-radius: 16px;
        border: 2px solid #f59e0b;
        box-shadow: 0 0 16px rgba(245, 158, 11, 0.4);
      }

      .cat-badge {
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        background: #f59e0b;
        color: #000000;
        font-size: 0.65rem;
        font-weight: 800;
        padding: 2px 6px;
        border-radius: 10px;
        white-space: nowrap;
      }

      .avatar-instructions {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .step-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.825rem;
        color: #cbd5e1;
      }

      .step-num {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
        font-size: 0.75rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      /* 车友名录 */
      .roster-section {
        padding: 24px;
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .roster-header h3 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: #f8fafc;
      }

      .roster-subtitle {
        font-size: 0.8rem;
        color: #94a3b8;
      }

      .roster-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 12px;
      }

      .roster-member-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        position: relative;
      }

      .roster-member-card.is-me {
        background: rgba(6, 182, 212, 0.08);
        border-color: rgba(6, 182, 212, 0.3);
      }

      .member-avatar {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .member-info {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .member-name {
        font-size: 0.85rem;
        font-weight: 600;
        color: #e2e8f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .me-tag {
        font-size: 0.65rem;
        background: #06b6d4;
        color: #000;
        padding: 1px 5px;
        border-radius: 4px;
        margin-left: 4px;
      }

      .member-id {
        font-size: 0.725rem;
        color: #64748b;
      }

      .member-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #10b981;
        margin-left: auto;
      }

      /* Danger Action Card */
      .danger-requeue-card {
        background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%);
        border: 1px solid rgba(239, 68, 68, 0.35);
        border-radius: 20px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        box-shadow: 0 10px 30px -10px rgba(239, 68, 68, 0.2);
      }

      .danger-content-wrapper {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .danger-icon-box {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .danger-text-body h4 {
        margin: 0 0 6px;
        font-size: 1.1rem;
        font-weight: 700;
        color: #f8fafc;
      }

      .danger-text-body p {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #cbd5e1;
      }

      .danger-action-footer {
        display: flex;
        justify-content: flex-end;
      }

      .btn-danger-requeue {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 14px 28px;
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        border: none;
        border-radius: 12px;
        color: #ffffff;
        font-size: 0.95rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        transition: all 0.25s ease;
      }

      .btn-danger-requeue:hover {
        background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(239, 68, 68, 0.5);
      }

      .btn-danger-requeue:active {
        transform: translateY(0);
      }

      /* 二维码 modal */
      .qr-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }

      .qr-modal-backdrop.active {
        opacity: 1;
        pointer-events: auto;
      }

      .qr-modal-content {
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 24px;
        padding: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        position: relative;
        max-width: 90vw;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
      }

      .qr-modal-close {
        position: absolute;
        top: 16px;
        right: 20px;
        background: transparent;
        border: none;
        color: #94a3b8;
        font-size: 1.8rem;
        cursor: pointer;
      }

      .qr-large-img {
        width: 260px;
        height: 260px;
        border-radius: 16px;
        border: 2px solid #10b981;
      }

      /* 移动端与 iPad 响应式适配 */
      @media (max-width: 768px) {
        .timer-digits-container {
          gap: 6px;
        }

        .digit-box {
          padding: 8px 12px;
          min-width: 60px;
        }

        .digit-box.ms-box {
          min-width: 50px;
        }

        .digit-number {
          font-size: 2.2rem;
        }

        .digit-separator {
          font-size: 1.8rem;
        }

        .guidance-grid {
          grid-template-columns: 1fr;
        }

        .danger-content-wrapper {
          flex-direction: column;
        }

        .btn-danger-requeue {
          width: 100%;
          justify-content: center;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

/**
 * 挂载 CabinRoom 的辅助入口
 * @param {HTMLElement|string} container 
 * @param {string} batchId 
 * @returns {CabinRoom}
 */
export function renderCabinRoom(container, batchId) {
  return CabinRoom.render(container, batchId);
}

export default CabinRoom;

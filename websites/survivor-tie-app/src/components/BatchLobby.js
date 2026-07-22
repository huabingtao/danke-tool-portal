/**
 * 弹壳特工队 - 并列发车平台 BatchLobby 每日发车班次大厅组件
 * Survivor Tie & Dispatch Platform - Daily Batch Lobby Component
 */

import store from '../state/store.js';

// 预置车友名录（模拟各班次已报名微信玩家明细）
const MOCK_REGISTERED_PLAYERS = {
  'batch-0105': [
    {
      openId: 'wx_player_001',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ShadowAgent_001&backgroundColor=111827',
      gameNickname: '暗影特工·极速',
      gameId: '9582014',
      bookedAt: Date.now() - 600000
    },
    {
      openId: 'wx_player_002',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=GoldWarrior_002&backgroundColor=1e1b4b',
      gameNickname: '枪火圣徒·阿亮',
      gameId: '8849201',
      bookedAt: Date.now() - 500000
    },
    {
      openId: 'wx_player_003',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberSurvivor_003&backgroundColor=0f172a',
      gameNickname: '极光漫游者',
      gameId: '7730129',
      bookedAt: Date.now() - 300000
    },
    {
      openId: 'wx_player_004',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=StormCommander_004&backgroundColor=111827',
      gameNickname: '绝境突围者',
      gameId: '6629104',
      bookedAt: Date.now() - 120000
    }
  ],
  'batch-0805': [
    {
      openId: 'wx_player_005',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=TacticalMaster_005&backgroundColor=1e1b4b',
      gameNickname: '战术大师·天哥',
      gameId: '9920183',
      bookedAt: Date.now() - 400000
    },
    {
      openId: 'wx_player_006',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AlphaOperative_006&backgroundColor=0f172a',
      gameNickname: '黄金战甲·小闪',
      gameId: '8810294',
      bookedAt: Date.now() - 250000
    },
    {
      openId: 'wx_player_007',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=VanguardHero_007&backgroundColor=111827',
      gameNickname: '微光控分号',
      gameId: '5541092',
      bookedAt: Date.now() - 90000
    }
  ]
};

export class BatchLobby {
  /**
   * @param {HTMLElement|string} container - 挂载的目标 DOM 容器
   * @param {Object} [options] - 配置项
   * @param {Function} [options.onEnterCabin] - 点击进入车厢的回调函数
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = options;
    this.unsubscribe = null;
    this.timerId = null;

    this.searchQuery = '';
    this.filterTab = 'all'; // 'all' | 'recruiting' | 'my' | '106'
    this.confirmModalBatch = null; // 待确认预约的班次对象
    this.expandedRosterBatchId = null; // 展开明细的班次 ID
    this.feedbackMsg = null;
    this.feedbackType = 'success'; // 'success' | 'error' | 'info'
  }

  /**
   * 初始化并挂载 BatchLobby 组件
   */
  mount() {
    if (!this.container) {
      console.warn('[BatchLobby] Container not found');
      return;
    }

    // 注入专属样式
    this._injectStyles();

    // 首次渲染 DOM
    this.render();

    // 启动 1 秒级倒计时定时器，驱动 3 分钟冷静锁实时更新
    this.startTimer();

    // 订阅全局 Store 状态
    this.unsubscribe = store.subscribe(() => {
      this.render();
    });
  }

  /**
   * 卸载组件并清理资源
   */
  unmount() {
    this.stopTimer();
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * 启动 1 秒倒计时定时器
   */
  startTimer() {
    this.stopTimer();
    this.timerId = setInterval(() => {
      this._updateCooldownDisplay();
    }, 1000);
  }

  /**
   * 停止定时器
   */
  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * 动态刷新冷静期倒计时文本（无痛毫秒/秒级更新）
   */
  _updateCooldownDisplay() {
    if (!this.container) return;

    const cooldownEls = this.container.querySelectorAll('.cooldown-timer-text');
    if (!cooldownEls.length) return;

    const state = store.getState();
    const user = state.user;
    if (!user || !user.openId) return;

    const booking = state.bookings[user.openId];
    if (!booking || !booking.locked) return;

    const cooldownInfo = this._getCooldownStatus(booking);

    cooldownEls.forEach(el => {
      if (cooldownInfo.isCoolingDown) {
        el.textContent = `🔒 预约锁死中 (冷静期还剩 ${cooldownInfo.remainingSec} 秒)`;
      } else {
        el.textContent = `🔒 已锁单硬锁定 (等待发车)`;
      }
    });
  }

  /**
   * 计算指定预约记录的冷静锁状态 (3 分钟冷静期 = 180 秒)
   * @param {Object} booking 
   * @returns {Object} { isCoolingDown: boolean, remainingSec: number, lockText: string }
   */
  _getCooldownStatus(booking) {
    if (!booking || !booking.bookedAt) {
      return { isCoolingDown: false, remainingSec: 0, lockText: '' };
    }

    const elapsedMs = Date.now() - booking.bookedAt;
    const cooldownDurationMs = 3 * 60 * 1000; // 180,000 ms

    if (elapsedMs < cooldownDurationMs) {
      const remainingSec = Math.ceil((cooldownDurationMs - elapsedMs) / 1000);
      return {
        isCoolingDown: true,
        remainingSec,
        lockText: `🔒 预约锁死中 (冷静期还剩 ${remainingSec} 秒)`
      };
    }

    return {
      isCoolingDown: false,
      remainingSec: 0,
      lockText: `🔒 已锁单硬锁定 (等待发车)`
    };
  }

  /**
   * 获取某班次完整的已报名玩家列表（包含 mock 数据 + 当前用户）
   * @param {Object} batch 
   * @returns {Array}
   */
  getRosterForBatch(batch) {
    const baseList = MOCK_REGISTERED_PLAYERS[batch.id] || [
      {
        openId: 'wx_mock_def1',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AgentDefault1&backgroundColor=111827',
        gameNickname: '战术急先锋',
        gameId: '8810239',
        bookedAt: Date.now() - 450000
      },
      {
        openId: 'wx_mock_def2',
        avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AgentDefault2&backgroundColor=1e1b4b',
        gameNickname: '暗影控分专家',
        gameId: '9527104',
        bookedAt: Date.now() - 320000
      }
    ];

    const state = store.getState();
    const user = state.user;
    const userBooking = user && state.bookings[user.openId];

    const roster = [...baseList];

    // 如果当前登录用户预约了该班次，且不在列表中，则插入最前端
    if (user && userBooking && userBooking.batchId === batch.id && userBooking.status === 'booked') {
      const exists = roster.some(p => p.openId === user.openId || p.gameId === user.gameId);
      if (!exists) {
        roster.unshift({
          openId: user.openId,
          avatar: user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.gameId}`,
          gameNickname: user.gameNickname || user.nickname || '特工指挥官',
          gameId: user.gameId || '9582014',
          bookedAt: userBooking.bookedAt || Date.now(),
          isCurrentUser: true
        });
      }
    }

    return roster;
  }

  /**
   * 显示 Toast 提示信息
   */
  showFeedback(msg, type = 'success') {
    this.feedbackMsg = msg;
    this.feedbackType = type;
    this.render();

    setTimeout(() => {
      if (this.feedbackMsg === msg) {
        this.feedbackMsg = null;
        this.render();
      }
    }, 4000);
  }

  /**
   * 打开预约确认对话框
   * @param {Object} batch 
   */
  openConfirmModal(batch) {
    const state = store.getState();
    if (!state.user) {
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }

    this.confirmModalBatch = batch;
    this.render();
  }

  /**
   * 关闭预约确认对话框
   */
  closeConfirmModal() {
    this.confirmModalBatch = null;
    this.render();
  }

  /**
   * 执行预约逻辑（保存 bookings[user.openId] 锁记录）
   * @param {string} batchId 
   */
  confirmBooking(batchId) {
    const state = store.getState();
    const user = state.user;

    if (!user || !user.openId) {
      this.showFeedback('请先完成微信授权登录！', 'error');
      window.dispatchEvent(new CustomEvent('openAuthModal'));
      return;
    }

    const batch = state.batches.find(b => b.id === batchId);
    if (!batch) {
      this.showFeedback('未找到指定的发车班次', 'error');
      return;
    }

    if (batch.status === 'void') {
      this.showFeedback('该班次因路人混入已作废，无法预约！', 'error');
      return;
    }

    if ((batch.bookedCount || 0) >= batch.capacity) {
      this.showFeedback('该班次名额已满！', 'error');
      return;
    }

    const now = Date.now();
    const bookingRecord = {
      batchId,
      locked: true,
      status: 'booked',
      bookedAt: now
    };

    // 在 bookings[user.openId] 保存预约信息
    const currentBookings = { ...state.bookings };
    currentBookings[user.openId] = bookingRecord;
    currentBookings[batchId] = bookingRecord; // 同时索引 batchId 方便检索

    // 更新班次已预约人数
    const updatedBatches = state.batches.map(b => {
      if (b.id === batchId) {
        return {
          ...b,
          bookedCount: Math.min(b.capacity, (b.bookedCount || 0) + 1)
        };
      }
      return b;
    });

    // 提交 store
    store.setState({
      bookings: currentBookings,
      batches: updatedBatches
    });

    this.closeConfirmModal();
    this.showFeedback(`🎉 成功预约「${batch.title}」！3 分钟冷静锁现已生效。`, 'success');
  }

  /**
   * 触发进入车厢事件
   * @param {string} batchId 
   */
  handleEnterCabin(batchId) {
    const state = store.getState();
    const user = state.user;
    const booking = user ? state.bookings[user.openId] : null;

    const eventDetail = {
      batchId,
      user,
      booking
    };

    // 触发全局 enterCabin 自定义事件
    window.dispatchEvent(new CustomEvent('enterCabin', { detail: eventDetail }));

    // 调用回调选项（若存在）
    if (typeof this.options.onEnterCabin === 'function') {
      this.options.onEnterCabin(batchId);
    }

    this.showFeedback(`🚗 正在进入「${batchId}」发车车厢... 准备毫秒级并列冲刺！`, 'info');
  }

  /**
   * 切换班次玩家明细展开/收起
   * @param {string} batchId 
   */
  toggleRosterExpand(batchId) {
    if (this.expandedRosterBatchId === batchId) {
      this.expandedRosterBatchId = null;
    } else {
      this.expandedRosterBatchId = batchId;
    }
    this.render();
  }

  /**
   * 生成 HTML 模板
   * @returns {string}
   */
  getTemplate() {
    const state = store.getState();
    const user = state.user;
    const batches = state.batches || [];
    const userBooking = user ? state.bookings[user.openId] : null;

    // 1. 过滤班次列表
    let filteredBatches = batches.filter(batch => {
      // 搜索过滤
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const matchTitle = (batch.title || '').toLowerCase().includes(query);
        const matchTime = (batch.time || '').toLowerCase().includes(query);
        const matchLeader = (batch.leader || '').toLowerCase().includes(query);
        const matchNotice = (batch.notice || '').toLowerCase().includes(query);
        if (!matchTitle && !matchTime && !matchLeader && !matchNotice) {
          return false;
        }
      }

      // Tab 过滤
      if (this.filterTab === 'recruiting') {
        return batch.status === 'recruiting' && (batch.bookedCount || 0) < batch.capacity;
      }
      if (this.filterTab === 'my') {
        return userBooking && userBooking.batchId === batch.id && userBooking.status === 'booked';
      }
      if (this.filterTab === '106') {
        return batch.targetScore === 106;
      }

      return true;
    });

    // 2. 生成 Alert 提示 DOM (若有)
    let feedbackHtml = '';
    if (this.feedbackMsg) {
      feedbackHtml = `
        <div class="lobby-feedback-toast ${this.feedbackType}">
          <span class="toast-icon">
            ${this.feedbackType === 'success' ? '✅' : this.feedbackType === 'error' ? '⚠️' : 'ℹ️'}
          </span>
          <span class="toast-text">${this.feedbackMsg}</span>
        </div>
      `;
    }

    // 3. 生成班次列表卡片 DOM
    let batchCardsHtml = '';
    if (filteredBatches.length === 0) {
      batchCardsHtml = `
        <div class="lobby-empty-state">
          <div class="empty-icon">🏎️</div>
          <h3 class="empty-title">暂无符合条件的发车班次</h3>
          <p class="empty-sub">切换筛选分类或清空搜索关键词重试，也可在管理后台发布新班次。</p>
        </div>
      `;
    } else {
      batchCardsHtml = filteredBatches.map(batch => this._renderBatchCard(batch, user, userBooking)).join('');
    }

    // 4. 生成预约确认对话框 Modal (若激活)
    let confirmModalHtml = '';
    if (this.confirmModalBatch) {
      confirmModalHtml = this._renderConfirmModal(this.confirmModalBatch, user);
    }

    // 5. 主大厅模板结构
    return `
      <section class="batch-lobby-wrapper">
        ${feedbackHtml}

        <!-- Lobby Header & Controls -->
        <div class="lobby-header-bar">
          <div class="lobby-title-area">
            <div class="lobby-badge">
              <span class="badge-dot pulse"></span>
              <span>每日发车班次大厅</span>
            </div>
            <h2 class="lobby-main-title">
              同组毫秒级并列发车 <span class="gold-highlight">每日班次调度</span>
            </h2>
            <p class="lobby-subtitle">
              严格恪守 3 分钟冷静锁与统一游戏头像识别机制，确保 200 人精准控分 106 并列登顶。
            </p>
          </div>

          <div class="lobby-system-time">
            <div class="time-clock">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>服务器毫秒心跳</span>
            </div>
            <span class="time-value" id="lobby-live-clock">${new Date().toLocaleTimeString('zh-CN', { hour12: false })}</span>
          </div>
        </div>

        <!-- Filters & Search Toolbar -->
        <div class="lobby-toolbar">
          <div class="lobby-tabs">
            <button class="lobby-tab-btn ${this.filterTab === 'all' ? 'active' : ''}" data-tab="all">
              <span>全部分次</span>
              <span class="tab-count">${batches.length}</span>
            </button>
            <button class="lobby-tab-btn ${this.filterTab === 'recruiting' ? 'active' : ''}" data-tab="recruiting">
              <span>🔥 招募中</span>
              <span class="tab-count">${batches.filter(b => b.status === 'recruiting' && b.bookedCount < b.capacity).length}</span>
            </button>
            <button class="lobby-tab-btn ${this.filterTab === 'my' ? 'active' : ''}" data-tab="my">
              <span>⭐ 我的预约</span>
              <span class="tab-count">${userBooking ? 1 : 0}</span>
            </button>
            <button class="lobby-tab-btn ${this.filterTab === '106' ? 'active' : ''}" data-tab="106">
              <span>🎯 106分并列</span>
              <span class="tab-count">${batches.filter(b => b.targetScore === 106).length}</span>
            </button>
          </div>

          <div class="lobby-search-box">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              id="lobby-search-input" 
              class="lobby-search-input" 
              placeholder="搜索发车时间、班次名称、队长ID..." 
              value="${this.searchQuery}"
            />
            ${this.searchQuery ? '<button class="btn-clear-search" id="btn-clear-search">&times;</button>' : ''}
          </div>
        </div>

        <!-- Batch Cards Grid -->
        <div class="batch-cards-grid">
          ${batchCardsHtml}
        </div>

        ${confirmModalHtml}
      </section>
    `;
  }

  /**
   * 渲染单个班次卡片 HTML
   * @param {Object} batch 
   * @param {Object} user 
   * @param {Object} userBooking 
   * @returns {string}
   */
  _renderBatchCard(batch, user, userBooking) {
    const isBookedByMe = userBooking && userBooking.batchId === batch.id && userBooking.status === 'booked';
    const isBookedOther = userBooking && userBooking.batchId !== batch.id && userBooking.status === 'booked';

    const isVoid = batch.status === 'void';
    const isFull = (batch.bookedCount || 0) >= batch.capacity;
    const isDispatched = batch.status === 'dispatched';

    // 状态 Badge 渲染
    let statusBadgeHtml = '';
    if (isVoid) {
      statusBadgeHtml = `<span class="batch-status-tag void">⚠️ 路人混入作废</span>`;
    } else if (isDispatched) {
      statusBadgeHtml = `<span class="batch-status-tag dispatched">⚡ 已发车冲刺</span>`;
    } else if (isFull) {
      statusBadgeHtml = `<span class="batch-status-tag full">🚫 班次已满员</span>`;
    } else {
      statusBadgeHtml = `<span class="batch-status-tag recruiting"><span class="pulse-dot"></span> 极速招募中</span>`;
    }

    // 冷静期状态获取
    const cooldownInfo = isBookedByMe ? this._getCooldownStatus(userBooking) : null;

    // 标签渲染
    const tagsHtml = (batch.tags || []).map(t => `<span class="batch-tag-chip">#${t}</span>`).join('');

    // 报名玩家明细列表
    const roster = this.getRosterForBatch(batch);
    const isRosterExpanded = this.expandedRosterBatchId === batch.id;
    const rosterPreviewCount = Math.min(5, roster.length);

    // 进度条百分比
    const pct = Math.min(100, Math.round(((batch.bookedCount || 0) / (batch.capacity || 200)) * 100));

    // 按钮与控制面板 Html
    let actionAreaHtml = '';

    if (!user) {
      // 未登录
      actionAreaHtml = `
        <button class="btn-batch-action login-required" data-action="login">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.5 2C4.36 2 1 4.91 1 8.5c0 1.98 1.01 3.75 2.59 4.96L3 16.5l3.41-1.36c.67.19 1.37.3 2.09.3.26 0 .52-.02.77-.04C8.75 14.65 8.5 13.85 8.5 13c0-3.87 3.8-7 8.5-7 .34 0 .67.02 1 .06C16.63 3.77 12.92 2 8.5 2z"/>
          </svg>
          微信一键登录预约
        </button>
      `;
    } else if (isBookedByMe) {
      // 已预约当前班次 (展示 3 分钟冷静锁状态与进入车厢按钮)
      actionAreaHtml = `
        <div class="cooldown-lock-card">
          <div class="cooldown-lock-header">
            <span class="lock-icon">🔒</span>
            <span class="cooldown-timer-text">${cooldownInfo.lockText}</span>
          </div>
          <div class="cooldown-lock-sub">
            ${cooldownInfo.isCoolingDown 
              ? '预约 3 分钟内处于硬冷静期，严禁任何退改撤销操作。' 
              : isVoid 
                ? '班次因路人混入作废，预约锁定自动解除。' 
                : '预约已硬锁定，请在发车前 5 分钟在发车车厢内集合！'}
          </div>
          <button class="btn-batch-action enter-cabin" data-action="enter" data-id="${batch.id}">
            <span class="btn-icon">🚗</span>
            <span>进入发车车厢</span>
            <span class="btn-glow-bar"></span>
          </button>
        </div>
      `;
    } else if (isVoid) {
      // 班次已作废
      actionAreaHtml = `
        <button class="btn-batch-action disabled" disabled>
          ⚠️ 班次已作废 (路人混入)
        </button>
      `;
    } else if (isBookedOther) {
      // 已预约其他班次
      actionAreaHtml = `
        <button class="btn-batch-action disabled" disabled title="您已预约其他班次，需等待发车或作废后解锁">
          🔒 已预约其他班次 (${userBooking.batchId})
        </button>
      `;
    } else if (isFull) {
      // 班次满员
      actionAreaHtml = `
        <button class="btn-batch-action disabled" disabled>
          🚫 名额已满 (${batch.bookedCount}/${batch.capacity})
        </button>
      `;
    } else {
      // 可预约
      actionAreaHtml = `
        <button class="btn-batch-action book-now" data-action="book" data-id="${batch.id}">
          <span class="btn-icon">🎯</span>
          <span>立即预约发车 (3分钟冷静锁)</span>
        </button>
      `;
    }

    return `
      <article class="batch-card ${isBookedByMe ? 'is-my-booking' : ''} ${isVoid ? 'is-void' : ''}">
        <!-- Card Header -->
        <div class="batch-card-header">
          <div class="time-banner">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span class="time-text">${batch.time || '00:00:00'}</span>
          </div>

          <div class="header-badges">
            <span class="score-pill">🎯 控分目标: ${batch.targetScoreText || batch.targetScore || '106分'}</span>
            ${statusBadgeHtml}
          </div>
        </div>

        <!-- Card Body -->
        <div class="batch-card-body">
          <h3 class="batch-title">${batch.title || '并列发车班次'}</h3>
          
          <div class="leader-info-row">
            <span class="leader-label">👑 指挥官:</span>
            <span class="leader-name">${batch.leader || '战术指挥中心'}</span>
          </div>

          <div class="batch-tags-row">
            ${tagsHtml}
          </div>

          <!-- Notice Box -->
          <div class="batch-notice-box">
            <div class="notice-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>统一头像与发车战术规范</span>
            </div>
            <p class="notice-content">${batch.notice || '统一更换微信游戏头像，按时在组队房间集结。'}</p>
          </div>

          <!-- Progress Capacity Bar -->
          <div class="capacity-progress-wrapper">
            <div class="capacity-meta">
              <span class="cap-label">👥 已报名车友</span>
              <span class="cap-value"><strong>${batch.bookedCount || 0}</strong> / ${batch.capacity || 200} 人</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${pct >= 90 ? 'danger' : ''}" style="width: ${pct}%;"></div>
            </div>
          </div>

          <!-- Registered Players Detail Section (已报名玩家明细) -->
          <div class="roster-section">
            <div class="roster-header" data-id="${batch.id}">
              <div class="roster-title">
                <span class="roster-icon">👥</span>
                <span>已报名玩家明细 (${roster.length}人)</span>
              </div>
              <button class="btn-toggle-roster" data-id="${batch.id}">
                <span>${isRosterExpanded ? '收起明细 ▲' : '查看完整明细 ▼'}</span>
              </button>
            </div>

            <!-- Avatar Row Preview -->
            <div class="roster-avatar-preview">
              ${roster.slice(0, rosterPreviewCount).map(p => `
                <div class="roster-avatar-chip ${p.isCurrentUser ? 'current-user' : ''}" title="${p.gameNickname} (ID: ${p.gameId})">
                  <img src="${p.avatar}" alt="${p.gameNickname}" class="player-avatar-img" />
                  ${p.isCurrentUser ? '<span class="my-tag">我</span>' : ''}
                </div>
              `).join('')}
              ${roster.length > rosterPreviewCount ? `<div class="roster-more-chip">+${roster.length - rosterPreviewCount}</div>` : ''}
            </div>

            <!-- Expanded Roster Detailed Grid -->
            ${isRosterExpanded ? `
              <div class="roster-details-grid">
                ${roster.map(p => `
                  <div class="player-detail-card ${p.isCurrentUser ? 'highlight-me' : ''}">
                    <div class="player-avatar-wrapper">
                      <img src="${p.avatar}" alt="${p.gameNickname}" class="player-grid-avatar" />
                    </div>
                    <div class="player-info-col">
                      <div class="player-nickname-row">
                        <span class="player-nickname" title="${p.gameNickname}">${p.gameNickname}</span>
                        ${p.isCurrentUser ? '<span class="badge-me">已锁单</span>' : '<span class="badge-locked">🔒 已锁定</span>'}
                      </div>
                      <div class="player-id-row">
                        <span class="id-label">游戏ID:</span>
                        <span class="id-value">${p.gameId}</span>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Card Footer Actions -->
        <div class="batch-card-footer">
          ${actionAreaHtml}
        </div>
      </article>
    `;
  }

  /**
   * 渲染预约确认 Modal
   * @param {Object} batch 
   * @param {Object} user 
   * @returns {string}
   */
  _renderConfirmModal(batch, user) {
    return `
      <div class="confirm-modal-backdrop">
        <div class="confirm-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
          <div class="modal-accent-bar"></div>
          
          <button class="confirm-modal-close" id="btn-confirm-close" aria-label="关闭">&times;</button>

          <div class="confirm-modal-header">
            <div class="confirm-icon-box">🎯</div>
            <h3 id="confirm-modal-title" class="confirm-modal-title">确认预约该发车班次？</h3>
            <p class="confirm-modal-sub">请仔细阅读 3 分钟冷静锁与发车规范</p>
          </div>

          <div class="confirm-modal-body">
            <div class="summary-card">
              <div class="summary-item">
                <span class="s-label">班次名称：</span>
                <span class="s-val gold">${batch.title}</span>
              </div>
              <div class="summary-item">
                <span class="s-label">精确发车时间：</span>
                <span class="s-val">${batch.time}</span>
              </div>
              <div class="summary-item">
                <span class="s-label">目标控分：</span>
                <span class="s-val">${batch.targetScoreText || '106分'}</span>
              </div>
              <div class="summary-item">
                <span class="s-label">预约玩家：</span>
                <span class="s-val">${user ? `${user.gameNickname || user.nickname} (ID: ${user.gameId})` : '未登录'}</span>
              </div>
            </div>

            <div class="cooldown-warning-box">
              <div class="warning-title">
                <span class="warn-icon">🔒</span>
                <span>核心规则：3 分钟硬冷静锁 (3-Min Cooldown Lock)</span>
              </div>
              <ul class="warning-list">
                <li>预约成功后将即刻进入 <strong>3 分钟 (180 秒) 锁定冷静期</strong>。</li>
                <li><strong>冷静期内严禁退改、撤销或变更班次</strong>，保证 200 人并列阵型稳定性。</li>
                <li>冷静期过后维持硬锁定，直到进入发车车厢或发生“路人混入作废”时解锁。</li>
              </ul>
            </div>
          </div>

          <div class="confirm-modal-footer">
            <button class="btn-confirm-cancel" id="btn-confirm-cancel">取消</button>
            <button class="btn-confirm-submit" id="btn-confirm-submit" data-id="${batch.id}">
              🔒 确认预约并开启 3分钟冷静锁
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染 DOM 并绑定事件监听
   */
  render() {
    if (!this.container) return;
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
  }

  /**
   * 绑定事件监听
   */
  bindEvents() {
    if (!this.container) return;

    // Search Input Event
    const searchInput = this.container.querySelector('#lobby-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.render();
        // 恢复焦点
        const newInput = this.container.querySelector('#lobby-search-input');
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      });
    }

    // Clear search button
    const clearSearchBtn = this.container.querySelector('#btn-clear-search');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        this.searchQuery = '';
        this.render();
      });
    }

    // Filter Tabs
    const tabBtns = this.container.querySelectorAll('.lobby-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filterTab = btn.getAttribute('data-tab') || 'all';
        this.render();
      });
    });

    // Toggle Roster Details Expand/Collapse
    const toggleRosterBtns = this.container.querySelectorAll('.btn-toggle-roster, .roster-header');
    toggleRosterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        if (id) {
          e.stopPropagation();
          this.toggleRosterExpand(id);
        }
      });
    });

    // Action Buttons: Login / Book / Enter Cabin
    const actionBtns = this.container.querySelectorAll('.btn-batch-action');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const batchId = btn.getAttribute('data-id');

        if (action === 'login') {
          window.dispatchEvent(new CustomEvent('openAuthModal'));
        } else if (action === 'book' && batchId) {
          const state = store.getState();
          const batch = state.batches.find(b => b.id === batchId);
          if (batch) {
            this.openConfirmModal(batch);
          }
        } else if (action === 'enter' && batchId) {
          this.handleEnterCabin(batchId);
        }
      });
    });

    // Modal Close buttons
    const modalCloseBtn = this.container.querySelector('#btn-confirm-close');
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => this.closeConfirmModal());
    }

    const modalCancelBtn = this.container.querySelector('#btn-confirm-cancel');
    if (modalCancelBtn) {
      modalCancelBtn.addEventListener('click', () => this.closeConfirmModal());
    }

    // Modal Submit Confirm button
    const modalSubmitBtn = this.container.querySelector('#btn-confirm-submit');
    if (modalSubmitBtn) {
      modalSubmitBtn.addEventListener('click', () => {
        const id = modalSubmitBtn.getAttribute('data-id');
        if (id) {
          this.confirmBooking(id);
        }
      });
    }

    // Modal backdrop click to close
    const backdrop = this.container.querySelector('.confirm-modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeConfirmModal();
        }
      });
    }
  }

  /**
   * 注入 Component 专属 CSS 样式
   */
  _injectStyles() {
    if (document.getElementById('batch-lobby-styles')) return;

    const style = document.createElement('style');
    style.id = 'batch-lobby-styles';
    style.textContent = `
      /* ==========================================================================
         BatchLobby Minimalist Art Design System Component Styles
         ========================================================================== */

      .batch-lobby-wrapper {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        position: relative;
      }

      /* Feedback Toast */
      .lobby-feedback-toast {
        position: fixed;
        top: 5.5rem;
        right: 2rem;
        z-index: 999;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.85rem 1.25rem;
        border-radius: var(--radius-md, 12px);
        background: rgba(15, 21, 36, 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid var(--glass-border-gold, rgba(226, 177, 80, 0.4));
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(226, 177, 80, 0.2);
        color: var(--text-primary, #f1f5f9);
        font-size: 0.9rem;
        font-weight: 600;
        animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .lobby-feedback-toast.error {
        border-color: rgba(239, 68, 68, 0.5);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(239, 68, 68, 0.2);
      }

      @keyframes toastSlideIn {
        from { opacity: 0; transform: translateY(-15px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Header Bar */
      .lobby-header-bar {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      }

      .lobby-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 4px 12px;
        border-radius: var(--radius-full, 9999px);
        background: var(--gold-muted, rgba(226, 177, 80, 0.15));
        border: 1px solid rgba(226, 177, 80, 0.3);
        color: var(--gold-light, #fde047);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin-bottom: 0.5rem;
      }

      .badge-dot.pulse {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 8px #10b981;
        animation: pulseGlow 1.8s infinite;
      }

      @keyframes pulseGlow {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.4); opacity: 0.5; }
      }

      .lobby-main-title {
        font-family: var(--font-display, 'Outfit', sans-serif);
        font-size: 1.65rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        color: var(--text-primary, #f1f5f9);
        margin-bottom: 0.35rem;
      }

      .gold-highlight {
        background: var(--gold-gradient, linear-gradient(135deg, #fde047, #e2b150));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .lobby-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary, #94a3b8);
        max-width: 600px;
        line-height: 1.5;
      }

      .lobby-system-time {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 0.25rem;
        background: var(--glass-bg, rgba(15, 21, 36, 0.65));
        padding: 0.6rem 1rem;
        border-radius: var(--radius-md, 12px);
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      }

      .time-clock {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.72rem;
        color: var(--text-muted, #64748b);
      }

      .time-value {
        font-family: 'Outfit', monospace;
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--gold-primary, #e2b150);
        letter-spacing: 0.05em;
      }

      /* Toolbar: Tabs & Search */
      .lobby-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .lobby-tabs {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: rgba(15, 21, 36, 0.8);
        padding: 4px;
        border-radius: var(--radius-md, 12px);
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
      }

      .lobby-tab-btn {
        padding: 0.5rem 1rem;
        border-radius: 8px;
        border: none;
        background: transparent;
        color: var(--text-secondary, #94a3b8);
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }

      .lobby-tab-btn:hover {
        color: var(--text-primary, #f1f5f9);
        background: rgba(255, 255, 255, 0.04);
      }

      .lobby-tab-btn.active {
        background: var(--gold-gradient, linear-gradient(135deg, #fde047, #e2b150));
        color: #090d16;
        font-weight: 700;
        box-shadow: 0 4px 12px rgba(226, 177, 80, 0.25);
      }

      .tab-count {
        font-size: 0.72rem;
        padding: 1px 6px;
        border-radius: 9999px;
        background: rgba(0, 0, 0, 0.15);
      }

      .lobby-tab-btn.active .tab-count {
        background: rgba(9, 13, 22, 0.25);
        color: #090d16;
      }

      .lobby-search-box {
        position: relative;
        display: flex;
        align-items: center;
        min-width: 280px;
        flex: 1;
        max-width: 360px;
      }

      .search-icon {
        position: absolute;
        left: 0.85rem;
        color: var(--text-muted, #64748b);
        pointer-events: none;
      }

      .lobby-search-input {
        width: 100%;
        padding: 0.55rem 2.2rem 0.55rem 2.4rem;
        background: var(--glass-bg, rgba(15, 21, 36, 0.65));
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
        border-radius: var(--radius-md, 12px);
        color: var(--text-primary, #f1f5f9);
        font-size: 0.85rem;
        outline: none;
        transition: all 0.25s ease;
      }

      .lobby-search-input:focus {
        border-color: var(--gold-primary, #e2b150);
        box-shadow: 0 0 0 3px rgba(226, 177, 80, 0.15);
      }

      .btn-clear-search {
        position: absolute;
        right: 0.75rem;
        background: transparent;
        border: none;
        color: var(--text-muted, #64748b);
        font-size: 1.1rem;
        cursor: pointer;
      }

      /* Grid Container */
      .batch-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
        gap: 1.5rem;
        width: 100%;
      }

      /* Batch Card */
      .batch-card {
        background: var(--glass-bg, rgba(15, 21, 36, 0.65));
        backdrop-filter: var(--glass-backdrop, blur(16px));
        border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.08));
        border-radius: var(--radius-xl, 24px);
        padding: 1.35rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 1rem;
        box-shadow: var(--shadow-md, 0 8px 24px rgba(0, 0, 0, 0.35));
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }

      .batch-card:hover {
        transform: translateY(-3px);
        border-color: rgba(226, 177, 80, 0.3);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45), 0 0 20px rgba(226, 177, 80, 0.1);
      }

      .batch-card.is-my-booking {
        border-color: var(--gold-primary, #e2b150);
        background: linear-gradient(180deg, rgba(226, 177, 80, 0.08) 0%, rgba(15, 21, 36, 0.8) 100%);
        box-shadow: var(--shadow-gold-glow, 0 0 25px rgba(226, 177, 80, 0.18));
      }

      .batch-card.is-void {
        opacity: 0.75;
        border-color: rgba(239, 68, 68, 0.3);
      }

      /* Card Header */
      .batch-card-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
      }

      .time-banner {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--gold-light, #fde047);
        font-family: 'Outfit', sans-serif;
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: 0.02em;
      }

      .header-badges {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .score-pill {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(226, 177, 80, 0.15);
        color: var(--gold-light, #fde047);
        border: 1px solid rgba(226, 177, 80, 0.3);
      }

      .batch-status-tag {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 3px 8px;
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
      }

      .batch-status-tag.recruiting {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.3);
      }

      .batch-status-tag.full {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }

      .batch-status-tag.dispatched {
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.3);
      }

      .batch-status-tag.void {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.4);
      }

      .pulse-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #34d399;
        animation: pulseGlow 1.5s infinite;
      }

      /* Card Body */
      .batch-card-body {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }

      .batch-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text-primary, #f1f5f9);
        line-height: 1.4;
      }

      .leader-info-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.8rem;
      }

      .leader-label { color: var(--text-muted, #64748b); }
      .leader-name { color: var(--text-secondary, #94a3b8); font-weight: 600; }

      .batch-tags-row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-wrap: wrap;
      }

      .batch-tag-chip {
        font-size: 0.7rem;
        padding: 2px 7px;
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-secondary, #94a3b8);
      }

      /* Notice Box */
      .batch-notice-box {
        background: rgba(9, 13, 22, 0.7);
        border: 1px dashed rgba(226, 177, 80, 0.25);
        border-radius: var(--radius-md, 12px);
        padding: 0.75rem 0.85rem;
      }

      .notice-header {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--gold-light, #fde047);
        margin-bottom: 0.35rem;
      }

      .notice-content {
        font-size: 0.78rem;
        color: var(--text-secondary, #94a3b8);
        line-height: 1.45;
      }

      /* Capacity Bar */
      .capacity-progress-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .capacity-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 0.78rem;
        color: var(--text-secondary, #94a3b8);
      }

      .progress-track {
        height: 6px;
        width: 100%;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 9999px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--gold-gradient, linear-gradient(135deg, #fde047, #e2b150));
        border-radius: 9999px;
        transition: width 0.4s ease;
      }

      .progress-fill.danger {
        background: linear-gradient(135deg, #f87171, #ef4444);
      }

      /* Roster Section */
      .roster-section {
        background: rgba(9, 13, 22, 0.5);
        border-radius: var(--radius-md, 12px);
        border: 1px solid rgba(255, 255, 255, 0.05);
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .roster-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
      }

      .roster-title {
        font-size: 0.8rem;
        font-weight: 700;
        color: var(--text-primary, #f1f5f9);
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }

      .btn-toggle-roster {
        background: transparent;
        border: none;
        color: var(--gold-primary, #e2b150);
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
      }

      .roster-avatar-preview {
        display: flex;
        align-items: center;
        gap: 0.35rem;
      }

      .roster-avatar-chip {
        position: relative;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid rgba(226, 177, 80, 0.3);
        overflow: hidden;
        background: #1e1b4b;
      }

      .roster-avatar-chip.current-user {
        border-color: #fde047;
        box-shadow: 0 0 10px rgba(253, 224, 71, 0.5);
      }

      .player-avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .my-tag {
        position: absolute;
        bottom: 0;
        right: 0;
        background: #fde047;
        color: #090d16;
        font-size: 0.55rem;
        font-weight: 900;
        padding: 0 2px;
        border-radius: 2px;
      }

      .roster-more-chip {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.08);
        color: var(--text-secondary, #94a3b8);
        font-size: 0.72rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Expanded Roster Grid */
      .roster-details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 0.5rem;
        margin-top: 0.5rem;
        padding-top: 0.5rem;
        border-top: 1px dashed rgba(255, 255, 255, 0.08);
        max-height: 220px;
        overflow-y: auto;
      }

      .player-detail-card {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.4rem;
        background: rgba(15, 21, 36, 0.8);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .player-detail-card.highlight-me {
        background: rgba(226, 177, 80, 0.12);
        border-color: rgba(226, 177, 80, 0.35);
      }

      .player-avatar-wrapper {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        overflow: hidden;
        flex-shrink: 0;
        background: #0f172a;
      }

      .player-grid-avatar {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .player-info-col {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }

      .player-nickname-row {
        display: flex;
        align-items: center;
        gap: 0.25rem;
      }

      .player-nickname {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-primary, #f1f5f9);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .badge-me {
        font-size: 0.58rem;
        padding: 1px 3px;
        border-radius: 3px;
        background: #fde047;
        color: #090d16;
        font-weight: 800;
      }

      .badge-locked {
        font-size: 0.58rem;
        color: var(--gold-light, #fde047);
      }

      .player-id-row {
        font-size: 0.65rem;
        color: var(--text-muted, #64748b);
      }

      /* Cooldown Lock Card */
      .cooldown-lock-card {
        background: rgba(226, 177, 80, 0.1);
        border: 1px solid rgba(226, 177, 80, 0.35);
        border-radius: var(--radius-md, 12px);
        padding: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .cooldown-lock-header {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--gold-light, #fde047);
        font-weight: 700;
        font-size: 0.88rem;
      }

      .cooldown-lock-sub {
        font-size: 0.75rem;
        color: var(--text-secondary, #94a3b8);
        line-height: 1.4;
      }

      /* Action Buttons */
      .btn-batch-action {
        width: 100%;
        padding: 0.75rem;
        border-radius: var(--radius-md, 12px);
        border: none;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        position: relative;
        overflow: hidden;
      }

      .btn-batch-action.book-now {
        background: var(--gold-gradient, linear-gradient(135deg, #fde047 0%, #e2b150 100%));
        color: #090d16;
        box-shadow: 0 4px 16px rgba(226, 177, 80, 0.3);
      }

      .btn-batch-action.book-now:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(226, 177, 80, 0.45);
      }

      .btn-batch-action.enter-cabin {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff;
        box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
      }

      .btn-batch-action.enter-cabin:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.5);
      }

      .btn-batch-action.login-required {
        background: rgba(255, 255, 255, 0.08);
        color: var(--text-primary, #f1f5f9);
        border: 1px solid var(--glass-border-gold, rgba(226, 177, 80, 0.4));
      }

      .btn-batch-action.login-required:hover {
        background: rgba(226, 177, 80, 0.15);
      }

      .btn-batch-action.disabled {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-muted, #64748b);
        border: 1px solid rgba(255, 255, 255, 0.05);
        cursor: not-allowed;
      }

      /* Confirm Modal Overlay */
      .confirm-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 1000;
        background: rgba(9, 13, 22, 0.85);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        animation: fadeIn 0.25s ease;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .confirm-modal-dialog {
        background: var(--bg-surface, #0f1524);
        border: 1px solid var(--glass-border-gold, rgba(226, 177, 80, 0.4));
        border-radius: var(--radius-xl, 24px);
        max-width: 480px;
        width: 100%;
        padding: 1.75rem;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(226, 177, 80, 0.15);
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .modal-accent-bar {
        position: absolute;
        top: 0;
        left: 2rem;
        right: 2rem;
        height: 3px;
        background: var(--gold-gradient, linear-gradient(135deg, #fde047, #e2b150));
        border-bottom-left-radius: 4px;
        border-bottom-right-radius: 4px;
      }

      .confirm-modal-close {
        position: absolute;
        top: 1rem;
        right: 1.25rem;
        background: transparent;
        border: none;
        color: var(--text-muted, #64748b);
        font-size: 1.5rem;
        cursor: pointer;
      }

      .confirm-modal-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 0.35rem;
      }

      .confirm-icon-box {
        font-size: 2.2rem;
        margin-bottom: 0.25rem;
      }

      .confirm-modal-title {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--text-primary, #f1f5f9);
      }

      .confirm-modal-sub {
        font-size: 0.8rem;
        color: var(--text-secondary, #94a3b8);
      }

      .summary-card {
        background: rgba(9, 13, 22, 0.6);
        border-radius: var(--radius-md, 12px);
        padding: 0.85rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        border: 1px solid rgba(255, 255, 255, 0.05);
      }

      .summary-item {
        display: flex;
        justify-content: space-between;
        font-size: 0.82rem;
      }

      .s-label { color: var(--text-secondary, #94a3b8); }
      .s-val { color: var(--text-primary, #f1f5f9); font-weight: 600; }
      .s-val.gold { color: var(--gold-light, #fde047); }

      .cooldown-warning-box {
        background: rgba(226, 177, 80, 0.08);
        border: 1px dashed rgba(226, 177, 80, 0.3);
        border-radius: var(--radius-md, 12px);
        padding: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .warning-title {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--gold-light, #fde047);
      }

      .warning-list {
        padding-left: 1.25rem;
        font-size: 0.78rem;
        color: var(--text-secondary, #94a3b8);
        line-height: 1.5;
      }

      .confirm-modal-footer {
        display: flex;
        gap: 0.75rem;
        margin-top: 0.5rem;
      }

      .btn-confirm-cancel {
        flex: 1;
        padding: 0.75rem;
        border-radius: var(--radius-md, 12px);
        background: rgba(255, 255, 255, 0.08);
        color: var(--text-primary, #f1f5f9);
        border: none;
        font-weight: 600;
        cursor: pointer;
      }

      .btn-confirm-submit {
        flex: 2;
        padding: 0.75rem;
        border-radius: var(--radius-md, 12px);
        background: var(--gold-gradient, linear-gradient(135deg, #fde047, #e2b150));
        color: #090d16;
        border: none;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(226, 177, 80, 0.3);
      }

      .btn-confirm-submit:hover {
        box-shadow: 0 6px 20px rgba(226, 177, 80, 0.45);
      }

      /* Empty State */
      .lobby-empty-state {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        background: var(--glass-bg, rgba(15, 21, 36, 0.65));
        border: 1px dashed var(--glass-border, rgba(255, 255, 255, 0.08));
        border-radius: var(--radius-xl, 24px);
        text-align: center;
      }

      .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
      .empty-title { font-size: 1.15rem; font-weight: 700; color: var(--text-primary, #f1f5f9); }
      .empty-sub { font-size: 0.85rem; color: var(--text-secondary, #94a3b8); margin-top: 0.35rem; }

      /* Responsive Adjustments */
      @media (max-width: 768px) {
        .batch-cards-grid {
          grid-template-columns: 1fr;
        }

        .lobby-header-bar {
          flex-direction: column;
          align-items: flex-start;
        }

        .lobby-system-time {
          align-self: flex-start;
        }

        .lobby-toolbar {
          flex-direction: column;
          align-items: stretch;
        }

        .lobby-search-box {
          max-width: 100%;
        }

        .lobby-tabs {
          overflow-x: auto;
          white-space: nowrap;
        }
      }
    `;

    document.head.appendChild(style);
  }
}

/**
 * 挂载 BatchLobby 的辅助函数
 * @param {HTMLElement|string} container 
 * @param {Object} [options] 
 * @returns {BatchLobby}
 */
export function renderBatchLobby(container, options = {}) {
  const lobby = new BatchLobby(container, options);
  lobby.mount();
  return lobby;
}

export default BatchLobby;

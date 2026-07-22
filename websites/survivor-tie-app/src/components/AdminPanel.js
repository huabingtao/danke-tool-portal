/**
 * 弹壳特工队 - 并列发车平台 AdminPanel 创作者/管理员控制台组件
 * Survivor Tie & Dispatch Platform - Creator & Admin Management Console Component
 */

import store from '../state/store.js';

export class AdminPanel {
  /**
   * @param {HTMLElement|string} container - 挂载的目标容器
   */
  constructor(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.unsubscribe = null;
    this.editingBatchId = null;
    this.filterStatus = 'all'; // 'all' | 'recruiting' | 'void'
    this.feedbackMsg = null;
    this.feedbackType = 'success'; // 'success' | 'error'
  }

  /**
   * 初始化并挂载 AdminPanel 组件
   */
  mount() {
    if (!this.container) {
      console.warn('[AdminPanel] Container not found');
      return;
    }

    // 确保组件特定样式已注入 DOM
    this._injectStyles();

    // 首次渲染
    this.render();

    // 订阅 Store 状态更新，实现数据双向同步
    this.unsubscribe = store.subscribe(() => {
      this.render();
    });
  }

  /**
   * 卸载组件并解绑订阅
   */
  unmount() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * 获取今天日期 (YYYY-MM-DD)
   */
  _getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 获取明天日期 (YYYY-MM-DD)
   */
  _getTomorrowDateString() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 显示操作提示信息
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
    }, 3500);
  }

  /**
   * 发布新班次处理
   */
  handlePublishSubmit(e) {
    if (e) e.preventDefault();

    const form = this.container.querySelector('#admin-publish-form');
    if (!form) return;

    const date = form.querySelector('#input-launch-date').value.trim();
    const time = form.querySelector('#input-launch-time').value.trim();
    const targetScore = parseInt(form.querySelector('#input-target-score').value.trim(), 10) || 106;
    const capacity = parseInt(form.querySelector('#input-capacity').value.trim(), 10) || 200;
    const avatarRequirement = form.querySelector('#input-avatar-req').value.trim();
    const qrCode = form.querySelector('#input-qrcode-url').value.trim();
    const notice = form.querySelector('#input-notice').value.trim();
    const titleInput = form.querySelector('#input-batch-title').value.trim();
    const leaderInput = form.querySelector('#input-leader-name').value.trim();

    if (!date) {
      this.showFeedback('请选择或输入发车日期！', 'error');
      return;
    }

    if (!time) {
      this.showFeedback('请输入精确发车时间（如 01:05:00）！', 'error');
      return;
    }

    // 默认生成精美标题
    const title = titleInput || `${time.slice(0, 5)} 控分定速精准并列班车 (${date})`;
    const leader = leaderInput || '战术总指挥·暗影';
    const batchId = `batch-${Date.now().toString(36)}`;

    const newBatch = {
      id: batchId,
      date,
      time,
      title,
      targetScore,
      targetScoreText: `${targetScore}分`,
      capacity,
      bookedCount: 0,
      qrCode: qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent('https://survivor-tie.app/join/' + batchId)}`,
      avatarRequirement: avatarRequirement || '【统一头像规范】请统一更换游戏头像为『暗影特工·极速装甲』',
      notice: notice || '【战术要领】准点切入副本，严禁提前爆分，比赛第 12 分钟统一提分至 106 分！',
      status: 'recruiting', // 'recruiting' (进行中) | 'void' (作废)
      tags: [`${targetScore}分控分`, '统一特工头像', '精准并发'],
      leader,
      createdAt: Date.now()
    };

    const currentState = store.getState();
    const updatedBatches = [newBatch, ...(currentState.batches || [])];

    store.setState({ batches: updatedBatches });

    this.showFeedback(`✅ 成功发布发车班次：${title}`, 'success');

    // 清空部分单次输入框，保留默认推荐参数
    if (form.querySelector('#input-batch-title')) {
      form.querySelector('#input-batch-title').value = '';
    }
  }

  /**
   * 切换班次状态 (进行中 <-> 作废)
   */
  toggleBatchStatus(batchId) {
    const currentState = store.getState();
    const updatedBatches = (currentState.batches || []).map(b => {
      if (b.id === batchId) {
        const nextStatus = b.status === 'void' ? 'recruiting' : 'void';
        return { ...b, status: nextStatus };
      }
      return b;
    });

    store.setState({ batches: updatedBatches });
    const targetBatch = updatedBatches.find(b => b.id === batchId);
    const statusText = targetBatch.status === 'void' ? '已标记作废' : '已重新开启招募';
    this.showFeedback(`班次 [${targetBatch.title}] ${statusText}`, 'success');
  }

  /**
   * 模拟一键满员 (快捷测试)
   */
  fillBatchSlots(batchId) {
    const currentState = store.getState();
    const updatedBatches = (currentState.batches || []).map(b => {
      if (b.id === batchId) {
        return { ...b, bookedCount: b.capacity };
      }
      return b;
    });

    store.setState({ batches: updatedBatches });
    this.showFeedback(`⚡ 已将班次满员数模拟设为上限值`, 'success');
  }

  /**
   * 删除班次
   */
  deleteBatch(batchId) {
    const currentState = store.getState();
    const targetBatch = (currentState.batches || []).find(b => b.id === batchId);
    
    if (window.confirm(`确定要彻底删除班次『${targetBatch ? targetBatch.title : batchId}』吗？`)) {
      const updatedBatches = (currentState.batches || []).filter(b => b.id !== batchId);
      store.setState({ batches: updatedBatches });
      this.showFeedback(`🗑️ 已删除班次`, 'success');
    }
  }

  /**
   * 保存班次编辑 (更新公告与头像要求)
   */
  saveBatchEdit(batchId) {
    const noticeInput = this.container.querySelector(`#edit-notice-${batchId}`);
    const avatarInput = this.container.querySelector(`#edit-avatar-${batchId}`);
    
    if (!noticeInput || !avatarInput) return;

    const newNotice = noticeInput.value.trim();
    const newAvatar = avatarInput.value.trim();

    const currentState = store.getState();
    const updatedBatches = (currentState.batches || []).map(b => {
      if (b.id === batchId) {
        return {
          ...b,
          notice: newNotice || b.notice,
          avatarRequirement: newAvatar || b.avatarRequirement
        };
      }
      return b;
    });

    store.setState({ batches: updatedBatches });
    this.editingBatchId = null;
    this.showFeedback(`✏️ 班次战术公告与头像要求已成功更新！`, 'success');
  }

  /**
   * 动态注入 AdminPanel 专用样式
   */
  _injectStyles() {
    if (document.getElementById('admin-panel-styles')) return;

    const style = document.createElement('style');
    style.id = 'admin-panel-styles';
    style.textContent = `
      .admin-panel-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        width: 100%;
        margin-top: 1rem;
      }

      .admin-header-card {
        background: var(--glass-bg);
        backdrop-filter: var(--glass-backdrop);
        -webkit-backdrop-filter: var(--glass-backdrop);
        border: 1px solid var(--glass-border-gold);
        border-radius: var(--radius-xl);
        padding: 1.5rem 1.75rem;
        box-shadow: var(--shadow-md);
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1.25rem;
      }

      .admin-title-group {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .admin-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.8rem;
        border-radius: var(--radius-full);
        background: var(--gold-gradient-subtle);
        border: 1px solid var(--glass-border-gold);
        color: var(--gold-light);
        font-size: 0.775rem;
        font-weight: 700;
        width: fit-content;
      }

      .admin-main-title {
        font-family: var(--font-display);
        font-size: 1.6rem;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.01em;
        margin: 0;
      }

      .admin-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .admin-metrics-bar {
        display: flex;
        align-items: center;
        gap: 1rem;
        background: rgba(9, 13, 22, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-lg);
        padding: 0.75rem 1.25rem;
      }

      .admin-metric-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0 0.75rem;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
      }

      .admin-metric-item:last-child {
        border-right: none;
      }

      .admin-metric-val {
        font-family: var(--font-display);
        font-size: 1.2rem;
        font-weight: 800;
        color: var(--gold-primary);
      }

      .admin-metric-lbl {
        font-size: 0.725rem;
        color: var(--text-muted);
        margin-top: 0.15rem;
      }

      /* Main Workspace 2-Column Grid */
      .admin-grid {
        display: grid;
        grid-template-columns: 1fr 1.2fr;
        gap: 1.75rem;
        align-items: start;
      }

      @media (max-width: 1024px) {
        .admin-grid {
          grid-template-columns: 1fr;
        }
      }

      .admin-form-panel {
        background: var(--glass-bg);
        backdrop-filter: var(--glass-backdrop);
        -webkit-backdrop-filter: var(--glass-backdrop);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-xl);
        padding: 1.5rem;
        box-shadow: var(--shadow-md);
      }

      .panel-head {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 1.25rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      }

      .panel-head-title {
        font-family: var(--font-display);
        font-size: 1.15rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }

      .admin-form {
        display: flex;
        flex-direction: column;
        gap: 1.1rem;
      }

      .form-row-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      @media (max-width: 640px) {
        .form-row-2 {
          grid-template-columns: 1fr;
        }
      }

      .form-hint-badge {
        font-size: 0.725rem;
        padding: 0.15rem 0.5rem;
        border-radius: var(--radius-sm);
        background: rgba(226, 177, 80, 0.15);
        color: var(--gold-light);
        margin-left: auto;
        font-weight: 600;
      }

      .preset-chip-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
        margin-top: 0.35rem;
      }

      .preset-time-chip {
        padding: 0.2rem 0.55rem;
        font-size: 0.725rem;
        border-radius: var(--radius-sm);
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-secondary);
        cursor: pointer;
        transition: var(--transition-fast);
      }

      .preset-time-chip:hover {
        background: rgba(226, 177, 80, 0.2);
        color: var(--gold-light);
        border-color: rgba(226, 177, 80, 0.4);
      }

      .textarea-control {
        min-height: 72px;
        resize: vertical;
        padding: 0.75rem 1rem;
      }

      .btn-publish-submit {
        margin-top: 0.5rem;
        width: 100%;
        padding: 0.85rem 1.5rem;
        font-size: 0.95rem;
        font-weight: 700;
        justify-content: center;
        background: var(--gold-gradient);
        color: var(--text-inverse);
        box-shadow: 0 4px 18px rgba(226, 177, 80, 0.35);
      }

      .btn-publish-submit:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 24px rgba(226, 177, 80, 0.5);
      }

      /* Published Batches List Panel */
      .admin-list-panel {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .list-filter-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-lg);
        padding: 0.65rem 1rem;
      }

      .filter-tab-group {
        display: flex;
        gap: 0.4rem;
      }

      .filter-tab {
        padding: 0.35rem 0.85rem;
        border-radius: var(--radius-md);
        font-size: 0.8rem;
        font-weight: 600;
        background: transparent;
        border: 1px solid transparent;
        color: var(--text-secondary);
        cursor: pointer;
        transition: var(--transition-fast);
      }

      .filter-tab.active {
        background: rgba(226, 177, 80, 0.18);
        border-color: rgba(226, 177, 80, 0.4);
        color: var(--gold-light);
      }

      .batches-stack {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .admin-batch-card {
        background: var(--glass-bg);
        backdrop-filter: var(--glass-backdrop);
        -webkit-backdrop-filter: var(--glass-backdrop);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-xl);
        padding: 1.25rem 1.4rem;
        box-shadow: var(--shadow-sm);
        transition: var(--transition-normal);
        position: relative;
        overflow: hidden;
      }

      .admin-batch-card:hover {
        border-color: var(--glass-border-gold);
        box-shadow: var(--shadow-md);
      }

      .admin-batch-card.status-void {
        opacity: 0.68;
        filter: grayscale(0.2);
        border-color: rgba(239, 68, 68, 0.3);
      }

      .card-top-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .batch-time-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.65rem;
        border-radius: var(--radius-sm);
        background: rgba(226, 177, 80, 0.15);
        border: 1px solid rgba(226, 177, 80, 0.3);
        color: var(--gold-light);
        font-weight: 700;
        font-size: 0.85rem;
        font-family: var(--font-display);
      }

      .batch-status-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.25rem 0.7rem;
        border-radius: var(--radius-full);
        font-size: 0.75rem;
        font-weight: 700;
      }

      .batch-status-pill.recruiting {
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.35);
        color: #34d399;
      }

      .batch-status-pill.void {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.35);
        color: #f87171;
      }

      .batch-card-title {
        font-family: var(--font-display);
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 0.75rem 0;
      }

      .batch-stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
        background: rgba(9, 13, 22, 0.5);
        border-radius: var(--radius-md);
        padding: 0.75rem;
        margin-bottom: 0.85rem;
      }

      .stat-cell {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      .stat-cell-lbl {
        font-size: 0.7rem;
        color: var(--text-muted);
      }

      .stat-cell-val {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-cell-val.gold {
        color: var(--gold-primary);
      }

      /* Progress Bar */
      .signup-progress-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin-bottom: 0.85rem;
      }

      .signup-progress-header {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .signup-progress-bar {
        width: 100%;
        height: 6px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-full);
        overflow: hidden;
      }

      .signup-progress-fill {
        height: 100%;
        background: var(--gold-gradient);
        border-radius: var(--radius-full);
        transition: width 0.4s ease;
      }

      .batch-avatar-req-box {
        font-size: 0.775rem;
        color: var(--text-secondary);
        background: rgba(255, 255, 255, 0.03);
        border-left: 3px solid var(--gold-primary);
        padding: 0.5rem 0.75rem;
        border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
        margin-bottom: 1rem;
        line-height: 1.45;
      }

      /* Action controls button bar */
      .card-actions-bar {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }

      .btn-admin-act {
        padding: 0.4rem 0.75rem;
        border-radius: var(--radius-md);
        font-size: 0.775rem;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        cursor: pointer;
        transition: var(--transition-fast);
        border: 1px solid transparent;
      }

      .btn-admin-act.void-act {
        background: rgba(239, 68, 68, 0.12);
        border-color: rgba(239, 68, 68, 0.3);
        color: #f87171;
      }

      .btn-admin-act.void-act:hover {
        background: rgba(239, 68, 68, 0.25);
      }

      .btn-admin-act.resume-act {
        background: rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.3);
        color: #34d399;
      }

      .btn-admin-act.resume-act:hover {
        background: rgba(16, 185, 129, 0.25);
      }

      .btn-admin-act.fill-act {
        background: rgba(226, 177, 80, 0.12);
        border-color: rgba(226, 177, 80, 0.3);
        color: var(--gold-light);
      }

      .btn-admin-act.fill-act:hover {
        background: rgba(226, 177, 80, 0.25);
      }

      .btn-admin-act.edit-act {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.12);
        color: var(--text-secondary);
      }

      .btn-admin-act.edit-act:hover {
        background: rgba(255, 255, 255, 0.12);
        color: var(--text-primary);
      }

      .btn-admin-act.delete-act {
        background: rgba(255, 255, 255, 0.04);
        border-color: rgba(255, 255, 255, 0.08);
        color: var(--text-muted);
        margin-left: auto;
      }

      .btn-admin-act.delete-act:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.4);
        color: #f87171;
      }

      /* Inline edit area */
      .inline-edit-box {
        margin-top: 0.85rem;
        padding: 0.85rem;
        border-radius: var(--radius-md);
        background: rgba(9, 13, 22, 0.8);
        border: 1px solid var(--gold-muted);
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
      }

      .feedback-banner {
        padding: 0.75rem 1rem;
        border-radius: var(--radius-md);
        font-size: 0.85rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: space-between;
        animation: fadeIn 0.3s ease;
      }

      .feedback-banner.success {
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.35);
        color: #34d399;
      }

      .feedback-banner.error {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.35);
        color: #f87171;
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 生成 HTML 模板
   */
  getTemplate() {
    const state = store.getState();
    const batches = state.batches || [];

    // 计算统计指标
    const totalCount = batches.length;
    const recruitingCount = batches.filter(b => b.status !== 'void').length;
    const voidCount = batches.filter(b => b.status === 'void').length;
    const totalBooked = batches.reduce((acc, b) => acc + (b.bookedCount || 0), 0);

    // 根据 Tab 筛选班次
    let filteredBatches = batches;
    if (this.filterStatus === 'recruiting') {
      filteredBatches = batches.filter(b => b.status !== 'void');
    } else if (this.filterStatus === 'void') {
      filteredBatches = batches.filter(b => b.status === 'void');
    }

    const todayDate = this._getTodayDateString();
    const tomorrowDate = this._getTomorrowDateString();

    // 反馈提示条
    const feedbackHtml = this.feedbackMsg ? `
      <div class="feedback-banner ${this.feedbackType}">
        <span>${this.feedbackMsg}</span>
        <button type="button" style="background:none;border:none;color:inherit;cursor:pointer;" onclick="this.parentElement.remove()">✕</button>
      </div>
    ` : '';

    // 生成列表卡片 HTML
    const cardsHtml = filteredBatches.length > 0 ? filteredBatches.map(b => {
      const isVoid = b.status === 'void';
      const pct = Math.min(100, Math.round(((b.bookedCount || 0) / (b.capacity || 200)) * 100));
      const isEditing = this.editingBatchId === b.id;

      return `
        <article class="admin-batch-card ${isVoid ? 'status-void' : ''}" data-id="${b.id}">
          <div class="card-top-row">
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span class="batch-time-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                ${b.time || '01:05:00'}
              </span>
              <span style="font-size:0.75rem;color:var(--text-muted);">${b.date || '今日'}</span>
            </div>
            
            <span class="batch-status-pill ${isVoid ? 'void' : 'recruiting'}">
              <span class="status-dot"></span>
              ${isVoid ? '已作废' : '进行中招募'}
            </span>
          </div>

          <h4 class="batch-card-title">${b.title || '并列控分班车'}</h4>

          <div class="batch-stats-grid">
            <div class="stat-cell">
              <span class="stat-cell-lbl">目标积分 (控分档)</span>
              <span class="stat-cell-val gold">${b.targetScore || 106} 分</span>
            </div>
            <div class="stat-cell">
              <span class="stat-cell-lbl">当前报名人数</span>
              <span class="stat-cell-val">${b.bookedCount || 0} / ${b.capacity || 200} 人</span>
            </div>
            <div class="stat-cell">
              <span class="stat-cell-lbl">发布指挥官</span>
              <span class="stat-cell-val">${b.leader || '战术指挥'}</span>
            </div>
          </div>

          <div class="signup-progress-wrapper">
            <div class="signup-progress-header">
              <span>招募完成度</span>
              <span>${pct}%</span>
            </div>
            <div class="signup-progress-bar">
              <div class="signup-progress-fill" style="width: ${pct}%;"></div>
            </div>
          </div>

          <div class="batch-avatar-req-box">
            <strong>头像要求：</strong>${b.avatarRequirement || '统一极速装甲头像'}<br/>
            <strong>战术公告：</strong>${b.notice || '踩点切入，锁分106分！'}
          </div>

          ${isEditing ? `
            <div class="inline-edit-box">
              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem;">修改游戏统一头像要求</label>
                <input type="text" id="edit-avatar-${b.id}" class="form-control" style="padding:0.4rem 0.6rem;font-size:0.8rem;" value="${b.avatarRequirement || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem;">修改微信群公告/出刀指示</label>
                <textarea id="edit-notice-${b.id}" class="form-control textarea-control" style="padding:0.4rem 0.6rem;font-size:0.8rem;">${b.notice || ''}</textarea>
              </div>
              <div style="display:flex;gap:0.5rem;justify-content:flex-end;">
                <button type="button" class="btn-admin-act edit-act btn-cancel-edit" data-id="${b.id}">取消</button>
                <button type="button" class="btn-admin-act fill-act btn-save-edit" data-id="${b.id}">💾 保存更新</button>
              </div>
            </div>
          ` : ''}

          <div class="card-actions-bar">
            ${isVoid ? `
              <button type="button" class="btn-admin-act resume-act btn-toggle-status" data-id="${b.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                恢复招募
              </button>
            ` : `
              <button type="button" class="btn-admin-act void-act btn-toggle-status" data-id="${b.id}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                作废班次
              </button>
            `}

            <button type="button" class="btn-admin-act fill-act btn-fill-slots" data-id="${b.id}" title="快捷设为200人满员">
              ⚡ 模拟满员
            </button>

            <button type="button" class="btn-admin-act edit-act btn-toggle-edit" data-id="${b.id}">
              ✏️ 编辑公告
            </button>

            <button type="button" class="btn-admin-act delete-act btn-delete-batch" data-id="${b.id}">
              🗑️
            </button>
          </div>
        </article>
      `;
    }).join('') : `
      <div style="padding: 2.5rem; text-align: center; background: var(--glass-bg); border-radius: var(--radius-xl); border: 1px dashed var(--glass-border);">
        <p style="color: var(--text-muted); margin: 0;">暂无匹配的班次记录。请在左侧表单发布新班次！</p>
      </div>
    `;

    return `
      <div class="admin-panel-container">
        <!-- Top Console Header -->
        <div class="admin-header-card">
          <div class="admin-title-group">
            <div class="admin-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              <span>创作者 & 管理员控制台</span>
            </div>
            <h2 class="admin-main-title">发车班次发布与控分战术指挥中心</h2>
            <p class="admin-subtitle">管理、发布精准并列发车班次，定制 106 分最高史诗配件档位与统一头像战术指令</p>
          </div>

          <div class="admin-metrics-bar">
            <div class="admin-metric-item">
              <span class="admin-metric-val">${totalCount}</span>
              <span class="admin-metric-lbl">总发车班次</span>
            </div>
            <div class="admin-metric-item">
              <span class="admin-metric-val">${recruitingCount}</span>
              <span class="admin-metric-lbl">进行中招募</span>
            </div>
            <div class="admin-metric-item">
              <span class="admin-metric-val">${totalBooked}</span>
              <span class="admin-metric-lbl">已预约总人次</span>
            </div>
            <div class="admin-metric-item">
              <span class="admin-metric-val" style="color:var(--text-muted);">${voidCount}</span>
              <span class="admin-metric-lbl">已作废班次</span>
            </div>
          </div>
        </div>

        ${feedbackHtml}

        <!-- Workspace 2-Column Grid -->
        <div class="admin-grid">
          <!-- Left: Publish Form -->
          <div class="admin-form-panel">
            <div class="panel-head">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--gold-primary);"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              <h3 class="panel-head-title">发布新发车班次</h3>
            </div>

            <form id="admin-publish-form" class="admin-form">
              <!-- Row 1: Date & Time -->
              <div class="form-row-2">
                <div class="form-group">
                  <label for="input-launch-date" class="form-label">
                    <span>发车日期</span>
                    <span class="required-star">*</span>
                  </label>
                  <input type="date" id="input-launch-date" class="form-control" style="padding-left:1rem;" value="${todayDate}" required />
                  <div class="preset-chip-bar">
                    <button type="button" class="preset-time-chip btn-set-date" data-date="${todayDate}">今天 (${todayDate.slice(5)})</button>
                    <button type="button" class="preset-time-chip btn-set-date" data-date="${tomorrowDate}">次日 (${tomorrowDate.slice(5)})</button>
                  </div>
                </div>

                <div class="form-group">
                  <label for="input-launch-time" class="form-label">
                    <span>精确发车时间</span>
                    <span class="required-star">*</span>
                  </label>
                  <input type="text" id="input-launch-time" class="form-control" style="padding-left:1rem;" value="01:05:00" placeholder="如 01:05:00" required />
                  <div class="preset-chip-bar">
                    <button type="button" class="preset-time-chip btn-set-time" data-time="01:05:00">01:05:00</button>
                    <button type="button" class="preset-time-chip btn-set-time" data-time="08:05:00">08:05:00</button>
                    <button type="button" class="preset-time-chip btn-set-time" data-time="12:05:00">12:05:00</button>
                    <button type="button" class="preset-time-chip btn-set-time" data-time="20:05:00">20:05:00</button>
                  </div>
                </div>
              </div>

              <!-- Row 2: Target Score & Capacity -->
              <div class="form-row-2">
                <div class="form-group">
                  <label for="input-target-score" class="form-label">
                    <span>目标积分</span>
                    <span class="form-hint-badge">最高史诗配件档</span>
                  </label>
                  <input type="number" id="input-target-score" class="form-control" style="padding-left:1rem;" value="106" min="1" max="999" required />
                </div>

                <div class="form-group">
                  <label for="input-capacity" class="form-label">
                    <span>招募上限人数</span>
                    <span class="required-star">*</span>
                  </label>
                  <input type="number" id="input-capacity" class="form-control" style="padding-left:1rem;" value="200" min="1" max="1000" required />
                </div>
              </div>

              <!-- Row 3: Title & Leader -->
              <div class="form-row-2">
                <div class="form-group">
                  <label for="input-batch-title" class="form-label">班次标题描述 (选填)</label>
                  <input type="text" id="input-batch-title" class="form-control" style="padding-left:1rem;" placeholder="如：深夜静默精准并列班车" />
                </div>

                <div class="form-group">
                  <label for="input-leader-name" class="form-label">战术指挥官名称</label>
                  <input type="text" id="input-leader-name" class="form-control" style="padding-left:1rem;" value="战术总指挥·暗影" />
                </div>
              </div>

              <!-- Avatar Instruction -->
              <div class="form-group">
                <label for="input-avatar-req" class="form-label">
                  <span>统一游戏头像要求指示说明</span>
                  <span class="required-star">*</span>
                </label>
                <textarea id="input-avatar-req" class="form-control textarea-control" required>【统一头像规范】为确保同组识别人数及防止路人混入，请所有车友统一更换游戏头像为『暗影特工·极速装甲』。发车前 5 分钟在组队房间集结！</textarea>
              </div>

              <!-- QR Code & Notice -->
              <div class="form-group">
                <label for="input-qrcode-url" class="form-label">微信群二维码图片地址</label>
                <input type="url" id="input-qrcode-url" class="form-control" style="padding-left:1rem;" value="https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=https%3A%2F%2Fsurvivor-tie.app%2Fjoin%2Fbatch-new" />
              </div>

              <div class="form-group">
                <label for="input-notice" class="form-label">微信群公告 / 出刀锁定策略</label>
                <textarea id="input-notice" class="form-control textarea-control" required>【战术指导】踩点 01:05:00 准时切入副本，严禁提前爆分。比赛第 12 分钟统一提分至 106 分后锁定输出，保障 200 人同分并列登顶！</textarea>
              </div>

              <button type="submit" class="btn btn-primary btn-publish-submit">
                🚀 确认发布新班次
              </button>
            </form>
          </div>

          <!-- Right: Published Batches Cards List -->
          <div class="admin-list-panel">
            <div class="list-filter-bar">
              <span style="font-size:0.9rem;font-weight:700;color:var(--text-primary);">已发布班次列表</span>
              <div class="filter-tab-group">
                <button type="button" class="filter-tab ${this.filterStatus === 'all' ? 'active' : ''}" data-filter="all">全部 (${totalCount})</button>
                <button type="button" class="filter-tab ${this.filterStatus === 'recruiting' ? 'active' : ''}" data-filter="recruiting">进行中 (${recruitingCount})</button>
                <button type="button" class="filter-tab ${this.filterStatus === 'void' ? 'active' : ''}" data-filter="void">已作废 (${voidCount})</button>
              </div>
            </div>

            <div class="batches-stack">
              ${cardsHtml}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 渲染到 DOM
   */
  render() {
    if (!this.container) return;
    this.container.innerHTML = this.getTemplate();
    this.bindEvents();
  }

  /**
   * 绑定 DOM 事件处理
   */
  bindEvents() {
    if (!this.container) return;

    // 发布表单提交
    const form = this.container.querySelector('#admin-publish-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handlePublishSubmit(e));
    }

    // 快捷日期切换
    const dateChips = this.container.querySelectorAll('.btn-set-date');
    dateChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const d = chip.getAttribute('data-date');
        const input = this.container.querySelector('#input-launch-date');
        if (input) input.value = d;
      });
    });

    // 快捷时间切换
    const timeChips = this.container.querySelectorAll('.btn-set-time');
    timeChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const t = chip.getAttribute('data-time');
        const input = this.container.querySelector('#input-launch-time');
        if (input) input.value = t;
      });
    });

    // 列表 Tab 切换
    const filterTabs = this.container.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterStatus = tab.getAttribute('data-filter') || 'all';
        this.render();
      });
    });

    // 作废/恢复按钮
    const toggleBtns = this.container.querySelectorAll('.btn-toggle-status');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) this.toggleBatchStatus(id);
      });
    });

    // 模拟一键满员按钮
    const fillBtns = this.container.querySelectorAll('.btn-fill-slots');
    fillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) this.fillBatchSlots(id);
      });
    });

    // 编辑公告按钮
    const editBtns = this.container.querySelectorAll('.btn-toggle-edit');
    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        this.editingBatchId = this.editingBatchId === id ? null : id;
        this.render();
      });
    });

    // 保存编辑按钮
    const saveBtns = this.container.querySelectorAll('.btn-save-edit');
    saveBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) this.saveBatchEdit(id);
      });
    });

    // 取消编辑按钮
    const cancelEditBtns = this.container.querySelectorAll('.btn-cancel-edit');
    cancelEditBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.editingBatchId = null;
        this.render();
      });
    });

    // 删除班次按钮
    const deleteBtns = this.container.querySelectorAll('.btn-delete-batch');
    deleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (id) this.deleteBatch(id);
      });
    });
  }
}

/**
 * 挂载 AdminPanel 的辅助函数
 * @param {HTMLElement|string} container 
 * @returns {AdminPanel}
 */
export function renderAdminPanel(container) {
  const panel = new AdminPanel(container);
  panel.mount();
  return panel;
}

export default AdminPanel;

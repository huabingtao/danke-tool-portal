/**
 * 弹壳特工队 - 并列发车平台 Header 组件
 * Survivor Tie & Dispatch Platform - Header Component
 */

import store from '../state/store.js';

export class Header {
  /**
   * @param {HTMLElement|string} container - Header 组件挂载的目标容器
   */
  constructor(container) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.mode = 'player'; // 'player' | 'creator'
    this.unsubscribe = null;
  }

  /**
   * 初始化并挂载 Header 组件
   */
  mount() {
    if (!this.container) {
      console.warn('[Header] Container not found for Header component');
      return;
    }

    // 尝试获取 store 中的 mode 状态，没有则初始化为 player
    const state = store.getState();
    if (state.mode) {
      this.mode = state.mode;
    }

    // 首次渲染
    this.render();

    // 订阅 store 状态变化，当 user 或 mode 变化时自动刷新
    this.unsubscribe = store.subscribe((state, prevState) => {
      if (state.user !== prevState.user || state.mode !== prevState.mode) {
        if (state.mode) {
          this.mode = state.mode;
        }
        this.render();
      }
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
   * 切换创作者 / 玩家模式
   */
  toggleMode() {
    const nextMode = this.mode === 'player' ? 'creator' : 'player';
    this.mode = nextMode;
    store.setState({ mode: nextMode });
  }

  /**
   * 触发打开微信授权 Modal 弹窗
   */
  openAuthModal() {
    window.dispatchEvent(new CustomEvent('openAuthModal'));
  }

  /**
   * 退出登录
   */
  logout() {
    store.setState({ user: null });
  }

  /**
   * 生成 HTML 模板
   * @returns {string}
   */
  getTemplate() {
    const state = store.getState();
    const user = state.user;
    const currentMode = state.mode || this.mode;

    const isCreator = currentMode === 'creator';
    const modeLabel = isCreator ? '🎨 创作者模式' : '🎮 玩家模式';
    const modeToggleText = isCreator ? '切换为玩家' : '切换为创作者';

    let userSectionHtml = '';

    if (user) {
      // 已登录状态：展示带有渐变光圈的微信头像、游戏昵称、游戏 ID 及模式切换按钮
      const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.gameId || 'Agent'}`;
      const nickname = user.gameNickname || user.nickname || '特工指挥官';
      const gameId = user.gameId || '9582014';

      userSectionHtml = `
        <div class="user-profile-card">
          <div class="avatar-aura-wrapper" title="微信认证玩家">
            <img src="${avatarUrl}" alt="${nickname}" class="user-avatar-img" />
          </div>
          <div class="user-meta">
            <div class="user-name-row">
              <span class="user-nickname" title="${nickname}">${nickname}</span>
              <span class="vip-badge">VIP</span>
            </div>
            <span class="user-game-id">ID: ${gameId}</span>
          </div>
          
          <button class="btn-mode-toggle ${isCreator ? 'creator' : 'player'}" id="btn-header-mode-toggle" title="点击${modeToggleText}">
            <span class="mode-icon">${isCreator ? '🎨' : '🎮'}</span>
            <span class="mode-text">${modeLabel}</span>
          </button>

          <button class="btn-logout" id="btn-header-logout" title="退出登录">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      `;
    } else {
      // 未登录状态：展示极具艺术设计感的“微信一键登录”按钮
      userSectionHtml = `
        <button class="btn-wechat-login" id="btn-header-wechat-login">
          <svg class="wechat-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.5 2C4.36 2 1 4.91 1 8.5c0 1.98 1.01 3.75 2.59 4.96L3 16.5l3.41-1.36c.67.19 1.37.3 2.09.3.26 0 .52-.02.77-.04C8.75 14.65 8.5 13.85 8.5 13c0-3.87 3.8-7 8.5-7 .34 0 .67.02 1 .06C16.63 3.77 12.92 2 8.5 2zm-2 4.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm6.5 2.5c-3.87 0-7 2.46-7 5.5s3.13 5.5 7 5.5c.61 0 1.2-.08 1.76-.23L21 21l-1.07-2.4c1.28-.97 2.07-2.35 2.07-3.85 0-3.04-3.13-5.5-7-5.5zm-2.5 3.5c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75zm5 0c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75z"/>
          </svg>
          <span class="btn-text">微信一键登录</span>
          <span class="btn-glow"></span>
        </button>
      `;
    }

    return `
      <header class="site-header">
        <div class="brand-wrapper">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <div class="brand-info">
            <h1>弹壳特工队 <span class="brand-subname">并列发车平台</span> <span class="brand-badge">PRO v2.4</span></h1>
            <p class="brand-subtitle">Survivor Tie & Dispatch Platform</p>
          </div>
        </div>

        <nav class="main-nav">
          <a href="#hall" class="nav-link active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            发车大厅
          </a>
          <a href="#guild" class="nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            公会并列
          </a>
          <a href="#tactics" class="nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>
            攻防战术
          </a>
          <a href="#records" class="nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            发车记录
          </a>
        </nav>

        <div class="header-actions">
          <button class="btn btn-primary" id="btn-create-room">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            快速发车
          </button>
          ${userSectionHtml}
        </div>
      </header>
    `;
  }

  /**
   * 渲染到 DOM 并绑定事件监听
   */
  render() {
    if (!this.container) return;

    if (this.container.tagName === 'HEADER' && this.container.classList.contains('site-header')) {
      const parent = this.container.parentElement;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = this.getTemplate();
      const newHeader = tempDiv.firstElementChild;
      parent.replaceChild(newHeader, this.container);
      this.container = newHeader;
    } else {
      this.container.innerHTML = this.getTemplate();
    }

    this.bindEvents();
  }

  /**
   * 绑定事件处理
   */
  bindEvents() {
    const loginBtn = this.container.querySelector('#btn-header-wechat-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.openAuthModal());
    }

    const modeToggleBtn = this.container.querySelector('#btn-header-mode-toggle');
    if (modeToggleBtn) {
      modeToggleBtn.addEventListener('click', () => this.toggleMode());
    }

    const logoutBtn = this.container.querySelector('#btn-header-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  }
}

/**
 * 挂载 Header 的辅助函数
 * @param {HTMLElement|string} container 
 * @returns {Header}
 */
export function renderHeader(container) {
  const header = new Header(container);
  header.mount();
  return header;
}

export default Header;

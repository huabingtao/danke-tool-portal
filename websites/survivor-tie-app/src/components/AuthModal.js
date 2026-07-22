/**
 * 弹壳特工队 - 并列发车平台 AuthModal 微信登录与账号绑定 Modal 弹窗组件
 * Survivor Tie & Dispatch Platform - Auth Modal Component
 */

import store from '../state/store.js';
import wechatAuth from '../utils/wechatAuth.js';

export class AuthModal {
  /**
   * @param {HTMLElement|string} container - 挂载的目标容器，默认挂载在 document.body
   */
  constructor(container = document.body) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.modalElement = null;
    this.isOpen = false;

    this._handleKeyDown = this._handleKeyDown.bind(this);
    this._handleOpenEvent = this._handleOpenEvent.bind(this);
  }

  /**
   * 初始化并挂载 Modal 到 DOM
   */
  mount() {
    let existingRoot = document.getElementById('auth-modal-root');
    if (existingRoot) {
      this.modalElement = existingRoot.querySelector('.auth-modal-backdrop');
    } else {
      const wrapper = document.createElement('div');
      wrapper.id = 'auth-modal-root';
      wrapper.innerHTML = this.getTemplate();
      this.container.appendChild(wrapper);
      this.modalElement = wrapper.querySelector('.auth-modal-backdrop');
    }

    this.bindEvents();
    window.addEventListener('openAuthModal', this._handleOpenEvent);
    document.addEventListener('keydown', this._handleKeyDown);
  }

  /**
   * 卸载组件并清理全局事件监听
   */
  unmount() {
    window.removeEventListener('openAuthModal', this._handleOpenEvent);
    document.removeEventListener('keydown', this._handleKeyDown);
    if (this.modalElement && this.modalElement.parentNode) {
      this.modalElement.parentNode.remove();
    }
  }

  _handleOpenEvent() {
    this.open();
  }

  _handleKeyDown(e) {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  }

  /**
   * 打开弹窗
   */
  open() {
    if (!this.modalElement) this.mount();
    this.isOpen = true;
    this.modalElement.classList.add('active');
    document.body.style.overflow = 'hidden';

    // 自动聚焦第一个输入框
    setTimeout(() => {
      const nicknameInput = this.modalElement.querySelector('#auth-game-nickname');
      if (nicknameInput) nicknameInput.focus();
    }, 100);
  }

  /**
   * 关闭弹窗
   */
  close() {
    if (!this.modalElement) return;
    this.isOpen = false;
    this.modalElement.classList.remove('active');
    document.body.style.overflow = '';
    this.clearError();
  }

  /**
   * 显示校验或认证错误提示
   * @param {string} msg 
   */
  showError(msg) {
    const errorEl = this.modalElement.querySelector('.auth-error-msg');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.style.display = 'block';
    }
  }

  /**
   * 清除错误提示
   */
  clearError() {
    const errorEl = this.modalElement.querySelector('.auth-error-msg');
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }

  /**
   * 处理快捷预设填入
   * @param {string} gameId 
   * @param {string} gameNickname 
   */
  applyPreset(gameId, gameNickname) {
    const idInput = this.modalElement.querySelector('#auth-game-id');
    const nicknameInput = this.modalElement.querySelector('#auth-game-nickname');
    if (idInput) idInput.value = gameId;
    if (nicknameInput) nicknameInput.value = gameNickname;
    this.clearError();
  }

  /**
   * 处理表单提交
   * @param {Event} [e] 
   */
  handleSubmit(e) {
    if (e) e.preventDefault();

    const idInput = this.modalElement.querySelector('#auth-game-id');
    const nicknameInput = this.modalElement.querySelector('#auth-game-nickname');

    const gameId = idInput ? idInput.value.trim() : '';
    const gameNickname = nicknameInput ? nicknameInput.value.trim() : '';

    if (!gameNickname) {
      this.showError('请输入特工游戏昵称！');
      if (nicknameInput) nicknameInput.focus();
      return;
    }

    if (!gameId) {
      this.showError('请输入特工游戏玩家 ID！');
      if (idInput) idInput.focus();
      return;
    }

    try {
      // 1. 调用 wechatAuth.mockLogin(gameId, gameNickname)
      const user = wechatAuth.mockLogin(gameId, gameNickname);

      // 2. 更新 store.setState({ user })
      store.setState({ user });

      // 3. 关闭弹窗
      this.close();
    } catch (err) {
      this.showError(err.message || '微信认证鉴权失败，请重新检查输入');
    }
  }

  /**
   * HTML 模板
   * @returns {string}
   */
  getTemplate() {
    return `
      <div class="auth-modal-backdrop">
        <div class="auth-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
          <div class="dialog-accent-bar"></div>
          
          <button class="auth-modal-close" id="btn-auth-close" aria-label="关闭弹窗">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          <div class="auth-modal-header">
            <div class="auth-brand-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.5 2C4.36 2 1 4.91 1 8.5c0 1.98 1.01 3.75 2.59 4.96L3 16.5l3.41-1.36c.67.19 1.37.3 2.09.3.26 0 .52-.02.77-.04C8.75 14.65 8.5 13.85 8.5 13c0-3.87 3.8-7 8.5-7 .34 0 .67.02 1 .06C16.63 3.77 12.92 2 8.5 2zm-2 4.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm6.5 2.5c-3.87 0-7 2.46-7 5.5s3.13 5.5 7 5.5c.61 0 1.2-.08 1.76-.23L21 21l-1.07-2.4c1.28-.97 2.07-2.35 2.07-3.85 0-3.04-3.13-5.5-7-5.5zm-2.5 3.5c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75zm5 0c.41 0 .75.34.75.75s-.34.75-.75.75-.75-.34-.75-.75.34-.75.75-.75z"/>
              </svg>
              <span>微信快捷鉴权</span>
            </div>
            <h2 id="auth-modal-title" class="auth-modal-title">微信一键登录与游戏绑定</h2>
            <p class="auth-modal-subtitle">绑定《弹壳特工队》玩家 ID，解锁毫秒级精准并发发车与战术队形匹配</p>
          </div>

          <form id="auth-modal-form" class="auth-modal-form">
            <div class="auth-error-msg" style="display: none;"></div>

            <div class="form-group">
              <label for="auth-game-nickname" class="form-label">
                <span>特工游戏昵称</span>
                <span class="required-star">*</span>
              </label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <input 
                  type="text" 
                  id="auth-game-nickname" 
                  name="gameNickname"
                  class="form-control" 
                  placeholder="例如：暗影特工·极速" 
                  required 
                  autocomplete="off"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="auth-game-id" class="form-label">
                <span>特工游戏玩家 ID</span>
                <span class="required-star">*</span>
              </label>
              <div class="input-wrapper">
                <svg class="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <input 
                  type="text" 
                  id="auth-game-id" 
                  name="gameId"
                  class="form-control" 
                  placeholder="例如：9582014 (7-8位数字ID)" 
                  required 
                  autocomplete="off"
                />
              </div>
            </div>

            <div class="quick-presets">
              <span class="preset-label">测试预设账号：</span>
              <div class="preset-chips">
                <button type="button" class="chip-btn" data-id="9582014" data-nickname="暗影走位王">暗影走位王 (ID: 9582014)</button>
                <button type="button" class="chip-btn" data-id="8849201" data-nickname="爆裂小弹壳">爆裂小弹壳 (ID: 8849201)</button>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="btn btn-secondary btn-cancel" id="btn-auth-cancel">取消</button>
              <button type="submit" class="btn btn-primary btn-submit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.5 2C4.36 2 1 4.91 1 8.5c0 1.98 1.01 3.75 2.59 4.96L3 16.5l3.41-1.36c.67.19 1.37.3 2.09.3.26 0 .52-.02.77-.04C8.75 14.65 8.5 13.85 8.5 13c0-3.87 3.8-7 8.5-7 .34 0 .67.02 1 .06C16.63 3.77 12.92 2 8.5 2z"/>
                </svg>
                确认绑定并登录
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  /**
   * 绑定事件处理
   */
  bindEvents() {
    if (!this.modalElement) return;

    // 点击蒙层关闭
    this.modalElement.addEventListener('click', (e) => {
      if (e.target === this.modalElement) {
        this.close();
      }
    });

    // 关闭按钮 (x)
    const closeBtn = this.modalElement.querySelector('#btn-auth-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // 取消按钮
    const cancelBtn = this.modalElement.querySelector('#btn-auth-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.close());
    }

    // 预设账号快捷选择
    const chips = this.modalElement.querySelectorAll('.chip-btn');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.getAttribute('data-id');
        const nickname = chip.getAttribute('data-nickname');
        this.applyPreset(id, nickname);
      });
    });

    // 表单提交
    const form = this.modalElement.querySelector('#auth-modal-form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }
}

/**
 * 挂载 AuthModal 的辅助函数
 * @param {HTMLElement|string} container 
 * @returns {AuthModal}
 */
export function renderAuthModal(container = document.body) {
  const modal = new AuthModal(container);
  modal.mount();
  return modal;
}

export default AuthModal;

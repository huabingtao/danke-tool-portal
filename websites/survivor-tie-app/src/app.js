/**
 * 弹壳特工队 - 并列发车平台 SPA 主入口与总装整合脚本
 * Survivor Tie & Dispatch Platform - Single Page Application Integration & Root Assembly
 */

import store from './state/store.js';
import { Header } from './components/Header.js';
import { AuthModal } from './components/AuthModal.js';
import { AdminPanel } from './components/AdminPanel.js';
import { BatchLobby } from './components/BatchLobby.js';
import { CabinRoom } from './components/CabinRoom.js';

class App {
  constructor() {
    this.header = null;
    this.authModal = null;
    this.currentComponent = null;
    this.currentView = 'lobby'; // 'lobby' | 'admin' | 'cabin'
    this.currentBatchId = null;
    this.unsubscribeStore = null;
  }

  /**
   * 初始化应用总装与各组件挂载
   */
  init() {
    console.log('🚀 [App] Initializing Survivor Tie App (v2.4)...');

    // 1. 挂载 Header 组件
    const headerEl = document.querySelector('.site-header');
    if (headerEl) {
      this.header = new Header(headerEl);
      this.header.mount();
    } else {
      console.warn('[App] Site header container not found.');
    }

    // 2. 挂载 AuthModal 全局登录弹窗
    this.authModal = new AuthModal(document.body);
    this.authModal.mount();

    // 3. 根据初始 store.mode 状态决定首次渲染视图
    const initialState = store.getState();
    if (initialState.mode === 'creator') {
      this.currentView = 'admin';
    } else {
      this.currentView = 'lobby';
    }

    // 4. 渲染主工作区视图
    this.renderView();

    // 5. 绑定全局自定义事件监听
    this.bindGlobalEvents();

    // 6. 订阅 store 响应式更新
    this.subscribeStore();

    console.log(`✅ [App] Application successfully initialized in [${this.currentView.toUpperCase()}] mode.`);
  }

  /**
   * 绑定全局自定义事件 (openAuthModal, enterCabin, navLobby)
   */
  bindGlobalEvents() {
    // 监听打开微信授权登录 Modal
    window.addEventListener('openAuthModal', () => {
      if (this.authModal) {
        this.authModal.open();
      }
    });

    // 监听导航至发车车厢 CabinRoom
    window.addEventListener('enterCabin', (e) => {
      let batchId = null;
      if (e.detail) {
        batchId = typeof e.detail === 'string' ? e.detail : e.detail.batchId;
      }
      this.navigateTo('cabin', { batchId });
    });

    // 监听导航至每日发车班次大厅 BatchLobby
    window.addEventListener('navLobby', () => {
      const state = store.getState();
      const targetView = state.mode === 'creator' ? 'admin' : 'lobby';
      this.navigateTo(targetView);
    });

    // 监听顶部导航栏与快捷发车按钮点击
    document.addEventListener('click', (e) => {
      // 导航链接点击
      const navLink = e.target.closest('.main-nav .nav-link');
      if (navLink) {
        const href = navLink.getAttribute('href');
        if (href === '#hall' || href === '#guild' || href === '#tactics' || href === '#records') {
          e.preventDefault();
          document.querySelectorAll('.main-nav .nav-link').forEach(link => link.classList.remove('active'));
          navLink.classList.add('active');

          const state = store.getState();
          const targetView = state.mode === 'creator' ? 'admin' : 'lobby';
          this.navigateTo(targetView);
        }
      }

      // 快速发车按钮点击
      const btnCreate = e.target.closest('#btn-create-room');
      if (btnCreate) {
        e.preventDefault();
        const { user, mode } = store.getState();
        if (mode === 'creator') {
          this.navigateTo('admin');
          setTimeout(() => {
            const form = document.querySelector('#admin-publish-form');
            if (form) form.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        } else {
          if (!user) {
            window.dispatchEvent(new CustomEvent('openAuthModal'));
          } else {
            this.navigateTo('lobby');
          }
        }
      }
    });
  }

  /**
   * 订阅 Store 响应式状态更新
   */
  subscribeStore() {
    this.unsubscribeStore = store.subscribe((state, prevState) => {
      // 模式无缝切换 (创作者 Admin / 玩家 View)
      if (state.mode !== prevState.mode) {
        if (state.mode === 'creator') {
          this.navigateTo('admin');
        } else if (state.mode === 'player') {
          if (this.currentView !== 'cabin') {
            this.navigateTo('lobby');
          }
        }
      }
    });
  }

  /**
   * 视图切换与导航控制
   * @param {string} view - 'lobby' | 'admin' | 'cabin'
   * @param {Object} [params]
   */
  navigateTo(view, params = {}) {
    if (view === 'cabin' && params.batchId) {
      this.currentBatchId = params.batchId;
    }

    if (this.currentView === view && view !== 'cabin') {
      return;
    }

    this.currentView = view;
    this.renderView();
  }

  /**
   * 渲染主工作区视图组件
   */
  renderView() {
    const mainContainer = document.querySelector('.main-layout');
    const heroBanner = document.querySelector('.hero-banner');

    if (!mainContainer) {
      console.error('[App] Main workspace container (.main-layout) not found.');
      return;
    }

    // 卸载前一个主视图组件
    if (this.currentComponent && typeof this.currentComponent.unmount === 'function') {
      this.currentComponent.unmount();
      this.currentComponent = null;
    }

    // 控制 Hero Banner 显示状态 (车厢模式下隐藏 Banner 以聚焦车厢操作)
    if (heroBanner) {
      if (this.currentView === 'cabin') {
        heroBanner.style.display = 'none';
      } else {
        heroBanner.style.display = 'flex';
      }
    }

    // 根据模式无缝切换渲染组件
    if (this.currentView === 'admin') {
      console.log('[App] Mounting AdminPanel component...');
      this.currentComponent = new AdminPanel(mainContainer);
      this.currentComponent.mount();
    } else if (this.currentView === 'cabin') {
      console.log(`[App] Mounting CabinRoom component for batch [${this.currentBatchId}]...`);
      this.currentComponent = new CabinRoom(mainContainer, { batchId: this.currentBatchId });
      this.currentComponent.mount();
    } else {
      console.log('[App] Mounting BatchLobby component...');
      this.currentComponent = new BatchLobby(mainContainer, {
        onEnterCabin: (batchId) => {
          this.navigateTo('cabin', { batchId });
        }
      });
      this.currentComponent.mount();
    }

    // 滚动顶端
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * 销毁应用与资源回收
   */
  destroy() {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
    if (this.header) {
      this.header.unmount();
    }
    if (this.authModal) {
      this.authModal.unmount();
    }
    if (this.currentComponent && typeof this.currentComponent.unmount === 'function') {
      this.currentComponent.unmount();
    }
  }
}

// 应用启动入口
let appInstance = null;

function bootstrap() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      appInstance = new App();
      appInstance.init();
    });
  } else {
    appInstance = new App();
    appInstance.init();
  }
}

bootstrap();

export default App;

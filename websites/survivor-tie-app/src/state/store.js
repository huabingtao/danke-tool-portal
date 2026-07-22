/**
 * 弹壳特工队 - 并列发车平台 集中状态管理 Store
 * Survivor Tie & Dispatch Platform Centralized Store
 */

const STORAGE_KEY = 'survivor_tie_store';

// 预置 2 个精美发车班次
const PRESET_BATCHES = [
  {
    id: 'batch-0105',
    time: '01:05:00',
    title: '深夜静默精准并列班车 (01:05:00)',
    targetScore: 106,
    targetScoreText: '106分',
    capacity: 200,
    bookedCount: 142,
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=https%3A%2F%2Fsurvivor-tie.app%2Fjoin%2Fbatch-0105',
    notice: '【统一头像规范】为确保同组识别人数及防止路人混入，请所有车友统一更换游戏头像为『暗影特工·极速装甲』。发车前 5 分钟在组队房间集结，踩点 01:05:00 统一出击，目标分严格锁定 106 分！',
    status: 'recruiting',
    tags: ['106分控分', '统一特工头像', '深夜秒切并列'],
    leader: '战术总指挥·暗影',
    createdAt: 1720000000000
  },
  {
    id: 'batch-0805',
    time: '08:05:00',
    title: '早间巅峰定速并列班车 (08:05:00)',
    targetScore: 106,
    targetScoreText: '106分',
    capacity: 200,
    bookedCount: 178,
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=https%3A%2F%2Fsurvivor-tie.app%2Fjoin%2Fbatch-0805',
    notice: '【统一头像规范】入班车友请统一将头像切换为『黄金闪击战士』。统一在 08:05:00 准点切入副本，严禁提前爆分，比赛第 12 分钟统一提分至 106 分后锁定输出，保障 200 人同分并列登上榜首！',
    status: 'recruiting',
    tags: ['106分并列登顶', '黄金战甲头像', '早间黄金档'],
    leader: '战术指导·阿天',
    createdAt: 1720000000000
  }
];

const INITIAL_STATE = {
  user: null,
  batches: PRESET_BATCHES,
  bookings: {},
  isAdmin: false
};

class Store {
  constructor() {
    this.listeners = new Set();
    this.state = this._loadState();
  }

  /**
   * 从 localStorage 加载持久化状态
   */
  _loadState() {
    try {
      if (typeof localStorage !== 'undefined') {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
          const parsed = JSON.parse(storedData);
          return {
            ...INITIAL_STATE,
            ...parsed,
            batches: (parsed.batches && parsed.batches.length > 0) ? parsed.batches : PRESET_BATCHES,
            bookings: parsed.bookings || {}
          };
        }
      }
    } catch (error) {
      console.warn('[Store] Failed to load state from localStorage:', error);
    }
    return { ...INITIAL_STATE };
  }

  /**
   * 将当前状态持久化至 localStorage
   */
  _saveState() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
    } catch (error) {
      console.error('[Store] Failed to save state to localStorage:', error);
    }
  }

  /**
   * 获取当前完整状态
   * @returns {Object}
   */
  getState() {
    return this.state;
  }

  /**
   * 更新状态并触发通知与持久化
   * @param {Object|Function} newStateOrUpdater 
   */
  setState(newStateOrUpdater) {
    const prevState = this.state;
    const updates = typeof newStateOrUpdater === 'function'
      ? newStateOrUpdater(prevState)
      : newStateOrUpdater;

    this.state = {
      ...prevState,
      ...updates
    };

    this._saveState();
    this._notify(this.state, prevState);
  }

  /**
   * 订阅状态变化
   * @param {Function} listener 
   * @returns {Function} 解绑订阅函数
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('[Store] Listener must be a function.');
    }
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 通知所有订阅者
   */
  _notify(state, prevState) {
    this.listeners.forEach(listener => {
      try {
        listener(state, prevState);
      } catch (error) {
        console.error('[Store] Error in listener callback:', error);
      }
    });
  }

  /**
   * 预约发车锁（带 3 分钟冷静锁机制）
   * @param {string} batchId 
   * @returns {Object} 预约锁对象
   */
  bookBatch(batchId) {
    const now = Date.now();
    const currentBookings = { ...this.state.bookings };
    
    // 构造预约锁对象
    const booking = {
      batchId,
      locked: true,
      status: 'booked',
      bookedAt: now,
      cooldownEnd: now + 3 * 60 * 1000 // 3 分钟冷静期
    };

    currentBookings[batchId] = booking;

    // 同时更新对应班次的已预约人数
    const updatedBatches = this.state.batches.map(batch => {
      if (batch.id === batchId) {
        return {
          ...batch,
          bookedCount: Math.min(batch.capacity, (batch.bookedCount || 0) + 1)
        };
      }
      return batch;
    });

    this.setState({
      bookings: currentBookings,
      batches: updatedBatches
    });

    return booking;
  }

  /**
   * 取消预约锁
   * @param {string} batchId 
   */
  cancelBooking(batchId) {
    const currentBookings = { ...this.state.bookings };
    if (currentBookings[batchId]) {
      delete currentBookings[batchId];

      const updatedBatches = this.state.batches.map(batch => {
        if (batch.id === batchId) {
          return {
            ...batch,
            bookedCount: Math.max(0, (batch.bookedCount || 0) - 1)
          };
        }
        return batch;
      });

      this.setState({
        bookings: currentBookings,
        batches: updatedBatches
      });
    }
  }

  /**
   * 检查指定班次是否处于冷静锁期（3分钟内）
   * @param {string} batchId 
   * @returns {boolean}
   */
  isCoolingDown(batchId) {
    const booking = this.state.bookings[batchId];
    if (!booking || !booking.locked) return false;
    const elapsed = Date.now() - booking.bookedAt;
    return elapsed < 3 * 60 * 1000;
  }

  /**
   * 重置 Store 为默认状态（仅测试/清空使用）
   */
  resetStore() {
    this.state = { ...INITIAL_STATE };
    this._saveState();
    this._notify(this.state, {});
  }
}

// 导出单例对象
export const store = new Store();

// 导出挂载辅助方法
export const getState = () => store.getState();
export const setState = (newState) => store.setState(newState);
export const subscribe = (listener) => store.subscribe(listener);

export default store;

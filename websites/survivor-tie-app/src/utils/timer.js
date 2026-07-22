/**
 * 弹壳特工队 - 并列发车平台 高精度倒计时工具
 * Survivor Tie & Dispatch Platform - High Precision Timer Utility
 */

/**
 * 启动高精度倒计时，使用 performance.now() 规避浏览器后台休眠累积误差
 * @param {string|number|Date} targetTimeStr - 目标发车时间 (如 "01:05:00", "08:05:00", 时间戳或 Date)
 * @param {Function} onTick - 倒计时回调函数，接收 ({ hours, mins, secs, ms, ms2, ms3, diff, isFinished, stop })
 * @returns {Function} stop - 调用即可清除并停止倒计时定时器
 */
export function startCountdown(targetTimeStr, onTick) {
  let targetMs = 0;

  if (typeof targetTimeStr === 'string') {
    const parts = targetTimeStr.split(':').map(Number);
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    const s = parts[2] || 0;

    const targetDate = new Date();
    targetDate.setHours(h, m, s, 0);

    // 如果计算出的目标时间比当前系统时间早超过 6 小时，说明是次日的目标发车时间
    if (targetDate.getTime() < Date.now() - 6 * 3600 * 1000) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    targetMs = targetDate.getTime();
  } else if (typeof targetTimeStr === 'number') {
    targetMs = targetTimeStr;
  } else if (targetTimeStr instanceof Date) {
    targetMs = targetTimeStr.getTime();
  } else {
    console.warn('[Timer] Invalid targetTimeStr provided:', targetTimeStr);
    targetMs = Date.now();
  }

  const startRealTime = Date.now();
  const startPerfTime = performance.now();
  let timerId = null;
  let isStopped = false;

  const stop = () => {
    isStopped = true;
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const update = () => {
    if (isStopped) return;

    // 采用 performance.now() 偏移量计算高精度的当前真实时间
    const elapsedPerf = performance.now() - startPerfTime;
    const currentRealTime = startRealTime + elapsedPerf;
    let diff = Math.max(0, targetMs - currentRealTime);

    const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
    const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    const ms = String(Math.floor((diff % 1000) / 100)); // 单位 100ms (0-9)
    const ms2 = String(Math.floor((diff % 1000) / 10)).padStart(2, '0'); // 双位数 ms (00-99)
    const ms3 = String(Math.floor(diff % 1000)).padStart(3, '0'); // 三位数 ms (000-999)

    const isFinished = diff <= 0;

    if (typeof onTick === 'function') {
      try {
        onTick({
          hours,
          mins,
          secs,
          ms,
          ms2,
          ms3,
          diff,
          isFinished,
          stop
        });
      } catch (err) {
        console.error('[Timer] Error in onTick callback:', err);
      }
    }

    if (!isFinished && !isStopped) {
      // 50ms 触发一次更新，可实现流畅跳动的毫秒展示且不浪费渲染性能
      timerId = setTimeout(update, 50);
    }
  };

  // 微任务异步或同步触发首次计算，确保 stop 返回句柄生效
  queueMicrotask(() => {
    if (!isStopped) {
      update();
    }
  });

  return stop;
}

export const timer = {
  startCountdown
};

export default timer;

import { useState, useEffect } from 'react';

export function usePrecisionTimer(targetTimeStr: string) {
  const [timeLeft, setTimeLeft] = useState({ hours: '00', mins: '00', secs: '00', ms: '0' });

  useEffect(() => {
    if (!targetTimeStr) return;

    const updateTimer = () => {
      const now = new Date();
      let target = new Date();

      if (targetTimeStr.includes(' ') || targetTimeStr.includes('T')) {
        target = new Date(targetTimeStr.replace(' ', 'T'));
      } else {
        const [h, m, s] = targetTimeStr.split(':').map(Number);
        target.setHours(h || 0, m || 0, s || 0, 0);
      }

      let diff = target.getTime() - now.getTime();
      if (diff < 0) diff = 0;

      const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      const ms = String(Math.floor((diff % 1000) / 100));

      setTimeLeft({ hours, mins, secs, ms });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [targetTimeStr]);

  return timeLeft;
}

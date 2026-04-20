import { useState, useEffect, useRef } from 'react';

function parseSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = String(timeStr).split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parseInt(timeStr) || 0;
}

/**
 * Custom countdown hook.
 * @param {Object} options
 * @param {string} options.endTime - Time string "HH:MM:SS"
 * @param {Function} [options.onExpire] - Called when countdown reaches zero
 */
export default function useCountdown({ endTime, onExpire } = {}) {
  const [secondsLeft, setSecondsLeft] = useState(() => parseSeconds(endTime));
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    setSecondsLeft(parseSeconds(endTime));
  }, [endTime]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpireRef.current?.();
      return;
    }
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          onExpireRef.current?.();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft > 0 ? 1 : 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const h = Math.floor(secondsLeft / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const isExpired = secondsLeft <= 0;

  return { formatted, isExpired, secondsLeft };
}

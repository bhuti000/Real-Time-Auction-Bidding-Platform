import React from 'react';
import { Clock } from 'lucide-react';
import useCountdown from '../../hooks/useCountdown.js';

/**
 * CountdownTimer — displays a live countdown from a "HH:MM:SS" string.
 */
function CountdownTimer({ endTime, onExpire, className = '' }) {
  const { formatted, isExpired } = useCountdown({ endTime, onExpire });

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Clock size={13} className={isExpired ? 'text-error' : 'text-on-surface-variant'} />
      <span
        className={`font-body text-sm font-semibold ${
          isExpired ? 'text-error' : 'text-on-surface-variant'
        }`}
      >
        {isExpired ? 'Ended' : formatted}
      </span>
    </div>
  );
}

export default CountdownTimer;

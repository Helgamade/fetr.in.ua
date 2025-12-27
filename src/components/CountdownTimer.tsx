import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endDate: Date;
  className?: string;
  compact?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  endDate, 
  className = '',
  compact = false 
}) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-sm ${className}`}>
        <Clock className="w-4 h-4 text-warning" />
        <span className="font-medium">
          {timeLeft.days > 0 && `${timeLeft.days}д `}
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="w-5 h-5 text-warning" />
      <div className="flex items-center gap-1">
        {timeLeft.days > 0 && (
          <>
            <TimeUnit value={timeLeft.days} label="дн" />
            <span className="text-muted-foreground">:</span>
          </>
        )}
        <TimeUnit value={timeLeft.hours} label="год" />
        <span className="text-muted-foreground">:</span>
        <TimeUnit value={timeLeft.minutes} label="хв" />
        <span className="text-muted-foreground">:</span>
        <TimeUnit value={timeLeft.seconds} label="сек" />
      </div>
    </div>
  );
};

const TimeUnit: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-lg font-bold font-heading text-foreground tabular-nums">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-[10px] text-muted-foreground uppercase">{label}</span>
  </div>
);

import React, { useState, useEffect, useMemo } from 'react';
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
  // Мемоизируем endDate для стабильности (используем временную метку для сравнения)
  const stableEndDate = useMemo(() => endDate, [endDate.getTime()]);
  
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = stableEndDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        // Если время вышло, показываем нули
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [stableEndDate]);

  const timeString = `${String(timeLeft.hours).padStart(2, '0')}:${String(timeLeft.minutes).padStart(2, '0')}:${String(timeLeft.seconds).padStart(2, '0')}`;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-sm ${className}`}>
        <Clock className="w-4 h-4 text-warning" />
        <span className="font-medium">
          Знижка діє ще: {timeString}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="w-5 h-5 text-warning" />
      <span className="font-medium">
        Знижка діє ще: {timeString}
      </span>
    </div>
  );
};

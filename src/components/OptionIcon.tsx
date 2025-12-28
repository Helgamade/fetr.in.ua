import React from 'react';
import { cn } from '@/lib/utils';

interface OptionIconProps {
  icon?: string;
  className?: string;
}

export const OptionIcon: React.FC<OptionIconProps> = ({ icon, className }) => {
  if (!icon) return null;

  // Если это SVG код
  if (icon.trim().startsWith('<svg')) {
    return (
      <div 
        className={cn(
          "w-4 h-4 text-primary flex-shrink-0 [&_svg]:w-full [&_svg]:h-full [&_svg]:text-current [&_svg]:stroke-current",
          className
        )}
        dangerouslySetInnerHTML={{ __html: icon }}
      />
    );
  }

  // Если это URL (http/https или относительный путь)
  if (icon.startsWith('http') || icon.startsWith('/') || icon.startsWith('./')) {
    return (
      <img 
        src={icon} 
        alt="" 
        className={cn("w-4 h-4 object-contain flex-shrink-0", className)}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }

  return null;
};


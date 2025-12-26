'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'small' | 'default' | 'large';
  className?: string;
}

export const Logo = ({ size = 'default', className = '' }: LogoProps) => {
  const sizes = {
    small: 'text-xl',
    default: 'text-2xl',
    large: 'text-4xl'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse"></div>
      </div>
      <span className={cn(
        'font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent',
        sizes[size]
      )}>
        FestX
      </span>
    </div>
  );
};

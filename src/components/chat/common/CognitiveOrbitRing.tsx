import React from 'react';
import { motion } from 'motion/react';

export interface CognitiveOrbitRingProps {
  isSpinning?: boolean;
  dir?: 'ltr' | 'rtl';
  size?: number;
  radius?: number;
  className?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

/**
 * 🏛️ PERPLEXTA DESIGN SYSTEM — COGNITIVE ORBIT RING
 * 
 * Exact approved circular ring component for thinking & streaming states.
 * Provides unified geometric precision, identical stroke dash patterns,
 * and synchronized rotational dynamics across the platform.
 */
export const CognitiveOrbitRing: React.FC<CognitiveOrbitRingProps> = ({
  isSpinning = false,
  dir = 'ltr',
  size = 24,
  radius = 10,
  className = '',
  strokeWidth = 1.5,
  strokeDasharray = '4.5 2.5',
}) => {
  const center = size / 2;

  return (
    <div className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none ${className}`}>
      {isSpinning ? (
        <motion.svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-full pointer-events-none"
          animate={{ rotate: dir === 'rtl' ? -360 : 360 }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            className="text-accent/80"
          />
        </motion.svg>
      ) : (
        <svg 
          viewBox={`0 0 ${size} ${size}`} 
          className="w-full h-full pointer-events-none"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.2}
            className="text-accent/25"
          />
        </svg>
      )}
    </div>
  );
};

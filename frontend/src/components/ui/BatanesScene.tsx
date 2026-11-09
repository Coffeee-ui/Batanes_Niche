import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface BatanesSceneProps {
  className?: string;
  variant?: 'day' | 'night' | 'auto';
}

export default function BatanesScene({ className = '', variant = 'auto' }: BatanesSceneProps) {
  const { isDark } = useTheme();
  const night = variant === 'night' || (variant === 'auto' && isDark);

  return (
    <div
      className={`relative w-full overflow-hidden select-none pointer-events-none h-32 sm:h-44 md:h-56 ${className}`}
      role="img"
      aria-label={night ? 'Night in Batanes with crescent moon, stars, rolling hills and Basco lighthouse' : 'Day in Batanes with sun, rolling green hills and Basco lighthouse'}
    >
      <svg
        viewBox="0 0 1440 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full block"
      >
        {night ? (
          /* Night Mode: Deep sky, crescent moon, stars, beam, dark teal-navy hills */
          <>
            {/* Stars */}
            <circle cx="120" cy="50" r="1.5" fill="#E6EDF5" opacity="0.8" />
            <circle cx="210" cy="30" r="1" fill="#E6EDF5" opacity="0.6" />
            <circle cx="340" cy="65" r="2" fill="#E6EDF5" opacity="0.9" />
            <circle cx="480" cy="35" r="1.5" fill="#E6EDF5" opacity="0.7" />
            <circle cx="620" cy="55" r="1" fill="#E6EDF5" opacity="0.5" />
            <circle cx="750" cy="25" r="2" fill="#E6EDF5" opacity="0.8" />
            <circle cx="890" cy="70" r="1.5" fill="#E6EDF5" opacity="0.6" />
            <circle cx="980" cy="40" r="2" fill="#E6EDF5" opacity="0.8" />
            <circle cx="1040" cy="85" r="1" fill="#E6EDF5" opacity="0.5" />
            <circle cx="1280" cy="45" r="1.5" fill="#E6EDF5" opacity="0.7" />

            {/* Crescent Moon */}
            <g transform="translate(180, 80)">
              <path
                d="M30 0 A 28 28 0 0 0 54 36 A 28 28 0 1 1 30 0 Z"
                fill="#F2D36B"
              />
            </g>

            {/* Lighthouse Beam */}
            <polygon
              points="1100,105 0,70 0,160 1100,118"
              fill="url(#nightBeamGrad)"
              opacity="0.35"
            />

            {/* Back Hill */}
            <path
              d="M0 160 Q 400 90 900 150 T 1440 130 L 1440 260 L 0 260 Z"
              fill="#11272D"
            />

            {/* Middle Hill */}
            <path
              d="M0 180 Q 550 120 1100 170 T 1440 155 L 1440 260 L 0 260 Z"
              fill="#18363E"
            />

            {/* Front Hill */}
            <path
              d="M0 205 Q 360 155 780 185 T 1440 175 L 1440 260 L 0 260 Z"
              fill="#1F4751"
            />

            {/* Lighthouse Tower */}
            <g transform="translate(1090, 85)">
              {/* Tower base & shaft */}
              <polygon points="12,120 28,120 24,30 16,30" fill="#D3DDE8" />
              {/* Balcony */}
              <rect x="13" y="27" width="14" height="3" rx="1" fill="#08101B" />
              {/* Lantern room */}
              <rect x="15" y="16" width="10" height="11" fill="#F2D36B" opacity="0.9" />
              {/* Cap roof */}
              <polygon points="12,16 28,16 20,6" fill="#08101B" />
              <rect x="19" y="3" width="2" height="4" fill="#08101B" />
            </g>

            <defs>
              <linearGradient id="nightBeamGrad" x1="1100" y1="110" x2="0" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F2D36B" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F2D36B" stopOpacity="0" />
              </linearGradient>
            </defs>
          </>
        ) : (
          /* Day Mode: Warm sun, lush rolling green hills, clean lighthouse */
          <>
            {/* Sun */}
            <circle cx="190" cy="110" r="38" fill="#F5B700" />

            {/* Back Hill */}
            <path
              d="M0 150 Q 420 80 920 140 T 1440 120 L 1440 260 L 0 260 Z"
              fill="#529968"
            />

            {/* Middle Hill */}
            <path
              d="M0 175 Q 580 115 1100 165 T 1440 150 L 1440 260 L 0 260 Z"
              fill="#3E8355"
            />

            {/* Front Hill */}
            <path
              d="M0 200 Q 380 148 800 180 T 1440 170 L 1440 260 L 0 260 Z"
              fill="#2E6B43"
            />

            {/* Lighthouse Tower */}
            <g transform="translate(1090, 85)">
              {/* Tower base & shaft */}
              <polygon points="12,120 28,120 24,30 16,30" fill="#FFFFFF" />
              {/* Balcony */}
              <rect x="13" y="27" width="14" height="3" rx="1" fill="#1A1D21" />
              {/* Lantern room */}
              <rect x="15" y="16" width="10" height="11" fill="#FFF1C2" />
              {/* Cap roof */}
              <polygon points="12,16 28,16 20,6" fill="#1A1D21" />
              <rect x="19" y="3" width="2" height="4" fill="#1A1D21" />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}


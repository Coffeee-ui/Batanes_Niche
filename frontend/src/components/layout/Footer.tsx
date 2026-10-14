import React from 'react';
import { MapPin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="mt-auto border-t"
      style={{
        borderColor: 'hsl(var(--color-border-subtle))',
        background: 'hsl(var(--color-bg-alt))',
      }}
    >
      <div className="container-page py-4">
        <div className="flex flex-col items-center text-center max-w-xl mx-auto space-y-2">
          {/* Brand */}
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, hsl(var(--color-primary)), hsl(var(--color-secondary)))' }}
            >
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-base" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Batanes<span className="gradient-text">Niche</span>
            </span>
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed" style={{ color: 'hsl(var(--color-text-muted))' }}>
            The hyper-localized employment platform connecting Ivatan job seekers with employers across the Batanes province, Philippines.
          </p>

          {/* Made with & Copyright */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs" style={{ color: 'hsl(var(--color-text-faint))' }}>
            <span>© {new Date().getFullYear()} Batanes Niche Job Portal. All rights reserved.</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> for Batanes
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

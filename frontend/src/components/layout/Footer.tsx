import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer
      className="mt-auto pt-6 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-6 text-center text-xs"
      style={{
        backgroundColor: 'hsl(var(--header))',
        color: 'hsl(var(--header-foreground))',
      }}
    >
      <div className="container-page space-y-2.5 px-4">
        <p className="m-0 leading-relaxed max-w-xl mx-auto">
          Batanes Niche · A local job portal for the province of Batanes. © 2026 All rights reserved.
        </p>
        <nav aria-label="Footer navigation" className="flex items-center justify-center gap-4 flex-wrap pt-1">
          <Link
            to="/about"
            className="hover:underline text-header-foreground"
          >
            About
          </Link>
          <Link
            to="/privacy"
            className="hover:underline text-header-foreground"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="hover:underline text-header-foreground"
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}

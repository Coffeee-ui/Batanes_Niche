import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children?: ReactNode;
  noFooter?: boolean;
}

export default function Layout({ children, noFooter }: LayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col w-full max-w-full overflow-x-clip">
      <Navbar />
      <main
        className={`flex-1 w-full max-w-full min-w-0 pt-16 ${
          noFooter ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0' : 'pb-0'
        }`}
      >
        <div className="page-enter w-full max-w-full min-w-0">
          {children ?? <Outlet />}
        </div>
      </main>
      {!noFooter && <Footer />}
      <BottomNav />
    </div>
  );
}

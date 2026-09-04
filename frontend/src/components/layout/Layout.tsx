import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children?: ReactNode;
  noFooter?: boolean;
}

export default function Layout({ children, noFooter }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">
        <div className="page-enter">
          {children ?? <Outlet />}
        </div>
      </main>
      {!noFooter && <Footer />}
    </div>
  );
}

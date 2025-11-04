
// src/app/layout/MainLayout.tsx
import React from 'react';
import Navbar from './Navbar';
//import Sidebar from './Sidebar';
import Footer from './footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {/* <Sidebar /> */}
        <main className="">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
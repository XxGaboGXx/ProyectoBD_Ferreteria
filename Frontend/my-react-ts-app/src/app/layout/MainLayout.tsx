// src/app/layout/MainLayout.tsx
import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar en la parte superior */}
      <Navbar />

      {/* Contenedor principal: sidebar + contenido */}
      <div className="flex flex-1 pt-20">
        {/* Sidebar: NO es fixed, forma parte del flujo */}
        <Sidebar />

        {/* Contenido principal */}
        <div className="flex flex-col flex-1">
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6 mt-10" >
            {children}
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
import React, { useState } from 'react';
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react';

export default function Layout({ sidebar, children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex w-screen min-h-screen bg-white text-[#374151] font-sans relative overflow-x-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0 h-screen">
        {React.cloneElement(sidebar, { defaultExpanded: false })}
      </div>

      {/* Mobile drawer sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full'
          } transition duration-300 ease-in-out flex flex-shrink-0 border-r border-[#EBEAE8] bg-[#F9F9F8] h-screen md:hidden`}
      >
        {React.cloneElement(sidebar, { defaultExpanded: true, onCloseSidebar: () => setIsMobileMenuOpen(false) })}
      </div>

      {/* Overlay backdrop when open on mobile */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm transition-opacity"
        ></div>
      )}

      {/* Main content area */}
      <div className="flex-1 h-screen overflow-y-auto flex justify-center relative select-none w-full">
        {/* Toggle Sidebar Button for Mobile */}
        <div className="absolute top-4 left-4 z-30 md:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-white/80 hover:bg-white border border-[#E1E0DD] rounded-xl text-[#374151] shadow-sm hover:shadow-md cursor-pointer transition flex items-center justify-center backdrop-blur-md"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

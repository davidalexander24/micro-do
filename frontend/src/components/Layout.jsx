import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Layout({ sidebar, children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  return (
    <div className="flex w-full min-h-screen bg-white text-[#374151] font-sans relative overflow-x-hidden">
      {/* Sidebar container with sliding behavior for desktop and mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${
          isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full'
        } md:relative md:translate-x-0 transition duration-300 ease-in-out flex flex-shrink-0 border-r border-[#EBEAE8] bg-[#F9F9F8] h-screen ${
          !isSidebarOpen && 'md:hidden'
        }`}
      >
        {sidebar}
      </div>

      {/* Overlay backdrop when open on mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm transition-opacity"
        ></div>
      )}

      {/* Main content area */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col relative select-none">
        {/* Toggle Sidebar Button (Desktop & Mobile) */}
        <div className="absolute top-4 left-4 z-30 flex items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 bg-white/80 hover:bg-white border border-[#E1E0DD] rounded-xl text-[#374151] shadow-sm hover:shadow-md cursor-pointer transition flex items-center justify-center backdrop-blur-md"
            title="Toggle Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

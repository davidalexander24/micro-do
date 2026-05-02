import React from 'react';

export default function Layout({ sidebar, children }) {
  return (
    <div className="flex w-full min-h-screen bg-white text-[#374151] font-sans">
      {sidebar}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col relative select-none">
        {children}
      </div>
    </div>
  );
}

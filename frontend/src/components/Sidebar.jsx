import React, { useState } from 'react';
import { PlusCircle, Search, Clock, PanelLeftOpen, PanelLeftClose } from 'lucide-react';

export default function Sidebar({ goals, onSelectNewGoal, onSelectGoal, searchQuery, setSearchQuery, defaultExpanded = false, onCloseSidebar }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const recentGoals = goals.slice(0, 5);

  return (
    <div
      className={`${isExpanded ? 'w-64' : 'w-16'
        } h-screen bg-[#F9F9F8] border-r border-[#EBEAE8] flex flex-col justify-between font-sans text-[#374151] select-none flex-shrink-0 transition-all duration-300 ease-in-out`}
    >
      {isExpanded ? (
        /* Expanded Mode */
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-6 animate-fade-in">
          {/* Brand/Logo & Close Toggle */}
          <div className="flex items-center justify-between mb-6 px-1">
            <h1 className="text-xl font-serif tracking-tight text-[#1F2937]">MicroDo</h1>
            <button
              onClick={() => {
                if (onCloseSidebar) {
                  onCloseSidebar();
                } else {
                  setIsExpanded(false);
                }
              }}
              className="p-1.5 hover:bg-[#EBEAE8] text-[#6B7280] hover:text-[#374151] rounded-lg transition cursor-pointer"
              title="Collapse menu"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* Action Button: New Goal */}
          <button
            onClick={() => {
              onSelectNewGoal();
              if (onCloseSidebar) onCloseSidebar();
            }}
            className="flex items-center justify-start bg-white border border-[#E1E0DD] hover:border-[#D1D0CC] hover:bg-[#F3F2F0] text-[#1F2937] font-medium px-4 py-2.5 rounded-xl shadow-sm transition mb-6 select-none cursor-pointer w-full"
          >
            <div className="flex items-center gap-3 leading-none">
              <PlusCircle className="w-5 h-5 text-[#6B7280] flex-shrink-0" />
              <span className="text-[14px] leading-none">New goal</span>
            </div>
          </button>

          {/* Primary Links & Search */}
          <div className="space-y-2 mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search goals..."
                className="w-full bg-white border border-[#E1E0DD] hover:border-[#CDCBC7] focus:border-[#B1AFA9] text-[#1F2937] text-[13px] px-8 py-2 rounded-xl focus:ring-0 focus:outline-none focus:shadow-sm transition font-normal placeholder-[#9CA3AF]"
              />
              <Search className="w-4 h-4 text-[#9CA3AF] absolute left-2.5 top-2.5 pointer-events-none" />
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-[13px] text-[#4B5563] rounded-xl font-medium select-none">
              <Clock className="w-4 h-4 text-[#6B7280]" />
              Recents
            </div>
          </div>

          {/* Dynamic Recent Goals */}
          {recentGoals.length > 0 && (
            <div className="mb-6 flex-1 flex flex-col">
              <div className="space-y-1 overflow-y-auto max-h-[160px]">
                {recentGoals.map((goal) => (
                  <div
                    key={goal._id}
                    onClick={() => {
                      onSelectGoal(goal._id);
                      if (onCloseSidebar) onCloseSidebar();
                    }}
                    className="px-3 py-1.5 text-[13px] text-[#4B5563] hover:bg-[#EBEAE8] rounded-xl cursor-pointer transition font-medium truncate select-none leading-normal"
                    title={goal.title}
                  >
                    {goal.title}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Collapsed Mode */
        <div className="flex flex-col items-center flex-1 py-6 gap-6 animate-fade-in">
          {/* Toggle Button */}
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 hover:bg-[#EBEAE8] text-[#6B7280] hover:text-[#374151] rounded-xl transition cursor-pointer"
            title="Expand menu"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>

          {/* Plus action */}
          <button
            onClick={onSelectNewGoal}
            className="p-2 bg-white hover:bg-[#F3F2F0] border border-[#E1E0DD] hover:border-[#CDCBC7] text-[#6B7280] hover:text-[#374151] rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex items-center justify-center"
            title="New goal"
          >
            <PlusCircle className="w-5 h-5" />
          </button>

          {/* Search trigger */}
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 hover:bg-[#EBEAE8] text-[#6B7280] hover:text-[#374151] rounded-xl transition cursor-pointer flex items-center justify-center"
            title="Search goals"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Recent Goals trigger */}
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 hover:bg-[#EBEAE8] text-[#6B7280] hover:text-[#374151] rounded-xl transition cursor-pointer flex items-center justify-center"
            title="Recent goals"
          >
            <Clock className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}

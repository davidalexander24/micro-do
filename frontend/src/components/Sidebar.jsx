import React from 'react';
import { PlusCircle, Search, Clock, MessageSquare, Briefcase, Code, MoreHorizontal } from 'lucide-react';

export default function Sidebar({ goals, onSelectNewGoal, onSelectGoal, searchQuery, setSearchQuery }) {
  // Extract latest 5 recent goals
  const recentGoals = goals.slice(0, 5);

  return (
    <div className="w-full h-full flex flex-col justify-between font-sans text-[#374151] select-none flex-shrink-0 bg-[#F9F9F8]">

      {/* Top Part */}
      <div className="flex flex-col flex-1 overflow-y-auto px-4 py-6">
        {/* Brand/Logo */}
        <div className="flex items-center gap-2 mb-6 px-2">
          <h1 className="text-xl font-serif tracking-tight text-[#1F2937]">MicroDo</h1>
        </div>

        {/* Action Button: New Goal */}
        <button
          onClick={onSelectNewGoal}
          className="flex items-center justify-between bg-white border border-[#E1E0DD] hover:border-[#D1D0CC] hover:bg-[#F3F2F0] text-[#1F2937] font-medium px-4 py-2.5 rounded-xl shadow-sm transition mb-6 select-none cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <PlusCircle className="w-4.5 h-4.5 text-[#6B7280]" />
            <span className="text-[14px]">New goal</span>
          </div>
        </button>

        {/* Primary Links */}
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
          <div className="flex items-center gap-3 px-3 py-2 text-[13px] text-[#4B5563] hover:bg-[#EBEAE8] rounded-xl cursor-pointer transition font-medium select-none">
            <Clock className="w-4 h-4 text-[#6B7280]" />
            Recents
          </div>
        </div>

        {/* Dynamic Recent Goals */}
        {recentGoals.length > 0 && (
          <div className="mb-6 flex-1 flex flex-col">
            <span className="text-[11px] font-bold tracking-wider text-[#9CA3AF] uppercase px-3 mb-2 block select-none">Recents</span>
            <div className="space-y-1 overflow-y-auto max-h-[160px]">
              {recentGoals.map((goal) => (
                <div
                  key={goal._id}
                  onClick={() => onSelectGoal(goal._id)}
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

    </div>
  );
}

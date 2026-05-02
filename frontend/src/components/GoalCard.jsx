import React from 'react';
import { Trash, CheckSquare, Square } from 'lucide-react';

export default function GoalCard({ goal, onToggleStep, onDeleteGoal }) {
  const completedCount = goal.steps.filter((s) => s.isCompleted).length;
  const totalCount = goal.steps.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white border border-[#EBEAE8] rounded-2xl p-5 hover:shadow-md transition duration-300 font-sans select-none flex flex-col justify-between hover:border-[#CDCBC7]">
      
      {/* Card Header: Title & Delete */}
      <div className="flex justify-between items-start gap-3 mb-4">
        <h3 className="text-[16px] font-bold text-[#1F2937] break-words flex-1 leading-normal">
          {goal.title}
        </h3>
        <button
          onClick={() => onDeleteGoal(goal._id)}
          className="p-1.5 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#FEE2E2]/60 rounded-xl transition duration-150 flex-shrink-0 cursor-pointer"
          title="Delete goal"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>

      {/* Checklist / steps */}
      <div className="space-y-2 mb-4 flex-1">
        {goal.steps.map((step) => {
          const isDone = step.isCompleted;
          return (
            <div
              key={step._id}
              onClick={() => onToggleStep(goal._id, step._id)}
              className="flex items-start gap-3 p-2 hover:bg-[#F9FAFB] rounded-xl cursor-pointer transition duration-150 select-none border border-transparent"
            >
              <div className="mt-0.5 flex-shrink-0 select-none">
                {isDone ? (
                  <CheckSquare className="w-4.5 h-4.5 text-[#D97706] transition duration-200" />
                ) : (
                  <Square className="w-4.5 h-4.5 text-[#9CA3AF] hover:text-[#6B7280] transition duration-200" />
                )}
              </div>
              <span
                className={`text-[13.5px] font-normal leading-relaxed break-words flex-1 transition duration-200 ${
                  isDone ? 'line-through text-[#9CA3AF]' : 'text-[#374151]'
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Card Footer: Progress tracker & status */}
      <div className="pt-3 border-t border-[#F3F2F0] flex items-center justify-between text-xs text-[#9CA3AF] font-medium">
        <div className="flex items-center gap-3">
          <div className="w-20 bg-[#F3F2F0] h-1 rounded-full overflow-hidden">
            <div
              className="bg-[#D97706] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <span>{progressPercent}% done</span>
        </div>
        <span>{completedCount} of {totalCount}</span>
      </div>
    </div>
  );
}

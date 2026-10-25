import React, { useState } from 'react';
import { Trash, CheckSquare, Square, Sparkles } from 'lucide-react';

// Matches the backend limit: step -> sub-step -> micro-step
const MAX_DEPTH = 2;

export default function GoalCard({ goal, onToggleStep, onDeleteGoal, onBreakDownStep }) {
  const [breakingId, setBreakingId] = useState(null);

  const childrenOf = (id) => goal.steps.filter((s) => (s.parentId ?? null) === id);

  // Progress counts the smallest steps, so breaking a step down never inflates it
  const leaves = goal.steps.filter((s) => childrenOf(s._id).length === 0);
  const completedCount = leaves.filter((s) => s.isCompleted).length;
  const totalCount = leaves.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const breakDown = async (e, stepId) => {
    e.stopPropagation();
    setBreakingId(stepId);
    await onBreakDownStep(goal._id, stepId);
    setBreakingId(null);
  };

  const renderSteps = (parentId) =>
    childrenOf(parentId).map((step) => {
      const isDone = step.isCompleted;
      const hasChildren = childrenOf(step._id).length > 0;
      const isBreaking = breakingId === step._id;
      const canBreakDown = !hasChildren && !isDone && (step.depth ?? 0) < MAX_DEPTH;

      return (
        <div key={step._id} className="animate-fade-in">
          <div
            onClick={() => onToggleStep(goal._id, step._id)}
            className="group flex items-start gap-3 p-2 hover:bg-[#F9FAFB] rounded-xl cursor-pointer transition duration-150 select-none border border-transparent"
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
            {canBreakDown && (
              <button
                type="button"
                onClick={(e) => breakDown(e, step._id)}
                disabled={breakingId !== null}
                title="Break this step down further"
                className={`flex-shrink-0 flex items-center gap-1 mt-0.5 px-2 py-0.5 text-[11.5px] font-medium text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] hover:bg-[#FEF3C7] rounded-lg transition duration-150 cursor-pointer disabled:cursor-wait ${
                  isBreaking ? 'opacity-100' : 'sm:opacity-0 sm:group-hover:opacity-100'
                }`}
              >
                {isBreaking ? (
                  <div className="w-3 h-3 border-[1.5px] border-[#D97706] border-t-transparent border-solid rounded-full animate-spin"></div>
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                <span>{isBreaking ? 'Breaking down' : 'Break down'}</span>
              </button>
            )}
          </div>

          {(hasChildren || isBreaking) && (
            <div className="ml-4 pl-3 border-l-2 border-[#F3F2F0] space-y-1">
              {renderSteps(step._id)}
              {isBreaking &&
                [70, 85, 55].map((w) => (
                  <div key={w} className="flex items-center gap-3 p-2 animate-pulse">
                    <div className="w-4 h-4 rounded bg-[#F3F2F0] flex-shrink-0"></div>
                    <div className="h-3 rounded bg-[#F3F2F0]" style={{ width: `${w}%` }}></div>
                  </div>
                ))}
            </div>
          )}
        </div>
      );
    });

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

      {/* Checklist / steps, nested under the step they were broken down from */}
      <div className="space-y-1 mb-4 flex-1">
        {renderSteps(null)}
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

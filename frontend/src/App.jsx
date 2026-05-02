import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';
import GoalForm from './components/GoalForm';
import GoalCard from './components/GoalCard';
import { AlertTriangle, Sparkles } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function App() {
  const [goals, setGoals] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const formRef = React.useRef(null);

  const fetchGoals = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE_URL}/api/goals`);
      if (!res.ok) {
        throw new Error('Could not retrieve existing goals');
      }
      const data = await res.json();
      setGoals(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load goals. Is the backend server running locally?');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  // Add a new goal (calls the AI endpoint)
  const addGoal = async (title, useAI = true) => {
    try {
      setIsGenerating(true);
      setError(null);

      const res = await fetch(`${API_BASE_URL}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, useAI }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate goal');
      }

      const newGoal = await res.json();
      setGoals((prev) => [newGoal, ...prev]);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error occurred while generating goal.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Toggle a step's isCompleted status
  const toggleStep = async (goalId, stepId) => {
    try {
      setGoals((prevGoals) =>
        prevGoals.map((goal) => {
          if (goal._id !== goalId) return goal;
          return {
            ...goal,
            steps: goal.steps.map((step) => {
              if (step._id !== stepId) return step;
              return { ...step, isCompleted: !step.isCompleted };
            }),
          };
        })
      );

      const res = await fetch(`${API_BASE_URL}/api/goals/${goalId}/steps/${stepId}`, {
        method: 'PATCH',
      });

      if (!res.ok) {
        throw new Error('Failed to update micro-step status');
      }

      const updatedGoal = await res.json();
      setGoals((prevGoals) =>
        prevGoals.map((g) => (g._id === goalId ? updatedGoal : g))
      );
    } catch (err) {
      console.error(err);
      setError('Failed to update the step. Please try again.');
      fetchGoals();
    }
  };

  // Delete a goal
  const deleteGoal = async (id) => {
    try {
      setGoals((prevGoals) => prevGoals.filter((g) => g._id !== id));

      const res = await fetch(`${API_BASE_URL}/api/goals/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete the goal');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete the goal. Please try again.');
      fetchGoals();
    }
  };

  return (
    <Layout
      sidebar={
        <Sidebar
          goals={goals}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onSelectNewGoal={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (formRef.current) formRef.current.focus();
          }}
          onSelectGoal={(id) => {
            const el = document.getElementById(`goal-${id}`);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      }
    >
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 flex flex-col justify-between select-none">
        <div>
          {/* Header */}
          <div className="flex items-center gap-2 mb-8 select-none justify-center">
            <h2 className="text-3xl sm:text-4xl font-serif tracking-tight text-[#1F2937] leading-tight">
              MicroDo <span className="text-[#9CA3AF] font-normal font-sans">/</span> <span className="italic font-normal text-[#4B5563]">Set big goals.</span>
            </h2>
          </div>

          {/* Goal Input form */}
          <GoalForm ref={formRef} onAddGoal={addGoal} isGenerating={isGenerating} />

          {/* Prompt Empty Suggested */}
          {goals.length === 0 && !isGenerating && (
            <div className="max-w-2xl mx-auto mb-12 text-center select-none">
              <p className="text-gray-400 text-[13px] mb-6 leading-relaxed mx-auto">
                Start by adding a large, complex goal above. Our AI will instantly break it down into highly actionable steps.
              </p>
              <p className="text-[13px] font-medium text-[#6B7280] mb-3">Or try a suggestion:</p>
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {[
                  'Learn React and Next.js in a month',
                  'Plan a 3-day mountain hiking trip',
                  'Help me study for my Database Systems exam',
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addGoal(s)}
                    className="bg-white border border-[#E1E0DD] hover:border-[#CDCBC7] hover:bg-[#F9FAFB] text-[#4B5563] text-[13.5px] px-3.5 py-2 rounded-xl shadow-sm transition cursor-pointer select-none"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Informative generating overlay */}
          {isGenerating && (
            <div className="max-w-xl mx-auto mb-10 p-5 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl flex items-start gap-3.5 select-none animate-pulse">
              <div className="w-4 h-4 mt-0.5 border-2 border-[#D97706] border-t-transparent border-solid rounded-full animate-spin flex-shrink-0"></div>
              <div>
                <p className="text-[13.5px] font-bold text-[#92400E] mb-0.5 leading-normal">
                  Breaking down your goal...
                </p>
                <p className="text-xs text-[#B45309] font-medium leading-relaxed">
                  Our smart AI is now instantly breaking this down into micro-steps.
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="max-w-xl mx-auto mb-10 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl flex items-start gap-3.5 select-none animate-fade-in">
              <AlertTriangle className="w-5 h-5 text-[#EF4444] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13.5px] font-bold text-[#991B1B] mb-0.5 leading-normal">
                  An error occurred
                </p>
                <p className="text-xs text-[#B91C1C] font-medium leading-relaxed">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* Loading status */}
          {isLoading ? (
            <div className="text-center py-20 flex flex-col items-center justify-center gap-4">
              <div className="w-7 h-7 border-2 border-[#D97706] border-t-transparent border-solid rounded-full animate-spin"></div>
              <p className="text-[13px] text-[#6B7280] font-medium tracking-wide">
                Retrieving tracked goals...
              </p>
            </div>
          ) : (
            /* Goal Cards Grid List */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8 select-none">
              {goals.filter(g => g.title.toLowerCase().includes(searchQuery.toLowerCase())).map((goal) => (
                <div id={`goal-${goal._id}`} key={goal._id}>
                  <GoalCard
                    goal={goal}
                    onToggleStep={toggleStep}
                    onDeleteGoal={deleteGoal}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info */}
        <footer className="mt-16 text-center text-[12px] text-[#9CA3AF] font-medium border-t border-[#F3F2F0] pt-6 select-none flex justify-center items-center gap-4">
          <p>© MicroDo. All rights reserved.</p>
        </footer>
      </div>
    </Layout>
  );
}

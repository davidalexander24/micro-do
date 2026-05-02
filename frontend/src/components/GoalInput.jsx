import React, { useState } from 'react';
import { PlusCircle, Sparkles } from 'lucide-react';

export default function GoalInput({ onAddGoal, isGenerating }) {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || isGenerating) return;
    onAddGoal(title.trim());
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto mb-10">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-75 transition duration-1000 group-focus-within:opacity-100"></div>
        <div className="relative flex items-center bg-[#161b22]/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-2 transition duration-200">
          <input
            type="text"
            placeholder="What large goal do you want to break down? (e.g. Learn React in a week)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isGenerating}
            className="flex-1 bg-transparent border-0 px-4 py-3 text-lg font-medium placeholder-gray-500 focus:ring-0 focus:outline-none text-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!title.trim() || isGenerating}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 disabled:hover:shadow-none transition duration-200 select-none disabled:cursor-not-allowed text-base whitespace-nowrap"
          >
            {isGenerating ? (
              <>
                <Sparkles className="w-5 h-5 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                <span>Break Down</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

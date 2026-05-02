import React, { useState, forwardRef } from 'react';
import { Mic, Paperclip, ArrowUp, Sparkles } from 'lucide-react';

const GoalForm = forwardRef(({ onAddGoal, isGenerating }, ref) => {
  const [title, setTitle] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported by your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setTitle((prev) => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || isGenerating) return;
    onAddGoal(title.trim(), useAI);
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mb-12 select-none">
      <div className="bg-[#FFFFFF] border border-[#E1E0DD] hover:border-[#CDCBC7] focus-within:border-[#B1AFA9] rounded-2xl p-3 shadow-sm focus-within:shadow-md transition duration-200">
        <textarea
          ref={ref}
          placeholder="What large goal do you want to break down?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isGenerating}
          rows={3}
          className="w-full border-0 bg-transparent px-3 py-1 text-[15px] leading-relaxed text-[#1F2937] placeholder-[#9CA3AF] focus:ring-0 focus:outline-none resize-none disabled:opacity-50 font-normal select-text"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        {/* Input Footer: Voice, Use AI, submit */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F3F2F0] px-1 select-none">
          {/*Voice Input*/}
          <div className="flex items-center gap-2 text-[#9CA3AF]">
            <button
              type="button"
              onClick={startListening}
              className={`p-1.5 rounded-lg transition ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'hover:bg-[#F3F2F0] hover:text-[#6B7280]'}`}
              title="Speak to enter goal"
            >
              <Mic className="w-4.5 h-4.5" />
            </button>
            <label className="flex items-center gap-1.5 text-[11px] font-medium text-[#6B7280] cursor-pointer bg-[#F3F2F0] hover:bg-[#EBEAE8] px-2.5 py-1 rounded-lg border border-[#E1E0DD] select-none transition">
              <input
                type="checkbox"
                checked={useAI}
                onChange={(e) => setUseAI(e.target.checked)}
                className="w-3 h-3 accent-[#D97706] rounded cursor-pointer"
              />
              Use MicroDo AI
              <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!title.trim() || isGenerating}
            className="p-2.5 bg-[#D97706] hover:bg-[#B45309] disabled:bg-[#F3F2F0] disabled:text-[#9CA3AF] text-white rounded-xl shadow-sm hover:shadow-md transition duration-200 select-none flex-shrink-0 cursor-pointer disabled:cursor-not-allowed"
            title="Submit goal"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent border-solid rounded-full animate-spin"></div>
            ) : (
              <ArrowUp className="w-4.5 h-4.5 font-bold" />
            )}
          </button>
        </div>
      </div>
    </form>
  );
});

export default GoalForm;

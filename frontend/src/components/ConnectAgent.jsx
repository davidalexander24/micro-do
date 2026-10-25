import React, { useState, useEffect } from 'react';
import { Bot, X, Copy, Check } from 'lucide-react';

const TOOLS = ['list_goals', 'create_goal', 'break_down_step', 'set_step_completed', 'delete_goal'];

function CopyBlock({ label, text }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[12px] font-semibold text-[#4B5563]">{label}</p>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1 text-[11.5px] font-medium text-[#6B7280] hover:text-[#1F2937] px-2 py-0.5 rounded-lg hover:bg-[#F3F2F0] transition cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-[#1F2937] text-[#F3F4F6] text-[11.5px] leading-relaxed rounded-xl p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono select-text">
        {text}
      </pre>
    </div>
  );
}

export default function ConnectAgent({ clientId, mcpUrl }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  const claudeCommand = `claude mcp add --transport http microdo ${mcpUrl} --header "Authorization: Bearer ${clientId}"`;
  const jsonConfig = JSON.stringify(
    {
      mcpServers: {
        microdo: {
          type: 'http',
          url: mcpUrl,
          headers: { Authorization: `Bearer ${clientId}` },
        },
      },
    },
    null,
    2
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#6B7280] hover:text-[#1F2937] bg-white border border-[#E1E0DD] hover:border-[#CDCBC7] px-3 py-1.5 rounded-xl shadow-sm transition cursor-pointer select-none"
      >
        <Bot className="w-4 h-4 text-[#D97706]" />
        Connect an AI agent
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 font-sans select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#D97706]" />
                <h3 className="text-[17px] font-bold text-[#1F2937]">Connect an AI agent</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F2F0] rounded-xl transition cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[13px] text-[#4B5563] leading-relaxed mb-4">
              MicroDo runs a Model Context Protocol (MCP) server. Connect Claude Code or any MCP client and it can read
              and update the goals in this browser's list.
            </p>

            <div className="flex flex-wrap gap-1.5 mb-5">
              {TOOLS.map((t) => (
                <span key={t} className="text-[11px] font-mono text-[#92400E] bg-[#FFFBEB] border border-[#FDE68A] px-2 py-0.5 rounded-md">
                  {t}
                </span>
              ))}
            </div>

            <CopyBlock label="Claude Code" text={claudeCommand} />
            <CopyBlock label="Other MCP clients" text={jsonConfig} />

            <p className="text-[11.5px] text-[#9CA3AF] leading-relaxed">
              The key is this browser's private list id. Anyone with it can edit your list, so share it only with agents you trust.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

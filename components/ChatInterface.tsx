"use client";

import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import PlatformChip, { PLATFORMS, Platform } from "./PlatformChip";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const EXAMPLE_PROMPTS = [
  "My conversions aren't tracking in Google Ads",
  "Meta Pixel is firing but no events in Events Manager",
  "GTM preview shows tag firing but no data in GA4",
  "TikTok Pixel purchase event not recording",
  "LinkedIn Insight Tag not verified on my domain",
  "Enhanced conversions setup for Google Ads",
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(
    null
  );
  const [streamingContent, setStreamingContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    const fullContent = selectedPlatform
      ? `[Platform: ${selectedPlatform}] ${content}`
      : content;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: fullContent },
    ];

    setMessages(newMessages);
    setInput("");
    setStreamingContent("");
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamingContent(accumulated);
      }

      setMessages([
        ...newMessages,
        { role: "assistant", content: accumulated },
      ]);
      setStreamingContent("");
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content:
            "Something went wrong connecting to the AI. Please check your API key and try again.",
        },
      ]);
      setStreamingContent("");
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function togglePlatform(p: Platform) {
    setSelectedPlatform((prev) => (prev === p ? null : p));
  }

  const isEmpty = messages.length === 0 && !streamingContent;

  return (
    <div className="flex flex-col h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-white">
            Tracking Troubleshootr
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Paid media tracking diagnostics
          </p>
        </div>
        <div className="text-xs text-zinc-600 uppercase tracking-widest">
          AI-powered
        </div>
      </header>

      {/* Platform filter */}
      <div className="border-b border-zinc-800 px-6 py-3 flex gap-2 flex-wrap shrink-0">
        {PLATFORMS.map((p) => (
          <PlatformChip
            key={p}
            platform={p}
            selected={selectedPlatform === p}
            onClick={() => togglePlatform(p)}
          />
        ))}
        {selectedPlatform && (
          <button
            onClick={() => setSelectedPlatform(null)}
            className="px-3 py-1 text-xs font-mono text-zinc-600 hover:text-zinc-300 transition-colors"
          >
            clear ×
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty ? (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <p className="text-2xl font-bold text-white mb-2">
                What&apos;s not tracking?
              </p>
              <p className="text-zinc-500 text-sm">
                Describe your issue and get a step-by-step diagnosis. Select a
                platform above to focus the analysis.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-4 py-3 border border-zinc-800 text-zinc-400 text-xs hover:border-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
            {streamingContent && (
              <ChatMessage
                role="assistant"
                content={streamingContent}
                isStreaming
              />
            )}
            {isLoading && !streamingContent && (
              <div className="flex justify-start">
                <div className="text-zinc-600 text-xs font-mono animate-pulse">
                  analysing...
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 px-6 py-4 shrink-0">
        <div className="max-w-2xl mx-auto">
          {selectedPlatform && (
            <div className="mb-2 text-xs text-zinc-600">
              Focused on{" "}
              <span className="text-zinc-400">{selectedPlatform}</span>
            </div>
          )}
          <div className="flex gap-3 items-end border border-zinc-700 focus-within:border-zinc-400 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Describe your tracking issue..."
              rows={1}
              className="flex-1 bg-transparent text-white text-sm font-mono px-4 py-3 resize-none outline-none placeholder-zinc-600 min-h-[48px]"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 text-xs font-mono uppercase tracking-widest text-black bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 transition-colors shrink-0"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
          <p className="text-xs text-zinc-700 mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}

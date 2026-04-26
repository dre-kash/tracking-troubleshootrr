"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function ChatMessage({
  role,
  content,
  isStreaming,
}: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-white text-black px-4 py-3 font-mono text-sm border border-white">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] w-full">
        <div className="text-xs font-mono text-zinc-500 mb-2 uppercase tracking-widest">
          diagnostic
        </div>
        <div className="border border-zinc-800 px-5 py-4 font-mono text-sm text-zinc-100 prose-invert">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p className="mb-3 last:mb-0 text-zinc-200 leading-relaxed">
                  {children}
                </p>
              ),
              strong: ({ children }) => (
                <strong className="text-white font-bold">{children}</strong>
              ),
              ul: ({ children }) => (
                <ul className="mb-3 space-y-1 list-none pl-0">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-3 space-y-2 list-none pl-0 counter-reset-item">
                  {children}
                </ol>
              ),
              li: ({ children, ...props }) => {
                const isOrdered =
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (props as any).node?.parent?.type === "list" &&
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (props as any).node?.parent?.ordered;
                return (
                  <li className="flex gap-2 text-zinc-300">
                    <span className="text-zinc-500 shrink-0 mt-0.5">
                      {isOrdered ? "›" : "–"}
                    </span>
                    <span>{children}</span>
                  </li>
                );
              },
              code: ({ children, className }) => {
                const isBlock = className?.includes("language-");
                if (isBlock) {
                  return (
                    <div className="my-3 bg-zinc-900 border border-zinc-700 p-3 overflow-x-auto">
                      <code className="text-green-400 text-xs font-mono">
                        {children}
                      </code>
                    </div>
                  );
                }
                return (
                  <code className="bg-zinc-900 text-green-400 px-1.5 py-0.5 text-xs font-mono border border-zinc-700">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => <>{children}</>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-yellow-500 pl-4 my-3 text-yellow-200">
                  {children}
                </blockquote>
              ),
              h1: ({ children }) => (
                <h1 className="text-white font-bold text-base mb-3 mt-4 uppercase tracking-wide border-b border-zinc-700 pb-2">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-white font-bold text-sm mb-2 mt-4 uppercase tracking-wide">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-zinc-300 font-bold text-sm mb-2 mt-3">
                  {children}
                </h3>
              ),
              hr: () => <hr className="border-zinc-800 my-4" />,
            }}
          >
            {content}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-white ml-1 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

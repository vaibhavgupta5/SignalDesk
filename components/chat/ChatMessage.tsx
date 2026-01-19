"use client";

import { Avatar } from "@/components/ui/avatar";
import { formatMessageTime, formatFileSize, getFileIcon } from "@/lib/format";
import { Message } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface ChatMessageProps {
  message: Message;
  showAvatar?: boolean;
}

export function ChatMessage({ message, showAvatar = true }: ChatMessageProps) {
  const { user } = useAuthStore();
  const isOwnMessage = user?.id === message.userId;

  return (
    <div
      className={cn(
        "flex gap-4 px-6 py-2 transition-all-smooth hover:bg-base-surface/50 group",
        {
          "py-1": !showAvatar,
          "mt-2": showAvatar,
        },
      )}
    >
      {showAvatar ? (
        <Avatar
          src={message.userAvatar}
          alt={message.userName}
          fallback={message.userName.charAt(0)}
          className="w-9 h-9 mt-0.5 rounded-md"
        />
      ) : (
        <div className="w-9" />
      )}

      <div className="flex-1 min-w-0 overflow-hidden">
        {showAvatar && message.type !== "system" && (
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-gray-200 font-bold text-sm tracking-tight">
              {message.userName}
            </span>
            <span className="text-gray-500 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity">
              {formatMessageTime(message.createdAt)}
            </span>
          </div>
        )}

        {message.type === "system" ? (
          <div className="flex items-center justify-center w-full py-1">
            <span className="bg-white/5 text-gray-400 text-xs px-3 py-1 rounded-full border border-white/5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {message.content}
            </span>
          </div>
        ) : null}

        {message.type === "text" && (
          <div className="text-text-primary text-[15px] leading-relaxed break-words markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      {...props}
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg !my-2 !bg-[#1E1E1E] border border-base-border text-sm"
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      {...props}
                      className={cn(
                        "bg-base-hover px-1.5 py-0.5 rounded text-sm text-accent font-mono",
                        className,
                      )}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => (
                  <p className="mb-1 last:mb-0">{children}</p>
                ),
                a: ({ children, href }) => (
                  <a
                    href={href}
                    className="text-accent hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {children}
                  </a>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-2">{children}</ol>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {message.type === "image" && message.fileUrl && (
          <div className="mt-1">
            <img
              src={message.fileUrl}
              alt="Shared image"
              className="max-w-md max-h-96 rounded-lg border border-base-border shadow-sm"
            />
            {message.content && (
              <p className="text-text-primary text-sm mt-2 whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        )}

        {message.type === "file" && message.fileUrl && (
          <div className="mt-1">
            <a
              href={message.fileUrl}
              download={message.fileName || "download"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-4 py-3 bg-base-surface border border-base-border rounded-lg hover:border-accent transition-all-smooth group/file"
            >
              <span className="text-2xl group-hover/file:scale-110 transition-transform">
                {getFileIcon(message.fileName || "")}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-sm font-medium truncate">
                  {message.fileName}
                </p>
                {message.fileSize && (
                  <p className="text-text-muted text-xs">
                    {formatFileSize(message.fileSize)}
                  </p>
                )}
              </div>
            </a>
            {message.content && (
              <p className="text-text-primary text-sm mt-2 whitespace-pre-wrap break-words">
                {message.content}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

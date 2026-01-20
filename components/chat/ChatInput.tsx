"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, Send, X, Image as ImageIcon, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useGroupStore } from "@/store/groupStore";
import { useChatStore } from "@/store/chatStore";
import { socketClient } from "@/lib/socket";
import { messageAPI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { aiAPI, contextAPI } from "@/lib/api";
import {
  CheckCircle2,
  ClipboardCheck,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  Layers,
  MessageCircle,
} from "lucide-react";

export function ChatInput() {
  const { user } = useAuthStore();
  const { activeGroupId } = useGroupStore();
  const { setAIProcessing } = useChatStore();
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [showCommands, setShowCommands] = useState(false);
  const [commandIndex, setCommandIndex] = useState(0);

  const COMMANDS = [
    {
      id: "DECISION",
      label: "Decision",
      icon: CheckCircle2,
      desc: "Search through decisions",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
    },
    {
      id: "ACTION",
      label: "Action",
      icon: ClipboardCheck,
      desc: "Find action items",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
    },
    {
      id: "SUGGESTION",
      label: "Suggestion",
      icon: Lightbulb,
      desc: "Review suggestions",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      id: "QUESTION",
      label: "Question",
      icon: HelpCircle,
      desc: "Check unanswered questions",
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      id: "CONSTRAINT",
      label: "Constraint",
      icon: AlertCircle,
      desc: "Look for constraints",
      color: "text-rose-400",
      bg: "bg-rose-400/10",
    },
    {
      id: "ASSUMPTION",
      label: "Assumption",
      icon: Layers,
      desc: "Identify assumptions",
      color: "text-indigo-400",
      bg: "bg-indigo-400/10",
    },
    {
      id: "OTHER",
      label: "Other",
      icon: MessageCircle,
      desc: "General search",
      color: "text-gray-400",
      bg: "bg-gray-400/10",
    },
  ];

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  useEffect(() => {
    const handleSignalsUpdated = (data: {
      count: number;
      message: string;
      groupId: string;
    }) => {
      // Only show notification if it's for the current group
      if (data.groupId === activeGroupId) {
        toast.success(data.message, {
          description: "AI analysis results saved directly to messages",
          duration: 4000,
        });
      }
    };

    socketClient.on("signals-updated", handleSignalsUpdated);
    return () => {
      socketClient.off("signals-updated", handleSignalsUpdated);
    };
  }, [activeGroupId]);

  const handleTyping = () => {
    if (!activeGroupId) return;

    socketClient.sendTyping(activeGroupId, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketClient.sendTyping(activeGroupId, false);
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCodeFormat = () => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = message;
    const selected = text.substring(start, end);

    let replacement = `\`${selected}\``;
    let cursorOffset = 1;

    if (selected.includes("\n") || (start === text.length && !selected)) {
      replacement = `\`\`\`\n${selected}\n\`\`\``;
      cursorOffset = 4; // ` ` ` \n |
      if (selected) cursorOffset += selected.length + 1;
    }

    const newText =
      text.substring(0, start) + replacement + text.substring(end);
    setMessage(newText);

    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        start + cursorOffset,
        start + cursorOffset,
      );
    }, 0);
  };

  const handleSend = async () => {
    if (!activeGroupId || !user) return;
    const trimmedMessage = message.trim();
    if (!trimmedMessage && !file) return;

    // Detect slash command
    if (trimmedMessage.startsWith("/") && !file) {
      const parts = trimmedMessage.split(" ");
      const cmd = parts[0].slice(1).toUpperCase();
      const query = parts.slice(1).join(" ");

      const matchedCmd = COMMANDS.find((c) => c.id === cmd);
      if (matchedCmd) {
        try {
          setIsUploading(true);
          setAIProcessing(activeGroupId, true);
          socketClient.emit("ai-thinking", {
            groupId: activeGroupId,
            isThinking: true,
          });

          setMessage(""); // Clear input
          setShowCommands(false);

          // 1. Fetch ALL contexts for this category in THIS group
          const contextRes = await contextAPI.getAll({
            category: matchedCmd.id,
            groupId: activeGroupId,
            // limit: 10, // Removed limit to fetch all available context
          });

          const historyMessages = contextRes.data.contexts.map((ctx: any) => ({
            user: ctx.userId?.name || "Member",
            message: ctx.content,
            timestamp: ctx.classifiedAt,
          }));

          if (historyMessages.length === 0) {
            socketClient.emit("send-system-message", {
              groupId: activeGroupId,
              userName: "signalDesk",
              content: `I couldn't find any prior ${matchedCmd.label.toLowerCase()}s in this group to analyze. Try chatting more!`,
            });
            return;
          }

          // 2. Call AI Ask API with the explicit query
          const aiRes = await aiAPI.ask(matchedCmd.id, historyMessages, query);
          const { items, ai_insight } = aiRes.data;

          // 3. Construct AI Reply with better structure
          let replyContent = `### 🤖 signalDesk Analysis\n`;

          if (query) {
            replyContent += `**Query:** *"${query}"*\n`;
          }

          replyContent += `\n---\n\n`;

          if (ai_insight) {
            replyContent += `#### 💡 Strategic Insight\n${ai_insight}\n\n`;
          }

          if (items && items.length > 0) {
            replyContent += `---\n\n#### 🔍 Reference ${matchedCmd.label}s\n`;
            items.slice(0, 3).forEach((item: any) => {
              replyContent += `* **"${item.text}"** — *${item.user}*\n`;
            });
          }

          replyContent += `\n\n> *Analysis based on latest ${historyMessages.length} signals*`;

          // 4. Send as an AI message via socket (broadcast and save)
          socketClient.emit("send-system-message", {
            groupId: activeGroupId,
            userName: "signalDesk",
            content: replyContent,
          });

          return;
        } catch (error) {
          console.error("AI Ask error:", error);
          toast.error("AI service error. Please try again later.");
        } finally {
          setIsUploading(false);
          setAIProcessing(activeGroupId, false);
          socketClient.emit("ai-thinking", {
            groupId: activeGroupId,
            isThinking: false,
          });
          return;
        }
      }
    }

    try {
      setIsUploading(true);

      let fileUrl = "";
      let fileName = "";
      let fileSize = 0;
      let messageType: "text" | "image" | "file" = "text";

      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert("File is too large. Maximum size is 10MB.");
          return;
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        fileUrl = base64;
        fileName = file.name;
        fileSize = file.size;
        messageType = file.type.startsWith("image/") ? "image" : "file";
      }

      const messageData = {
        content: trimmedMessage,
        type: messageType,
        fileUrl,
        fileName,
        fileSize,
      };

      socketClient.sendMessage(activeGroupId, messageData);

      setMessage("");
      clearFile();
      socketClient.sendTyping(activeGroupId, false);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showCommands) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCommandIndex((prev) => (prev + 1) % COMMANDS.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCommandIndex(
          (prev) => (prev - 1 + COMMANDS.length) % COMMANDS.length,
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const cmd = COMMANDS[commandIndex];
        setMessage(`/${cmd.id} `);
        setShowCommands(false);
      } else if (e.key === "Escape") {
        setShowCommands(false);
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredCommands = message.startsWith("/")
    ? COMMANDS.filter(
        (cmd) =>
          cmd.label
            .toLowerCase()
            .includes(message.slice(1).split(" ")[0].toLowerCase()) ||
          cmd.id
            .toLowerCase()
            .includes(message.slice(1).split(" ")[0].toLowerCase()),
      )
    : [];

  useEffect(() => {
    setCommandIndex(0);
  }, [filteredCommands.length]);

  if (!activeGroupId) {
    return null;
  }

  return (
    <div className="p-5 bg-[#111114] border-t border-white/5 relative">
      {/* File Previews */}
      {filePreview && (
        <div className="mb-4 relative inline-block group">
          <img
            src={filePreview || undefined}
            alt="Preview"
            className="max-h-48 rounded-lg border border-white/10 shadow-lg"
          />
          <button
            onClick={clearFile}
            className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-all shadow-md"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Command Suggestions */}
      {showCommands && filteredCommands.length > 0 && (
        <div className="absolute bottom-full left-5 mb-4 w-72 bg-[#1a1a1d]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
              Commands
            </span>
            <span className="text-[9px] text-gray-500 font-medium px-1.5 py-0.5 rounded border border-white/5 bg-white/5">
              ESC to close
            </span>
          </div>
          <div className="max-h-80 overflow-y-auto py-2 no-scrollbar">
            {filteredCommands.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isActive = idx === commandIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    setMessage(`/${cmd.id} `);
                    setShowCommands(false);
                    textareaRef.current?.focus();
                  }}
                  onMouseEnter={() => setCommandIndex(idx)}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-4 py-2.5 transition-all duration-200 text-left relative group",
                    isActive
                      ? "bg-white/[0.04] border-l-2 border-accent"
                      : "text-gray-400 hover:bg-white/[0.02] border-l-2 border-transparent",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 shadow-inner",
                      isActive
                        ? cn(cmd.bg, cmd.color, "scale-105")
                        : "bg-white/5 text-gray-500",
                    )}
                  >
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-sm font-bold transition-colors",
                          isActive ? "text-white" : "text-gray-300",
                        )}
                      >
                        /{cmd.label}
                      </span>
                      {isActive && (
                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-1">
                          <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                            TAB
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] truncate block mt-0.5 font-medium transition-colors",
                        isActive ? "text-gray-400" : "text-gray-500",
                      )}
                    >
                      {cmd.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {file && !filePreview && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-[#1a1a1d] border border-white/5 rounded-xl w-max shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5">
            <Paperclip size={20} className="text-accent" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-200 font-medium">
              {file!.name}
            </span>
            <span className="text-xs text-gray-500">
              {(file!.size / 1024).toFixed(0)} KB
            </span>
          </div>
          <button
            onClick={clearFile}
            className="ml-2 text-gray-500 hover:text-rose-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex items-end gap-2 bg-[#1a1a1d] border border-white/5 rounded-xl p-2 focus-within:ring-1 focus-within:ring-accent/50 focus-within:border-accent/40 transition-all duration-200 shadow-sm">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-2.5 text-gray-400 hover:text-gray-100 hover:bg-white/5 rounded-lg transition-all shrink-0"
          title="Attach file"
        >
          <Paperclip size={18} />
        </button>

        <button
          onClick={handleCodeFormat}
          disabled={isUploading}
          className="p-2.5 text-gray-400 hover:text-gray-100 hover:bg-white/5 rounded-lg transition-all shrink-0"
          title="Format as code"
        >
          <Code size={18} />
        </button>

        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            const val = e.target.value;
            setMessage(val);
            handleTyping();

            if (val.startsWith("/") && !val.includes(" ")) {
              setShowCommands(true);
              setCommandIndex(0);
            } else {
              setShowCommands(false);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${activeGroupId!.slice(-4)}`}
          className="
    flex-1 max-h-[300px] min-h-[24px]
    bg-transparent border-none
    ring-0 outline-none
    focus:outline-none focus:ring-0 focus:ring-offset-0
    focus-visible:outline-none focus-visible:ring-0
    text-gray-200 placeholder:text-gray-600
    resize-none py-2.5 text-sm leading-relaxed
    no-scrollbar
  "
          rows={1}
          disabled={isUploading}
        />

        <button
          onClick={handleSend}
          disabled={(!message.trim() && !file) || isUploading}
          className={cn(
            "p-2.5 rounded-lg transition-all duration-200 shrink-0",
            (!message.trim() && !file) || isUploading
              ? "text-gray-600 bg-transparent cursor-not-allowed"
              : "bg-accent text-white hover:bg-accent/90 shadow-md hover:shadow-lg active:scale-95",
          )}
          title="Send message"
        >
          <Send size={16} className={cn(isUploading && "animate-pulse")} />
        </button>
      </div>

      <div className="flex justify-between items-center mt-3 px-1">
        <p className="text-[10px] text-gray-500 font-medium">
          <span className="text-gray-400">Return</span> to send ·{" "}
          <span className="text-gray-400">Shift + Return</span> to new line
        </p>
      </div>
    </div>
  );
}

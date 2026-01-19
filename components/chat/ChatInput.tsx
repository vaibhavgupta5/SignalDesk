"use client";

import { useState, useRef, useEffect } from "react";
import { Paperclip, Send, X, Image as ImageIcon, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useGroupStore } from "@/store/groupStore";
import { socketClient } from "@/lib/socket";
import { messageAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ChatInput() {
  const { user } = useAuthStore();
  const { activeGroupId } = useGroupStore();
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

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
    if (!message.trim() && !file) return;

    try {
      setIsUploading(true);

      let fileUrl = "";
      let fileName = "";
      let fileSize = 0;
      let messageType: "text" | "image" | "file" = "text";

      if (file) {
        const uploadResponse = await messageAPI.uploadFile(file);
        fileUrl = uploadResponse.data.url;
        fileName = file.name;
        fileSize = file.size;
        messageType = file.type.startsWith("image/") ? "image" : "file";
      }

      const messageData = {
        content: message.trim(),
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!activeGroupId) {
    return null;
  }

  return (
    <div className="p-5 bg-[#111114] border-t border-white/5">
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
            setMessage(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${activeGroupId!.slice(-4)}`}
          className="flex-1 max-h-[300px] min-h-[24px] bg-transparent border-none ring-0 text-gray-200 placeholder:text-gray-600 resize-none py-2.5 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-white/10"
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

"use client";

import { useEffect, useRef, useState } from "react";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { ChatMessage } from "./ChatMessage";
import { useChatStore } from "@/store/chatStore";
import { useGroupStore } from "@/store/groupStore";
import { useAuthStore } from "@/store/authStore";
import { socketClient } from "@/lib/socket";
import { messageAPI } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function MessageList() {
  const { activeGroupId } = useGroupStore();
  const { messages, addMessage, setMessages, setTyping, typingUsers } =
    useChatStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const groupMessages = activeGroupId ? messages[activeGroupId] || [] : [];
  const groupTypingUsers = activeGroupId
    ? typingUsers[activeGroupId] || []
    : [];

  useEffect(() => {
    if (!activeGroupId) return;

    const loadMessages = async () => {
      try {
        setIsLoading(true);
        const response = await messageAPI.getByGroup(activeGroupId);
        setMessages(activeGroupId, response.data.messages);

        setTimeout(() => {
          virtuosoRef.current?.scrollToIndex({
            index: response.data.messages.length - 1,
            align: "end",
            behavior: "auto",
          });
        }, 100);
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
    socketClient.joinGroup(activeGroupId);

    const handleNewMessage = (message: any) => {
      if (message.groupId === activeGroupId) {
        addMessage(activeGroupId, message);
      }
    };

    const handleTyping = ({ groupId, userId, isTyping }: any) => {
      if (groupId === activeGroupId && userId !== user?.id) {
        setTyping(groupId, userId, isTyping);
      }
    };

    socketClient.on("new-message", handleNewMessage);
    socketClient.on("user-typing", handleTyping);

    return () => {
      socketClient.off("new-message", handleNewMessage);
      socketClient.off("user-typing", handleTyping);
      socketClient.leaveGroup(activeGroupId);
    };
  }, [activeGroupId]);

  if (!activeGroupId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0e0e11]">
        <div className="text-center">
          <p className="text-gray-400 text-lg mb-2 font-medium">
            Welcome to SignalDesk
          </p>
          <p className="text-gray-500 text-sm">
            Select a channel to start messaging
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0e0e11]">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0e0e11] flex flex-col">
      {groupMessages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in-50">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h3 className="text-gray-200 font-semibold text-lg mb-2">
            No messages yet
          </h3>
          <p className="text-gray-500 max-w-sm">
            Say hello to start the conversation! Or just say meow.
          </p>
        </div>
      ) : (
        <Virtuoso
          ref={virtuosoRef}
          data={groupMessages}
          itemContent={(index, message) => {
            const previousMessage = index > 0 ? groupMessages[index - 1] : null;
            const showAvatar =
              !previousMessage ||
              previousMessage.userId !== message.userId ||
              new Date(message.createdAt).getTime() -
                new Date(previousMessage.createdAt).getTime() >
                300000;

            return (
              <ChatMessage
                key={message._id}
                message={message}
                showAvatar={showAvatar}
              />
            );
          }}
          followOutput="smooth"
          alignToBottom
        />
      )}

      {groupTypingUsers.length > 0 && (
        <div className="px-6 py-2 text-text-muted text-sm">
          <span className="inline-flex items-center gap-1">
            <span className="animate-pulse">●</span>
            <span className="animate-pulse delay-150">●</span>
            <span className="animate-pulse delay-300">●</span>
            <span className="ml-2">Someone is typing...</span>
          </span>
        </div>
      )}
    </div>
  );
}

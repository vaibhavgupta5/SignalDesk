import { create } from "zustand";

export interface Message {
  _id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: "text" | "image" | "file" | "system";
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  createdAt: string;
}

interface ChatState {
  messages: Record<string, Message[]>;
  typingUsers: Record<string, string[]>;
  aiProcessing: Record<string, boolean>;

  addMessage: (groupId: string, message: Message) => void;
  setMessages: (groupId: string, messages: Message[]) => void;
  prependMessages: (groupId: string, messages: Message[]) => void;
  setTyping: (groupId: string, userId: string, isTyping: boolean) => void;
  setAIProcessing: (groupId: string, isProcessing: boolean) => void;
  clearMessages: (groupId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  typingUsers: {},
  aiProcessing: {},

  addMessage: (groupId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: [...(state.messages[groupId] || []), message],
      },
    })),

  setMessages: (groupId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: messages,
      },
    })),

  prependMessages: (groupId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [groupId]: [...messages, ...(state.messages[groupId] || [])],
      },
    })),

  setTyping: (groupId, userId, isTyping) =>
    set((state) => {
      const currentTyping = state.typingUsers[groupId] || [];
      const newTyping = isTyping
        ? [...currentTyping.filter((id) => id !== userId), userId]
        : currentTyping.filter((id) => id !== userId);

      return {
        typingUsers: {
          ...state.typingUsers,
          [groupId]: newTyping,
        },
      };
    }),

  setAIProcessing: (groupId, isProcessing) =>
    set((state) => ({
      aiProcessing: {
        ...state.aiProcessing,
        [groupId]: isProcessing,
      },
    })),

  clearMessages: (groupId) =>
    set((state) => {
      const { [groupId]: _, ...rest } = state.messages;
      return { messages: rest };
    }),
}));

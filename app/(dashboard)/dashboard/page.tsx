"use client";

import { SidebarProjects } from "@/components/layout/SidebarProjects";
import { SidebarGroups } from "@/components/layout/SidebarGroups";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useEffect } from "react";
import { useUIStore } from "@/store/uiStore";

export default function DashboardPage() {
  const { accentColor } = useUIStore();

  // Ensure theme is applied on mount/refresh (backup to persist middleware)
  useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty("--accent-color", accentColor);
    }
  }, [accentColor]);

  return (
    <div className="h-screen flex overflow-hidden bg-base-bg text-text-primary font-sans selection:bg-accent selection:text-white">
      {/* Sidebars - Hidden on mobile, visible on medium+ screens */}
      <div className="hidden md:flex h-full">
        <SidebarProjects />
        <SidebarGroups />
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-base-bg relative">
        <ChatHeader />
        <MessageList />
        <ChatInput />
      </div>
    </div>
  );
}

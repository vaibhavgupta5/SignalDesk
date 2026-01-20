"use client";

import { useEffect, useState } from "react";
import { SidebarProjects } from "@/components/layout/SidebarProjects";
import { SidebarGroups } from "@/components/layout/SidebarGroups";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { contextAPI } from "@/lib/api";
import { useUIStore } from "@/store/uiStore";
import {
  CheckCircle2,
  MessageSquare,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  ClipboardCheck,
  Calendar,
  Layers,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { socketClient } from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { useGroupStore } from "@/store/groupStore";

interface ContextItem {
  _id: string;
  messageId: string;
  groupId: { _id: string; name: string };
  userId: { _id: string; name: string; avatar?: string };
  content: string;
  category: string[];
  confidence: { score: number; reason: string };
  classifiedAt: string;
}

const CATEGORIES = [
  {
    id: "DECISION",
    label: "Decisions",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    id: "ACTION",
    label: "Actions",
    icon: ClipboardCheck,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    id: "SUGGESTION",
    label: "Suggestions",
    icon: Lightbulb,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    id: "QUESTION",
    label: "Questions",
    icon: HelpCircle,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    id: "CONSTRAINT",
    label: "Constraints",
    icon: AlertCircle,
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
  {
    id: "ASSUMPTION",
    label: "Assumptions",
    icon: Layers,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
  },
];

export default function ContextStorePage() {
  const { accentColor } = useUIStore();
  const { activeGroupId } = useGroupStore();
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("DECISION");

  useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty("--accent-color", accentColor);
    }
  }, [accentColor]);

  const fetchContexts = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await contextAPI.getAll();
      setContexts(response.data.contexts);
      if (isManual) toast.success("Signals updated");
    } catch (error) {
      console.error("Failed to fetch context store:", error);
      if (isManual) toast.error("Failed to refresh signals");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContexts();
  }, []);

  const handleTestDummy = () => {
    socketClient.emit("debug:save-dummy-context", {
      groupId: activeGroupId,
      category: activeTab,
    });
    // The socket server will emit signals-updated,
    // but we can show a local toast too if we want.
    // However, the ChatInput already listens for signals-updated.
  };

  const filteredContexts = contexts.filter((ctx) =>
    ctx.category.some((c) => c.toUpperCase() === activeTab),
  );

  return (
    <div className="h-screen flex overflow-hidden bg-base-bg text-text-primary font-sans">
      <div className="hidden md:flex h-full">
        <SidebarProjects />
        <SidebarGroups />
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-base-bg relative overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0a0a0c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
              <ClipboardCheck className="text-accent" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Context Store
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                AI-extracted signals from your conversations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestDummy}
              className="hidden md:flex items-center gap-2 bg-white/5 border-white/10 hover:bg-white/10 text-xs h-9"
            >
              <Sparkles size={14} className="text-amber-400" />
              Test Signal
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchContexts(true)}
              disabled={refreshing}
              className={cn(
                "bg-white/5 border-white/10 hover:bg-white/10 h-9 w-9",
                refreshing && "animate-spin",
              )}
            >
              <RefreshCw size={16} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/5">
          <div className="max-w-5xl mx-auto">
            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-8 p-1.5 bg-black/20 rounded-2xl border border-white/5 w-fit">
              {CATEGORIES.map((cat) => {
                const isActive = activeTab === cat.id;
                const Icon = cat.icon;
                const count = contexts.filter((ctx) =>
                  ctx.category.some((c) => c.toUpperCase() === cat.id),
                ).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all duration-300 relative group",
                      isActive
                        ? "bg-accent text-white shadow-lg shadow-accent/20"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5",
                    )}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-semibold">{cat.label}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-md font-bold",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-white/10 text-gray-400 group-hover:bg-white/15",
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
                <p className="text-gray-500 animate-pulse font-medium">
                  Analyzing your signals...
                </p>
              </div>
            ) : filteredContexts.length > 0 ? (
              <div className="grid gap-4">
                {filteredContexts.map((ctx) => (
                  <div
                    key={ctx._id}
                    className="group bg-[#111114] border border-white/5 rounded-2xl p-5 hover:border-accent/30 hover:bg-[#15151a] transition-all duration-500 shadow-sm"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg",
                            CATEGORIES.find((c) => c.id === activeTab)?.bg,
                          )}
                        >
                          {(() => {
                            const Icon =
                              CATEGORIES.find((c) => c.id === activeTab)
                                ?.icon || MessageSquare;
                            return (
                              <Icon
                                className={
                                  CATEGORIES.find((c) => c.id === activeTab)
                                    ?.color
                                }
                                size={18}
                              />
                            );
                          })()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-accent uppercase tracking-widest">
                            {activeTab}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                            <span className="flex items-center gap-1">
                              <MessageSquare size={12} />
                              {ctx.groupId?.name || "Global Chat"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {ctx.userId?.avatar ? (
                                <img
                                  src={ctx.userId.avatar}
                                  alt={ctx.userId.name}
                                  className="w-3 h-3 rounded-full"
                                />
                              ) : (
                                <div className="w-3 h-3 rounded-full bg-accent/20 flex items-center justify-center text-[8px] font-bold text-accent">
                                  {ctx.userId?.name?.charAt(0) || "U"}
                                </div>
                              )}
                              {ctx.userId?.name || "Unknown"}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} />
                              {new Date(ctx.classifiedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent"
                            style={{
                              width: `${(ctx.confidence?.score || 0) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-gray-500">
                          {Math.round((ctx.confidence?.score || 0) * 100)}%
                          Match
                        </span>
                      </div>
                    </div>

                    <p className="text-[15px] text-gray-200 leading-relaxed font-medium mb-4">
                      {ctx.content}
                    </p>

                    {ctx.confidence?.reason && (
                      <div className="px-3 py-2 bg-black/30 rounded-lg border border-white/5">
                        <p className="text-[11px] text-gray-500 italic">
                          <span className="text-accent font-bold not-italic mr-1">
                            AI Insight:
                          </span>
                          {ctx.confidence.reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 rounded-3xl border border-dashed border-white/5 bg-black/10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                  <MessageSquare className="text-gray-600" size={32} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  No {activeTab.toLowerCase()} identified yet
                </h3>
                <p className="text-sm text-gray-500 max-w-xs text-center font-medium">
                  Keep chatting! SignalDesk AI will automatically extract key{" "}
                  {activeTab.toLowerCase()} as your team discusses.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

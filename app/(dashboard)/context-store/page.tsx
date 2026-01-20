"use client";

import { useEffect, useState } from "react";
import { SidebarProjects } from "@/components/layout/SidebarProjects";
import { SidebarGroups } from "@/components/layout/SidebarGroups";
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
  Loader2,
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
  },
  {
    id: "ACTION",
    label: "Actions",
  },
  {
    id: "SUGGESTION",
    label: "Suggestions",
  },
  {
    id: "QUESTION",
    label: "Questions",
  },
  {
    id: "CONSTRAINT",
    label: "Constraints",
  },
  {
    id: "ASSUMPTION",
    label: "Assumptions",
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
      if (isManual) toast.success("Refreshed");
    } catch (error) {
      console.error("Failed to fetch context store:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchContexts();
  }, []);

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
        {/* Minimalist Header */}
        <header className="h-16 flex items-center justify-between px-12 border-b border-base-border">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Context Store</h1>
            <p className="text-xs text-text-muted font-medium mt-0.5">
              AI-extracted conversation signals
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchContexts(true)}
              disabled={refreshing}
              className={cn(
                "hover:bg-base-surface h-9 w-9 text-text-muted transition-colors",
                refreshing && "animate-spin text-accent",
              )}
            >
              <RefreshCw size={16} />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar py-12 px-6">
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Category Navigation - Minimalist Tabs */}
            <div className="flex gap-8 border-b border-base-border pb-4">
              {CATEGORIES.map((cat) => {
                const isActive = activeTab === cat.id;
                const count = contexts.filter((ctx) =>
                  ctx.category.some((c) => c.toUpperCase() === cat.id),
                ).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={cn(
                      "text-sm font-bold tracking-tight transition-all relative pb-4",
                      isActive
                        ? "text-white"
                        : "text-text-muted hover:text-text-secondary",
                    )}
                  >
                    {cat.label}
                    {count > 0 && (
                      <span className="ml-2 text-[10px] text-accent opacity-60">
                        {count}
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content List */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="animate-spin text-accent" size={24} />
                <p className="text-xs text-text-muted uppercase tracking-[0.2em] font-bold">
                  Scanning Signals
                </p>
              </div>
            ) : filteredContexts.length > 0 ? (
              <div className="grid gap-8">
                {filteredContexts.map((ctx) => (
                  <div
                    key={ctx._id}
                    className="bg-base-surface border border-base-border p-10 shadow-xl group transition-all"
                  >
                    <div className="flex items-start justify-between mb-8">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
                            {activeTab}
                          </span>
                          <span className="h-4 w-px bg-base-border" />
                          <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                            {new Date(ctx.classifiedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {ctx.userId?.avatar ? (
                            <img
                              src={ctx.userId.avatar}
                              className="w-4 h-4 rounded-full opacity-60"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-accent/20" />
                          )}
                          <span className="text-xs font-bold text-text-muted">
                            {ctx.userId?.name || "System"}
                          </span>
                          <span className="text-xs text-text-muted opacity-40">
                            in
                          </span>
                          <span className="text-xs font-bold text-text-secondary underline decoration-base-border underline-offset-4">
                            {ctx.groupId?.name || "Global"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-white/40">
                          CONFIDENCE
                        </span>
                        <span className="text-xl font-bold text-white tracking-tighter">
                          {Math.round((ctx.confidence?.score || 0) * 100)}%
                        </span>
                      </div>
                    </div>

                    <p className="text-lg text-text-secondary leading-relaxed font-medium mb-10 decoration-accent/5 underline underline-offset-8">
                      {ctx.content}
                    </p>

                    {ctx.confidence?.reason && (
                      <div className="pt-8 border-t border-base-border/50">
                        <p className="text-xs text-text-muted italic leading-relaxed">
                          <span className="text-accent font-bold not-italic mr-2 uppercase tracking-tighter text-[10px]">
                            AI Context:
                          </span>
                          {ctx.confidence.reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 border border-base-border bg-base-surface/20">
                <MessageSquare className="text-text-muted mb-4" size={24} />
                <h3 className="text-lg font-bold">Clear Horizon</h3>
                <p className="text-sm text-text-muted mt-2 max-w-xs text-center">
                  SignalDesk hasn't identified any critical{" "}
                  {activeTab.toLowerCase()} in recent discussions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { SidebarProjects } from "@/components/layout/SidebarProjects";
import { SidebarGroups } from "@/components/layout/SidebarGroups";
import { summaryAPI } from "@/lib/api";
import { useUIStore } from "@/store/uiStore";
import { RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { socketClient } from "@/lib/socket";
import { useGroupStore } from "@/store/groupStore";
import { Button } from "@/components/ui/button";

interface SummaryData {
  content: string;
  keyPoints: string[];
  updatedAt: string;
}

export default function SummaryPage() {
  const { accentColor } = useUIStore();
  const { activeGroupId } = useGroupStore();
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty("--accent-color", accentColor);
    }
  }, [accentColor]);

  const fetchSummary = async (isManual = false) => {
    if (!activeGroupId) return;
    if (isManual) setRefreshing(true);
    try {
      const response = await summaryAPI.get(activeGroupId);
      setSummary(response.data.summary);
      if (isManual) toast.success("Refreshed");
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const handleSummaryUpdate = (data: any) => {
      if (data.groupId === activeGroupId) {
        setSummary({
          content: data.summary,
          keyPoints: data.keyPoints,
          updatedAt: data.updatedAt,
        });
      }
    };
    socketClient.on("summary-updated", handleSummaryUpdate);
    return () => {
      socketClient.off("summary-updated", handleSummaryUpdate);
    };
  }, [activeGroupId]);

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
            <h1 className="text-xl font-bold tracking-tight">
              Intelligence Report
            </h1>
            <p className="text-xs text-text-muted font-medium mt-0.5">
              Live conversation analysis
            </p>
          </div>

          <div className="flex items-center gap-6">
            {summary && (
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-accent" />
                Updated{" "}
                {new Date(summary.updatedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchSummary(true)}
              disabled={refreshing || !activeGroupId}
              className={cn(
                "hover:bg-base-surface h-9 w-9 text-text-muted transition-colors",
                refreshing && "animate-spin text-accent",
              )}
            >
              <RefreshCw size={16} />
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar py-16 px-6">
          <div className="max-w-4xl mx-auto space-y-12">
            {!activeGroupId ? (
              <div className="flex flex-col items-center justify-center py-40 border border-base-border border-dashed rounded-none bg-base-surface/30">
                <h3 className="text-lg font-bold">No Discussion Selected</h3>
                <p className="text-sm text-text-muted mt-2">
                  Select a channel to view AI-generated insights.
                </p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="animate-spin text-accent" size={24} />
                <p className="text-xs text-text-muted uppercase tracking-[0.2em] font-bold">
                  Analyzing History
                </p>
              </div>
            ) : summary ? (
              <div className="animate-in fade-in duration-700 space-y-12">
                {/* Main Content Box - Inspired by Auth Cards */}
                <div className="bg-base-surface border border-base-border p-12 shadow-2xl relative overflow-hidden">
                  <div className="mb-10">
                    <h2 className="text-3xl font-bold mb-3 tracking-tight">
                      Strategic Overview
                    </h2>
                    <div className="h-1 w-12 bg-accent opacity-50" />
                  </div>

                  <div className="text-[16px] text-text-secondary leading-relaxed space-y-6">
                    {summary.content
                      .split("\n")
                      .filter((p) => p.trim())
                      .map((para, i) => (
                        <p key={i}>{para}</p>
                      ))}
                  </div>
                </div>

                {/* Secondary Content Section */}
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="bg-base-surface border border-base-border p-10 shadow-xl">
                    <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-text-muted mb-8">
                      Critical Points
                    </h3>
                    <ul className="space-y-6">
                      {summary.keyPoints.map((point, i) => (
                        <li key={i} className="flex gap-4">
                          <span className="text-accent font-bold">
                            0{i + 1}
                          </span>
                          <span className="text-sm text-text-secondary leading-normal font-medium italic underline decoration-accent/20 underline-offset-4">
                            {point}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-base-surface border border-base-border p-10 shadow-xl flex flex-col justify-center">
                    <h4 className="text-lg font-bold mb-3">AI Context</h4>
                    <p className="text-sm text-text-muted leading-relaxed font-medium">
                      Derived from cross-referencing team velocity and
                      historical decision tokens within this conversation
                      stream.
                    </p>
                    <div className="mt-8 pt-8 border-t border-base-border">
                      <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">
                        Verified Output
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 border border-base-border rounded-none bg-base-surface/20">
                <h3 className="text-lg font-bold">Analysis Pending</h3>
                <p className="text-sm text-text-muted mt-2">
                  Insufficient data to generate a high-fidelity report.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

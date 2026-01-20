"use client";

import { useEffect, useState } from "react";
import { SidebarProjects } from "@/components/layout/SidebarProjects";
import { SidebarGroups } from "@/components/layout/SidebarGroups";
import { aiAPI, apiClient } from "@/lib/api";
import { useUIStore } from "@/store/uiStore";
import { useGroupStore } from "@/store/groupStore";
import { RefreshCw, Loader2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface ActionItem {
  task: string;
  assignee: string;
  deadline: string;
  priority: "critical" | "high" | "medium" | "low";
  reasoning: string;
}

interface ActionData {
  actions: ActionItem[];
  summary: string;
}

export default function TasksPage() {
  const { accentColor } = useUIStore();
  const { activeGroupId } = useGroupStore();
  const [actionData, setActionData] = useState<ActionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (accentColor) {
      document.documentElement.style.setProperty("--accent-color", accentColor);
    }
  }, [accentColor]);

  useEffect(() => {
    if (activeGroupId) {
      const storageKey = `tasks_completed_${activeGroupId}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setCompletedTasks(new Set(JSON.parse(stored)));
        } catch (e) {
          console.error("Failed to parse completed tasks:", e);
        }
      } else {
        setCompletedTasks(new Set());
      }

      const actionsStorageKey = `tasks_data_${activeGroupId}`;
      const storedActions = localStorage.getItem(actionsStorageKey);
      if (storedActions) {
        try {
          setActionData(JSON.parse(storedActions));
        } catch (e) {
          console.error("Failed to parse stored actions:", e);
        }
      }
    }
  }, [activeGroupId]);

  const getTaskId = (action: ActionItem, index: number) => {
    return `${index}_${action.task.substring(0, 50)}`;
  };

  const toggleTaskCompletion = (taskId: string) => {
    if (!activeGroupId) return;

    const newCompleted = new Set(completedTasks);
    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }

    setCompletedTasks(newCompleted);
    const storageKey = `tasks_completed_${activeGroupId}`;
    localStorage.setItem(storageKey, JSON.stringify(Array.from(newCompleted)));
  };

  const extractActions = async (isManual = false) => {
    if (!activeGroupId) return;
    if (isManual) setRefreshing(true);
    setLoading(true);

    try {
      const messagesResponse = await apiClient.get(
        `/groups/${activeGroupId}/messages`,
        { params: { limit: 50 } },
      );
      const messagesData = messagesResponse.data;

      if (!messagesData.messages || !Array.isArray(messagesData.messages)) {
        throw new Error("Invalid messages response");
      }

      const formattedMessages = messagesData.messages.map((m: any) => ({
        user: m.userName || "Member",
        message: m.content,
        timestamp: m.createdAt,
      }));

      const contextsResponse = await apiClient.get("/context", {
        params: { category: "ACTION", groupId: activeGroupId, limit: 20 },
      });

      const priorActions =
        contextsResponse.data.contexts?.map((c: any) => c.content) || [];

      const response = await aiAPI.action(formattedMessages, {
        prior_actions: priorActions,
      });

      const newActionData = response.data;
      setActionData(newActionData);

      const actionsStorageKey = `tasks_data_${activeGroupId}`;
      localStorage.setItem(actionsStorageKey, JSON.stringify(newActionData));

      if (isManual) toast.success("Actions extracted");
    } catch (error) {
      console.error("Failed to extract actions:", error);
      if (isManual) toast.error("Failed to extract actions");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "high":
        return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "medium":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "low":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      default:
        return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-base-bg text-text-primary font-sans">
      <div className="hidden md:flex h-full">
        <SidebarProjects />
        <SidebarGroups />
      </div>

      <div className="flex-1 flex flex-col min-w-0 bg-base-bg relative overflow-hidden">
        <header className="h-16 flex items-center justify-between px-12 border-b border-base-border">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Action Items</h1>
            <p className="text-xs text-text-muted font-medium mt-0.5">
              AI-extracted tasks from conversation
            </p>
          </div>

          <div className="flex items-center gap-6">
            <Button
              onClick={() => extractActions(true)}
              disabled={refreshing || !activeGroupId || loading}
              className={cn(
                "bg-accent hover:bg-accent-hover text-white h-9 px-4 text-sm font-bold",
                (refreshing || loading) && "opacity-50",
              )}
            >
              {refreshing ? (
                <>
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>Extract Actions</>
              )}
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar py-12 px-6">
          <div className="max-w-5xl mx-auto space-y-8">
            {!activeGroupId ? (
              <div className="flex flex-col items-center justify-center py-32 border border-base-border border-dashed bg-base-surface/20">
                <CheckCircle2 className="text-text-muted mb-4" size={24} />
                <h3 className="text-lg font-bold">No Group Selected</h3>
                <p className="text-sm text-text-muted mt-2 max-w-xs text-center">
                  Select a channel to extract action items from the
                  conversation.
                </p>
              </div>
            ) : loading && !actionData ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="animate-spin text-accent" size={24} />
                <p className="text-xs text-text-muted uppercase tracking-[0.2em] font-bold">
                  Extracting Tasks
                </p>
              </div>
            ) : actionData ? (
              <div className="animate-in fade-in duration-700 space-y-8">
                {actionData.summary && (
                  <div className="bg-base-surface border border-base-border p-8 shadow-xl">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted mb-4">
                      Overview
                    </h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {actionData.summary}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {actionData.actions.length > 0 ? (
                    actionData.actions.map((action, i) => {
                      const taskId = getTaskId(action, i);
                      const isCompleted = completedTasks.has(taskId);

                      return (
                        <div
                          key={i}
                          className={cn(
                            "bg-base-surface border border-base-border p-8 shadow-xl group transition-all",
                            isCompleted && "opacity-60",
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => toggleTaskCompletion(taskId)}
                              className="mt-1 flex-shrink-0 w-6 h-6 rounded-md border-2 border-base-border hover:border-accent transition-colors flex items-center justify-center"
                            >
                              {isCompleted ? (
                                <CheckCircle2
                                  size={20}
                                  className="text-accent"
                                />
                              ) : (
                                <Circle size={20} className="text-text-muted" />
                              )}
                            </button>

                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-6">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <span
                                      className={cn(
                                        "text-[10px] font-black uppercase tracking-[0.2em] px-2 py-1 border",
                                        getPriorityColor(action.priority),
                                      )}
                                    >
                                      {action.priority}
                                    </span>
                                    <span className="h-4 w-px bg-base-border" />
                                    <span className="text-xs font-bold text-text-muted">
                                      {action.assignee}
                                    </span>
                                  </div>
                                  <h4
                                    className={cn(
                                      "text-lg font-bold text-white leading-snug",
                                      isCompleted && "line-through",
                                    )}
                                  >
                                    {action.task}
                                  </h4>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-xs text-text-muted">
                                  <span className="font-bold uppercase tracking-widest">
                                    Deadline:
                                  </span>
                                  <span className="font-medium">
                                    {action.deadline}
                                  </span>
                                </div>

                                {action.reasoning && (
                                  <div className="pt-6 border-t border-base-border/50">
                                    <p className="text-xs text-text-muted italic leading-relaxed">
                                      <span className="text-accent font-bold not-italic mr-2 uppercase tracking-tighter text-[10px]">
                                        Context:
                                      </span>
                                      {action.reasoning}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 border border-base-border bg-base-surface/20">
                      <CheckCircle2
                        className="text-text-muted mb-4"
                        size={24}
                      />
                      <h3 className="text-lg font-bold">No Actions Found</h3>
                      <p className="text-sm text-text-muted mt-2 max-w-xs text-center">
                        No actionable tasks were identified in the recent
                        conversation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 border border-base-border bg-base-surface/20">
                <CheckCircle2 className="text-text-muted mb-4" size={24} />
                <h3 className="text-lg font-bold">Ready to Extract</h3>
                <p className="text-sm text-text-muted mt-2 max-w-xs text-center">
                  Click "Extract Actions" to analyze the conversation and
                  identify tasks.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

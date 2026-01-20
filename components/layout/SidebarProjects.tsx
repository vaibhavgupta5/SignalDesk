"use client";

import { useState } from "react";
import {
  Plus,
  LogOut,
  Settings,
  UserPlus,
  Pencil,
  ClipboardCheck,
} from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useUIStore } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateProjectModal } from "@/components/modals/CreateProjectModal";
import { EditProjectModal } from "@/components/modals/EditProjectModal";
import { InviteMemberModal } from "@/components/modals/InviteMemberModal";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { socketClient } from "@/lib/socket";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

export function SidebarProjects() {
  const { projects, activeProjectId, setActiveProject } = useProjectStore();
  const { setAccentColor } = useUIStore();
  const { logout } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inviteProjectId, setInviteProjectId] = useState<string | null>(null);
  const [editProjectId, setEditProjectId] = useState<string | null>(null);
  const router = useRouter();

  const handleProjectClick = (projectId: string, accentColor?: string) => {
    setActiveProject(projectId);
    if (accentColor) {
      setAccentColor(accentColor);
    }
  };

  const handleLogout = () => {
    socketClient.disconnect();
    logout();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
    }
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <>
      <div className="w-[72px] bg-base-bg border-r border-base-border flex flex-col items-center py-4 z-20">
        <div className="mb-4">
          {/* Home / SignalDesk Logo Placeholder */}
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-purple-800 font-bold text-normal  shadow-lg">
            SD
          </div>
        </div>

        <ScrollArea className="flex-1 w-full px-2">
          <div className="space-y-3 flex flex-col items-center pb-4">
            {projects.map((project) => (
              <ContextMenu key={project._id}>
                <ContextMenuTrigger>
                  <div className="relative group">
                    {/* Active Indicator */}
                    {activeProjectId === project._id && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -left-3  -translate-y-1 w-1.5 h-12 rounded-r-full"
                        style={{
                          backgroundColor: project.accentColor || "#fff",
                        }}
                      />
                    )}

                    {/* Project Icon */}
                    <button
                      onClick={() =>
                        handleProjectClick(project._id, project.accentColor)
                      }
                      className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative group overflow-hidden",
                        activeProjectId === project._id
                          ? "shadow-md scale-105"
                          : "hover:bg-base-hover opacity-70 hover:opacity-100 hover:rounded-xl",
                      )}
                      style={{
                        backgroundColor:
                          activeProjectId === project._id
                            ? project.accentColor
                            : undefined,
                      }}
                      title={project.name}
                    >
                      <span
                        className={cn(
                          "font-bold text-sm",
                          activeProjectId === project._id
                            ? "text-white"
                            : "text-text-secondary group-hover:text-text-primary",
                        )}
                      >
                        {activeProjectId !== project._id && (
                          <div className="absolute inset-0 bg-base-surface opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                        )}
                        {getInitials(project.name)}
                      </span>
                    </button>
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-48">
                  <ContextMenuItem
                    onSelect={() => setEditProjectId(project._id)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Project
                  </ContextMenuItem>
                  <ContextMenuItem
                    onSelect={() => setInviteProjectId(project._id)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Members
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={() => console.log("Settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}

            <div className="h-px w-8 bg-base-border my-2" />

            <button
              onClick={() => setIsCreateOpen(true)}
              className="w-12 h-12 rounded-2xl bg-base-surface border border-base-border border-dashed hover:border-text-muted hover:text-white text-text-muted flex items-center justify-center transition-all duration-200 group"
              title="Create Project"
            >
              <Plus
                size={20}
                className="group-hover:scale-110 transition-transform"
              />
            </button>
          </div>
        </ScrollArea>

        <div className="mt-auto pt-4 flex flex-col items-center gap-4 w-full border-t border-base-border/50">
          <button
            onClick={() => router.push("/context-store")}
            className="w-10 h-10 rounded-xl hover:bg-white/5 text-text-muted flex items-center justify-center transition-all duration-200"
            title="Context Store"
          >
            <ClipboardCheck size={18} />
          </button>

          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl hover:bg-red-500/10 hover:text-red-500 text-text-muted flex items-center justify-center transition-all duration-200"
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <InviteMemberModal
        isOpen={!!inviteProjectId}
        onClose={() => setInviteProjectId(null)}
        projectId={inviteProjectId}
      />

      <EditProjectModal
        isOpen={!!editProjectId}
        onClose={() => setEditProjectId(null)}
        projectId={editProjectId}
      />
    </>
  );
}

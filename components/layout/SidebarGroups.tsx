"use client";

import { useState, useEffect } from "react";
import { Hash, Plus, Users, Settings, Bell, Trash2, Lock } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useGroupStore } from "@/store/groupStore";
import { groupAPI } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateGroupModal } from "@/components/modals/CreateGroupModal";
import { ChannelSettingsModal } from "@/components/modals/ChannelSettingsModal";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { CreateDMModal } from "@/components/modals/CreateDMModal";
import { socketClient } from "@/lib/socket";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/avatar";
import { projectAPI } from "@/lib/api";

export function SidebarGroups() {
  const { activeProjectId, projects } = useProjectStore();
  const {
    groups,
    activeGroupId,
    setActiveGroup,
    fetchGroups,
    removeGroup,
    onlineUsers,
    setOnlineUsers,
    settingsGroupId,
    setSettingsGroupId,
  } = useGroupStore();
  const { user } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [projectMembers, setProjectMembers] = useState<any[]>([]);

  useEffect(() => {
    if (activeProjectId) {
      fetchGroups(activeProjectId);
      projectAPI
        .get(activeProjectId)
        .then((res) => {
          if (res.data.project?.members)
            setProjectMembers(res.data.project.members);
        })
        .catch(console.error);
    }
  }, [activeProjectId, fetchGroups]);

  useEffect(() => {
    // Listen for online users update
    // Assuming socket emits this. If not, we need to implement server side broadcasting.
    socketClient.socket?.on("users:online", (users: string[]) => {
      setOnlineUsers(users);
    });
    return () => {
      socketClient.socket?.off("users:online");
    };
  }, [setOnlineUsers]);

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this channel?")) return;
    try {
      await groupAPI.delete(groupId);
      removeGroup(groupId);
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("Failed to delete channel. You might not have permission.");
    }
  };

  const activeProject = projects.find((p) => p._id === activeProjectId);
  // Separate Channels and DMs
  // Separate Channels and DMs
  const channels = groups.filter(
    (g) =>
      g.projectId === activeProjectId &&
      g.type !== "dm" &&
      !g.name.startsWith("dm-"),
  );
  const dms = groups.filter(
    (g) =>
      g.projectId === activeProjectId &&
      (g.type === "dm" || g.name.startsWith("dm-")),
  );

  const getDMUser = (group: any) => {
    if (!user) return null;
    const otherId = group.members.find((id: string) => id !== user.id);
    if (!otherId && group.members.length > 0)
      return projectMembers.find((m) => m._id === group.members[0]); // Self DM?
    return projectMembers.find((m) => m._id === otherId);
  };

  if (!activeProject) {
    return (
      <div className="w-64 bg-base-surface border-r border-base-border flex items-center justify-center p-4 text-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-base-hover flex items-center justify-center mb-3">
            <Hash className="text-text-muted" />
          </div>
          <p className="text-text-muted text-sm">
            Select a project to view channels
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-64 bg-base-surface border-r border-base-border flex flex-col">
        {/* Project Header */}
        <div className="h-16 px-4 border-b border-base-border flex flex-col justify-center transition-colors hover:bg-base-hover cursor-pointer group">
          <h3 className="text-text-primary font-bold truncate text-base flex items-center gap-1">
            {activeProject.name}
            {/* You could add a chevron here for a project menu dropdown */}
          </h3>
          <div className="flex items-center gap-2 text-text-muted text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="group-hover:text-text-secondary transition-colors">
              Online
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="mb-6">
            <div className="flex items-center justify-between px-3 py-1 mb-2 group">
              <span className="text-text-muted text-xs font-bold uppercase tracking-wider group-hover:text-text-secondary transition-colors">
                Channels
              </span>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary transition-all p-0.5 rounded"
                title="Create Channel"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-[2px]">
              {channels.map((group) => (
                <ContextMenu key={group._id}>
                  <ContextMenuTrigger>
                    <button
                      onClick={() => setActiveGroup(group._id)}
                      className={cn(
                        "w-full text-left px-3 py-[6px] rounded-md transition-all duration-200 text-sm flex items-center gap-2 group",
                        activeGroupId === group._id
                          ? "bg-base-hover text-text-primary shadow-sm"
                          : "text-text-secondary hover:bg-base-hover/50 hover:text-text-primary",
                      )}
                    >
                      {group.isPrivate ? (
                        <Lock
                          size={14}
                          className={cn(
                            "shrink-0 transition-colors",
                            activeGroupId === group._id
                              ? "text-text-muted"
                              : "text-text-muted/70 group-hover:text-text-muted",
                          )}
                        />
                      ) : (
                        <Hash
                          size={15}
                          className={cn(
                            "shrink-0 transition-colors",
                            activeGroupId === group._id
                              ? "text-text-muted"
                              : "text-text-muted/70 group-hover:text-text-muted",
                          )}
                        />
                      )}
                      <span
                        className={cn(
                          "truncate",
                          activeGroupId === group._id && "font-medium",
                        )}
                      >
                        {group.name}
                      </span>
                    </button>
                  </ContextMenuTrigger>

                  <ContextMenuContent className="w-48">
                    <ContextMenuItem
                      onSelect={() => console.log("Notifications")}
                    >
                      <Bell className="mr-2 h-4 w-4" />
                      Mute Channel
                    </ContextMenuItem>
                    <ContextMenuItem
                      onSelect={() => setSettingsGroupId(group._id)}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Channel Settings
                    </ContextMenuItem>
                    {!group.isDefault && (
                      <>
                        <ContextMenuSeparator />
                        <ContextMenuItem
                          onSelect={() => handleDeleteGroup(group._id)}
                          className="text-red-500 focus:text-red-500 focus:bg-red-500/10"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Channel
                        </ContextMenuItem>
                      </>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>

            {/* Direct Messages Section */}
            <div className="mt-6">
              <div className="flex items-center justify-between px-3 py-1 mb-2 group">
                <span className="text-text-muted text-xs font-bold uppercase tracking-wider group-hover:text-text-secondary transition-colors">
                  Direct Messages
                </span>
                <button
                  onClick={() => setIsDMOpen(true)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-text-primary transition-all p-0.5 rounded"
                  title="New Message"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="space-y-[2px]">
                {dms.map((group) => {
                  const dmUser = getDMUser(group);
                  const isOnline = dmUser
                    ? onlineUsers.includes(dmUser._id)
                    : false;

                  return (
                    <ContextMenu key={group._id}>
                      <ContextMenuTrigger>
                        <button
                          onClick={() => setActiveGroup(group._id)}
                          className={cn(
                            "w-full text-left px-3 py-[6px] rounded-md transition-all duration-200 text-sm flex items-center gap-3 group",
                            activeGroupId === group._id
                              ? "bg-base-hover text-text-primary shadow-sm"
                              : "text-text-secondary hover:bg-base-hover/50 hover:text-text-primary",
                          )}
                        >
                          <div className="relative shrink-0 flex items-center">
                            <Avatar
                              className="w-5 h-5 rounded-md"
                              src={dmUser?.avatar}
                              fallback={dmUser?.name?.[0]}
                            />
                            {isOnline && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 border-2 border-base-surface rounded-full"></span>
                            )}
                          </div>
                          <span
                            className={cn(
                              "truncate opacity-90",
                              activeGroupId === group._id &&
                                "font-medium opacity-100",
                            )}
                          >
                            {dmUser?.name || "Unknown User"}
                          </span>
                        </button>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem
                          onSelect={() => handleDeleteGroup(group._id)}
                          className="text-red-500"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Close Conversation
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="px-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 text-text-muted hover:text-text-primary text-sm transition-colors group"
            >
              <div className="w-6 h-6 rounded bg-base-hover flex items-center justify-center group-hover:bg-base-border transition-colors">
                <Plus size={14} />
              </div>
              <span>Add Channel</span>
            </button>
          </div>
        </ScrollArea>

        {/* Bottom Panel - Member/Status Info */}
        <div className="p-3 border-t border-base-border bg-base-surface/50">
          <div className="flex items-center gap-2 px-2 py-1 text-text-secondary text-xs">
            <Users size={14} />
            <span>{activeProject.members?.length || 1} Team Members</span>
          </div>
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        projectId={activeProjectId}
      />

      <ChannelSettingsModal
        isOpen={!!settingsGroupId}
        onClose={() => setSettingsGroupId(null)}
        groupId={settingsGroupId}
        projectId={activeProjectId || ""}
      />
      <CreateDMModal
        isOpen={isDMOpen}
        onClose={() => setIsDMOpen(false)}
        projectId={activeProjectId}
      />
    </>
  );
}

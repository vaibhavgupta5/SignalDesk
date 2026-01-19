"use client";

import { useState, useEffect } from "react";
import {
  X,
  Trash2,
  Users,
  Save,
  ShieldAlert,
  Plus,
  Search,
  UserMinus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { useGroupStore } from "@/store/groupStore";
import { groupAPI, projectAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import { AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ChannelSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string | null;
  projectId: string;
}

interface Member {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export function ChannelSettingsModal({
  isOpen,
  onClose,
  groupId,
  projectId,
}: ChannelSettingsModalProps) {
  const { updateGroup, removeGroup } = useGroupStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"overview" | "members" | "danger">(
    "overview",
  );

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [groupMembers, setGroupMembers] = useState<Member[]>([]);
  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && groupId) {
      loadData();
    }
  }, [isOpen, groupId]);

  const loadData = async () => {
    if (!groupId) return;
    setIsLoading(true);
    try {
      const [groupRes, projectRes] = await Promise.all([
        groupAPI.get(groupId),
        projectAPI.get(projectId),
      ]);

      const g = groupRes.data.group;
      setName(g.name);
      setDescription(g.description || "");
      setIsPrivate(g.isPrivate);
      setGroupMembers(g.members || []);

      if (projectRes.data.project?.members) {
        setProjectMembers(projectRes.data.project.members);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!groupId) return;
    setIsSaving(true);
    try {
      // Construct member IDs
      const memberIds = groupMembers.map((m) => m._id);

      const response = await groupAPI.update(groupId, {
        name,
        description,
        isPrivate,
        members: memberIds,
      });

      updateGroup(groupId, response.data.group);
      onClose();
    } catch (error: any) {
      console.error("Failed to save:", error);
      alert(error.response?.data?.message || "Failed to save settings");
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!groupId || !confirm("Delete this channel permanently?")) return;
    try {
      await groupAPI.delete(groupId);
      removeGroup(groupId);
      onClose();
    } catch (e) {
      console.error(e);
    }
  };

  const addMember = (member: Member) => {
    if (!groupMembers.find((m) => m._id === member._id)) {
      setGroupMembers([...groupMembers, member]);
    }
  };

  const removeMember = (memberId: string) => {
    setGroupMembers(groupMembers.filter((m) => m._id !== memberId));
  };

  const filteredCandidates = projectMembers.filter(
    (pm) =>
      !groupMembers.some((gm) => gm._id.toString() === pm._id.toString()) &&
      (pm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pm.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div
        className="bg-base-surface border border-base-border rounded-xl w-full max-w-2xl mx-4 shadow-2xl overflow-hidden flex h-[600px] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="w-48 border-r border-base-border bg-base-bg/50 p-4 space-y-2 flex flex-col">
          <h2 className="text-text-primary font-bold mb-4 px-2">
            Channel Settings
          </h2>
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === "overview"
                ? "bg-base-hover text-text-primary"
                : "text-text-secondary hover:bg-base-hover/50",
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === "members"
                ? "bg-base-hover text-text-primary"
                : "text-text-secondary hover:bg-base-hover/50",
            )}
          >
            Members
          </button>
          <div className="border-t border-base-border my-2"></div>
          <button
            onClick={() => setActiveTab("danger")}
            className={cn(
              "w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors text-red-500 hover:bg-red-500/10",
              activeTab === "danger" ? "bg-red-500/10" : "",
            )}
          >
            Danger Zone
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col bg-base-surface">
          <div className="flex items-center justify-between p-4 border-b border-base-border">
            <h3 className="text-lg font-semibold text-text-primary capitalize">
              {activeTab}
            </h3>
            <button onClick={onClose}>
              <X
                size={20}
                className="text-text-muted hover:text-text-primary"
              />
            </button>
          </div>

          <ScrollArea className="flex-1 p-6">
            {isLoading ? (
              <div className="text-center py-10 text-text-muted">
                Loading...
              </div>
            ) : (
              <>
                {activeTab === "overview" && (
                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">
                        Channel Name
                      </label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">
                        Description
                      </label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {activeTab === "members" && (
                  <div className="space-y-6">
                    <div className="flex gap-4 h-[400px]">
                      {/* Existing Members */}
                      <div className="flex-1 border border-base-border rounded-lg flex flex-col">
                        <div className="p-3 border-b border-base-border bg-base-bg/30 font-medium text-sm">
                          Members ({groupMembers.length})
                        </div>
                        <ScrollArea className="flex-1 p-2">
                          {groupMembers.map((m) => (
                            <div
                              key={m._id}
                              className="flex items-center justify-between p-2 hover:bg-base-hover rounded group"
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={m.avatar} />
                                  <AvatarFallback>{m.name[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm truncate">
                                  {m.name}
                                </span>
                              </div>
                              <button
                                onClick={() => removeMember(m._id)}
                                className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-500 transition-opacity"
                              >
                                <UserMinus size={14} />
                              </button>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>

                      {/* Add Members */}
                      <div className="flex-1 border border-base-border rounded-lg flex flex-col">
                        <div className="p-3 border-b border-base-border bg-base-bg/30 font-medium text-sm">
                          Add People
                        </div>
                        <div className="p-2 border-b border-base-border">
                          <div className="relative">
                            <Search
                              size={14}
                              className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted"
                            />
                            <Input
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Search..."
                              className="h-8 pl-8 text-xs"
                            />
                          </div>
                        </div>
                        <ScrollArea className="flex-1 p-2">
                          {filteredCandidates.map((m) => (
                            <div
                              key={m._id}
                              className="flex items-center justify-between p-2 hover:bg-base-hover rounded cursor-pointer"
                              onClick={() => addMember(m)}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={m.avatar} />
                                  <AvatarFallback>{m.name[0]}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm truncate">
                                  {m.name}
                                </span>
                              </div>
                              <Plus size={14} className="text-text-muted" />
                            </div>
                          ))}
                          {filteredCandidates.length === 0 && (
                            <p className="text-xs text-text-muted text-center py-4">
                              No remaining members found
                            </p>
                          )}
                        </ScrollArea>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "danger" && (
                  <div className="space-y-4">
                    <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-4">
                      <h4 className="flex items-center gap-2 text-red-500 font-bold mb-2">
                        {" "}
                        <ShieldAlert size={18} /> Delete Channel
                      </h4>
                      <p className="text-sm text-text-secondary mb-4">
                        Once you delete a channel, there is no going back.
                        Please be certain.
                      </p>
                      <Button variant="destructive" onClick={handleDelete}>
                        Delete Channel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </ScrollArea>

          {activeTab !== "danger" && (
            <div className="p-4 border-t border-base-border flex justify-end gap-2 bg-base-surface/50">
              <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isLoading}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

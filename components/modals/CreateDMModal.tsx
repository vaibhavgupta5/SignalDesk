"use client";

import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { projectAPI, groupAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useGroupStore } from "@/store/groupStore";

interface CreateDMModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
}

interface Member {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export function CreateDMModal({
  isOpen,
  onClose,
  projectId,
}: CreateDMModalProps) {
  const { user } = useAuthStore();
  const { groups, addGroup, setActiveGroup } = useGroupStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      loadMembers();
    }
  }, [isOpen, projectId]);

  const loadMembers = async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      const response = await projectAPI.get(projectId);
      if (response.data.project?.members) {
        // Filter out self. Note: user?.id is string.
        setMembers(
          response.data.project.members.filter(
            (m: Member) => m._id !== user?.id,
          ),
        );
      }
    } catch (error) {
      console.error("Failed to load members:", error);
    }
    setIsLoading(false);
  };

  const handleSelectMember = async (targetMember: Member) => {
    if (!projectId || !user) return;

    // Check if DM already exists
    // DM exists if there's a group of type 'dm' containing BOTH user.id and targetMember._id
    const existingDM = groups.find(
      (g) =>
        g.type === "dm" &&
        g.members.includes(user.id) &&
        g.members.includes(targetMember._id),
    );

    if (existingDM) {
      setActiveGroup(existingDM._id);
      onClose();
      return;
    }

    // Create new DM
    try {
      const response = await groupAPI.create(projectId, {
        name: `dm-${Date.now()}`,
        isPrivate: true,
        type: "dm",
        members: [user.id, targetMember._id],
      } as any);

      addGroup(response.data.group);
      setActiveGroup(response.data.group._id);
      onClose();
    } catch (error) {
      console.error("Failed to create DM:", error);
      alert("Failed to start conversation");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div
        className="bg-base-surface border border-base-border rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden flex flex-col h-[500px] animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-base-border bg-base-surface/50">
          <h2 className="text-text-primary font-semibold flex items-center gap-2">
            New Message
          </h2>
          <button onClick={onClose}>
            <X size={20} className="text-text-muted hover:text-text-primary" />
          </button>
        </div>

        <div className="p-4 border-b border-base-border">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search people..."
              className="pl-9 bg-base-bg/50 border-none ring-1 ring-base-border focus:ring-accent"
              autoFocus
            />
          </div>
        </div>

        <ScrollArea className="flex-1 p-2">
          {isLoading ? (
            <div className="text-center py-8 text-text-muted">Loading...</div>
          ) : (
            <div className="space-y-1">
              {filteredMembers.map((member) => (
                <button
                  key={member._id}
                  onClick={() => handleSelectMember(member)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-base-hover rounded-lg transition-colors group text-left"
                >
                  <div className="relative">
                    <Avatar
                      className="w-10 h-10 border border-base-border"
                      src={member.avatar}
                      fallback={member.name[0]}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {member.email}
                    </p>
                  </div>
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <div className="text-center py-8 text-text-muted">
                  No members found.
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

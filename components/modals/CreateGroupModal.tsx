import { useState, useEffect } from "react";
import { X, Lock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useGroupStore } from "@/store/groupStore";
import { groupAPI, projectAPI } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

interface CreateGroupModalProps {
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

export function CreateGroupModal({
  isOpen,
  onClose,
  projectId,
}: CreateGroupModalProps) {
  const { addGroup } = useGroupStore();
  const { user } = useAuthStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [projectMembers, setProjectMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && projectId) {
      const fetchMembers = async () => {
        try {
          const response = await projectAPI.get(projectId);
          // response.data.project.members should be populated
          if (response.data.project?.members) {
            setProjectMembers(response.data.project.members);
          }
        } catch (error) {
          console.error("Failed to fetch project members:", error);
        }
      };

      fetchMembers();
      setSelectedMembers([]); // Reset selections
    }
  }, [isOpen, projectId]);

  // Ensure current user is always selected/included in logic
  // But we typically add them by default in backend or handle it here
  // Let's force add current user ID to selection logic or backend ensures creator is added.
  // Backend relies on "members" array. So we must include creator.

  useEffect(() => {
    if (user && isOpen && !selectedMembers.includes(user._id)) {
      setSelectedMembers([user._id]);
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !projectId) return;

    try {
      setIsSubmitting(true);
      const response = await groupAPI.create(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
        isPrivate,
        members: isPrivate ? selectedMembers : undefined,
      });

      addGroup(response.data.group);

      setName("");
      setDescription("");
      setIsPrivate(false);
      onClose();
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (memberId: string) => {
    // Prevent unselecting self? Optional
    if (memberId === user?._id) return;

    setSelectedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div
        className="bg-base-surface border border-base-border rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-base-border bg-base-surface/50">
          <h2 className="text-text-primary font-semibold text-lg flex items-center gap-2">
            Create Channel
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-base-hover rounded-md text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-text-secondary text-sm font-medium">
              Channel Name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                {isPrivate ? <Lock size={14} /> : "#"}
              </span>
              <Input
                value={name}
                onChange={(e) =>
                  setName(e.target.value.toLowerCase().replace(/\s+/g, "-"))
                }
                placeholder="e.g. team-updates"
                className="pl-8"
                autoFocus
                required
              />
            </div>
            <p className="text-text-muted text-xs">Lowercase, hyphens only.</p>
          </div>

          <div className="space-y-2">
            <label className="text-text-secondary text-sm font-medium">
              Description
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this channel about?"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-base-border">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-text-primary text-sm font-medium flex items-center gap-2">
                  Private Channel
                  {isPrivate && (
                    <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded border border-accent/20">
                      PRO
                    </span>
                  )}
                </label>
                <p className="text-text-muted text-xs">
                  Only selected members can view this channel
                </p>
              </div>
              <Checkbox
                checked={isPrivate}
                onCheckedChange={(c) => setIsPrivate(!!c)}
              />
            </div>

            {isPrivate && (
              <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                <label className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <Users size={14} />
                  Add Members
                </label>
                <div className="border border-base-border rounded-lg bg-base-bg/50">
                  <ScrollArea className="h-40 p-2">
                    <div className="space-y-1">
                      {projectMembers.map((member) => (
                        <div
                          key={member._id}
                          className="flex items-center gap-3 p-2 hover:bg-base-hover rounded-md cursor-pointer transition-colors"
                          onClick={() => toggleMember(member._id)}
                        >
                          <Checkbox
                            checked={selectedMembers.includes(member._id)}
                            onCheckedChange={() => toggleMember(member._id)}
                            // disabled={member._id === user?._id} // Disable unchecking self
                          />
                          <div className="flex flex-col">
                            <span className="text-sm text-text-primary font-medium">
                              {member.name}{" "}
                              {member._id === user?._id && "(You)"}
                            </span>
                            <span className="text-xs text-text-muted">
                              {member.email}
                            </span>
                          </div>
                        </div>
                      ))}
                      {projectMembers.length === 0 && (
                        <p className="text-xs text-text-muted p-2">
                          No other members found.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Channel"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

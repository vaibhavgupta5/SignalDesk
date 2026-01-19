"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/store/projectStore";
import { projectAPI } from "@/lib/api";
import { cn } from "@/lib/utils";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const accentColors = [
  "#7C3AED",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
  "#14B8A6",
];

export function CreateProjectModal({
  isOpen,
  onClose,
}: CreateProjectModalProps) {
  const { addProject, fetchProjects, setActiveProject } = useProjectStore();
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  // Create State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(accentColors[0]);

  // Join State
  const [inviteLink, setInviteLink] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await projectAPI.create({
        name: name.trim(),
        description: description.trim() || undefined,
        accentColor: selectedColor,
      });

      addProject(response.data.project); // Actually backend returns project in data.project
      // Need to ensure addProject updates store correctly or just fetchProjects
      await fetchProjects();

      handleClose();
    } catch (error) {
      console.error("Failed to create project:", error);
      setError("Failed to create project");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteLink.trim()) return;

    // Extract projectId from link if absolute url
    let projectId = inviteLink.trim();
    if (projectId.includes("/invite/")) {
      const parts = projectId.split("/invite/");
      if (parts[1]) projectId = parts[1];
    }

    try {
      setIsSubmitting(true);
      await projectAPI.join(projectId);
      await fetchProjects();
      setActiveProject(projectId);
      handleClose();
    } catch (error) {
      console.error("Failed to join project:", error);
      setError("Failed to join project (Invalid ID or already member)");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setSelectedColor(accentColors[0]);
    setInviteLink("");
    setError("");
    setActiveTab("create");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div
        className="bg-base-surface border border-base-border rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-base-border bg-base-surface/50">
          <h2 className="text-text-primary font-semibold text-lg">Project</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-base-hover rounded-md text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-base-border">
          <button
            onClick={() => {
              setActiveTab("create");
              setError("");
            }}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === "create"
                ? "text-text-primary"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            Create Project
            {activeTab === "create" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveTab("join");
              setError("");
            }}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === "join"
                ? "text-text-primary"
                : "text-text-muted hover:text-text-secondary",
            )}
          >
            Join Project
            {activeTab === "join" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {activeTab === "create" ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm font-medium">
                  Project Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mobile App"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="text-text-secondary text-sm font-medium">
                  Description (optional)
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>

              <div>
                <label className="text-text-secondary text-sm font-medium mb-2 block">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {accentColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "w-8 h-8 rounded-full transition-all hover:scale-110",
                        selectedColor === color &&
                          "ring-2 ring-offset-2 ring-offset-base-surface ring-text-primary scale-110",
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!name.trim() || isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create Project"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="text-text-secondary text-sm font-medium">
                  Invite Link or Project ID
                </label>
                <Input
                  value={inviteLink}
                  onChange={(e) => setInviteLink(e.target.value)}
                  placeholder="Enter link or ID..."
                  autoFocus
                  required
                />
                <p className="text-xs text-text-muted mt-1">
                  Paste the full invite link or the project ID shared with you.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!inviteLink.trim() || isSubmitting}
                >
                  {isSubmitting ? "Joining..." : "Join Project"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

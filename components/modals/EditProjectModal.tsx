"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { projectAPI } from "@/lib/api";

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
}

export function EditProjectModal({
  isOpen,
  onClose,
  projectId,
}: EditProjectModalProps) {
  const { projects, updateProject } = useProjectStore();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Load initial data
  const project = projects.find((p) => p._id === projectId);

  // Set initial state only when opening with a project
  if (isOpen && project && name === "" && !loading) {
    setName(project.name);
  }

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await projectAPI.update(project._id, { name: name.trim() });
      updateProject(project._id, { name: name.trim() });
      onClose();
    } catch (error) {
      console.error("Failed to update project:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div
        className="w-full max-w-md bg-base-surface border border-base-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-base-border bg-base-surface/50">
          <h2 className="text-lg font-semibold text-text-primary">
            Edit Project
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-base-hover rounded-md text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">
              Project Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

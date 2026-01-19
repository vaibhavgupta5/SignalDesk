"use client";

import { useState } from "react";
import { X, Copy, Check } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
}

export function InviteMemberModal({
  isOpen,
  onClose,
  projectId,
}: InviteMemberModalProps) {
  const { projects } = useProjectStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !projectId) return null;

  const project = projects.find((p) => p._id === projectId);
  if (!project) return null;

  const handleCopy = () => {
    const link = `${window.location.origin}/invite/${project.projectId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in-0">
      <div
        className="w-full max-w-md bg-base-surface border border-base-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-base-border bg-base-surface/50">
          <h2 className="text-lg font-semibold text-text-primary">
            Invite People
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-base-hover rounded-md text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-text-primary">
              Share this invite link
            </h3>
            <p className="text-sm text-text-muted">
              Anyone with this link can join this project directly.
            </p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-base-bg border border-base-border rounded-lg group hover:border-accent/50 transition-colors">
            <code className="flex-1 font-mono text-sm text-accent truncate">
              {typeof window !== "undefined"
                ? `${window.location.origin}/invite/${project.projectId}`
                : project.projectId}
            </code>
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-base-hover rounded-md text-text-muted hover:text-white transition-colors relative shrink-0"
              title="Copy Link"
            >
              {copied ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>

          <div className="pt-2 text-xs text-text-muted text-center">
            Only share this ID with people you trust.
          </div>
        </div>

        <div className="p-4 border-t border-base-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-base-hover hover:bg-base-border text-text-primary rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

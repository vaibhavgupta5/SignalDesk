"use client";

import { Hash, Users } from "lucide-react";
import { useGroupStore } from "@/store/groupStore";
import { useProjectStore } from "@/store/projectStore";

export function ChatHeader() {
  const { groups, activeGroupId } = useGroupStore();
  const { projects, activeProjectId } = useProjectStore();

  const activeGroup = groups.find((g) => g._id === activeGroupId);
  const activeProject = projects.find((p) => p._id === activeProjectId);

  if (!activeGroup) {
    return (
      <div className="h-16 border-b border-white/5 bg-[#111114]/90 backdrop-blur-sm flex items-center px-6">
        <p className="text-gray-500">Select a channel to start chatting</p>
      </div>
    );
  }

  return (
    <div className="h-16 border-b border-white/5 bg-[#111114]/90 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
            <Hash size={18} className="text-gray-400" />
          </div>
          <div>
            <h2 className="text-gray-100 font-semibold text-base leading-none tracking-tight">
              {activeGroup.name}
            </h2>
            {activeGroup.description && (
              <p className="text-gray-500 text-xs mt-1 truncate max-w-[300px]">
                {activeGroup.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-gray-400 bg-white/5 px-3 py-1.5 rounded-full text-xs font-medium border border-white/5">
        <Users size={14} className="text-gray-500" />
        <span>{activeGroup.members?.length || 0}</span>
      </div>
    </div>
  );
}

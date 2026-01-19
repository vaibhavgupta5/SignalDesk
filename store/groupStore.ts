import { create } from "zustand";

export interface Group {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
  type?: "channel" | "dm"; // Added type
  members: string[];
  createdAt: string;
}

interface GroupState {
  groups: Group[];
  activeGroupId: string | null;
  onlineUsers: string[]; // Added onlineUsers

  setGroups: (groups: Group[]) => void;
  setOnlineUsers: (users: string[]) => void; // Setter
  addGroup: (group: Group) => void;
  setActiveGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Group>) => void;
  removeGroup: (groupId: string) => void;
  getGroupsByProject: (projectId: string) => Group[];
  fetchGroups: (projectId: string) => Promise<void>;
}

import { groupAPI } from "@/lib/api";

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  activeGroupId: null,
  onlineUsers: [],

  setGroups: (groups) => set({ groups }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  addGroup: (group) =>
    set((state) => ({
      groups: [...state.groups, group],
    })),

  setActiveGroup: (groupId) => set({ activeGroupId: groupId }),

  updateGroup: (groupId, updates) =>
    set((state) => ({
      groups: state.groups.map((g) =>
        g._id === groupId ? { ...g, ...updates } : g,
      ),
    })),

  removeGroup: (groupId) =>
    set((state) => ({
      groups: state.groups.filter((g) => g._id !== groupId),
      activeGroupId:
        state.activeGroupId === groupId ? null : state.activeGroupId,
    })),

  getGroupsByProject: (projectId) => {
    return get().groups.filter((g) => g.projectId === projectId);
  },

  fetchGroups: async (projectId) => {
    try {
      const response = await groupAPI.getByProject(projectId);
      // Append fetched groups, avoiding duplicates or simply replace if we want strict sync
      // For now, let's filter out existing ones from this project and add new ones
      // Or simpler: remove all groups for this project and add fresh ones
      const newGroups = response.data.groups;
      set((state) => ({
        groups: [
          ...state.groups.filter((g) => g.projectId !== projectId),
          ...newGroups,
        ],
      }));

      // If no active group, set first one as active
      const state = get();
      if (!state.activeGroupId && newGroups.length > 0) {
        // Prefer "general"
        const general = newGroups.find(
          (g: Group) => g.name.toLowerCase() === "general",
        );
        set({ activeGroupId: general ? general._id : newGroups[0]._id });
      }
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  },
}));

import { create } from "zustand";

export interface Project {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  members: string[];
  accentColor?: string;
}

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;

  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  setActiveProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  fetchProjects: () => Promise<void>;
}

import { projectAPI } from "@/lib/api";

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  activeProjectId: null,

  setProjects: (projects) => set({ projects }),

  addProject: (project) =>
    set((state) => ({
      projects: [...state.projects, project],
    })),

  setActiveProject: (projectId) => set({ activeProjectId: projectId }),

  updateProject: (projectId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p._id === projectId ? { ...p, ...updates } : p,
      ),
    })),

  removeProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p._id !== projectId),
      activeProjectId:
        state.activeProjectId === projectId ? null : state.activeProjectId,
    })),

  fetchProjects: async () => {
    try {
      const response = await projectAPI.getAll();
      set({ projects: response.data.projects });
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  },
}));

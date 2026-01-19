"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { useUIStore } from "@/store/uiStore";
import { useGroupStore } from "@/store/groupStore";
import { authAPI, projectAPI } from "@/lib/api";
import { socketClient } from "@/lib/socket";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, setUser, setLoading, logout } =
    useAuthStore();
  const { setProjects, setActiveProject } = useProjectStore();
  const { setGroups } = useGroupStore();
  const { setAccentColor } = useUIStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = sessionStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await authAPI.verifyToken();
        setUser(response.data.user, token);

        socketClient.connect(token);

        const projectsResponse = await projectAPI.getAll();
        const projects = projectsResponse.data.projects;
        setProjects(projects);

        // Restore active project
        if (projects.length > 0) {
          const savedId = localStorage.getItem("activeProjectId");
          const activeProject =
            projects.find((p: any) => p._id === savedId) || projects[0];

          setActiveProject(activeProject._id);
          if (activeProject.accentColor) {
            setAccentColor(activeProject.accentColor);
          }
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        logout();
        router.push("/login");
      }
    };

    initAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-base-bg">
        <div className="text-center">
          <Loader2
            className="animate-spin text-accent mx-auto mb-4"
            size={48}
          />
          <p className="text-text-secondary">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}

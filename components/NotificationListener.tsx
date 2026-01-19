"use client";

import { useEffect } from "react";
import { useProjectStore } from "@/store/projectStore";
import { useGroupStore } from "@/store/groupStore";
import { useAuthStore } from "@/store/authStore";
import { socketClient } from "@/lib/socket";
import { toast } from "sonner";

export function NotificationListener() {
  const { projects } = useProjectStore();
  const { activeGroupId } = useGroupStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || !socketClient.socket) return;

    // Join all project rooms to receive notifications
    projects.forEach((project) => {
      socketClient.socket?.emit("join-project", { projectId: project._id });
    });

    const handleNotification = (data: any) => {
      // Don't show notification if we are currently looking at this group
      if (data.groupId === activeGroupId) return;

      // Double check current user is not sender (server handles this usually, but good to be safe)
      if (data.senderId === user.id) return;

      toast(data.projectName, {
        description: `${data.groupName} • ${data.senderName}: ${data.content.substring(0, 50)}${data.content.length > 50 ? "..." : ""}`,
      });
    };

    socketClient.socket.on("notification", handleNotification);

    return () => {
      socketClient.socket?.off("notification", handleNotification);
    };
  }, [projects, activeGroupId, user]);

  return null;
}

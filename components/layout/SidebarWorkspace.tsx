"use client";

import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { socketClient } from "@/lib/socket";

export function SidebarWorkspace() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    socketClient.disconnect();
    logout();
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
    }
    router.push("/login");
  };

  return (
    <div className="w-20 bg-base-bg border-r border-base-border flex flex-col items-center py-4">
      <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-lg mb-6 cursor-pointer hover:opacity-80 transition-all-smooth">
        SD
      </div>

      <div className="flex-1" />

      <button
        onClick={handleLogout}
        className="w-12 h-12 rounded-lg hover:bg-base-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-all-smooth"
        title="Logout"
      >
        <LogOut size={20} />
      </button>
    </div>
  );
}

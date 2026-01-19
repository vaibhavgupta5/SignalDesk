"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { projectAPI } from "@/lib/api";
import { useProjectStore } from "@/store/projectStore";
import { Loader2 } from "lucide-react";

export default function InvitePage({
  params,
}: {
  params: { projectId: string };
}) {
  const router = useRouter();
  const { fetchProjects, setActiveProject } = useProjectStore(); // Need fetchProjects in store to refresh list
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading",
  );

  useEffect(() => {
    const joinProject = async () => {
      try {
        await projectAPI.join(params.projectId);
        setStatus("success");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } catch (error: any) {
        console.error("Failed to join:", error);
        setStatus("error");
      }
    };

    joinProject();
  }, [params.projectId, router]);

  if (status === "error") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-base-bg text-text-primary gap-4">
        <h1 className="text-xl font-bold text-red-500">Invitation Failed</h1>
        <p className="text-text-muted">
          You may already be a member or the link is invalid.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-base-bg text-text-primary gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-accent" />
      <h1 className="text-xl font-semibold">Joining Project...</h1>
    </div>
  );
}

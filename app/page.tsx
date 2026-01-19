"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("token");

    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="h-screen flex items-center justify-center bg-base-bg">
      <div className="text-center">
        <Loader2 className="animate-spin text-accent mx-auto mb-4" size={48} />
        <p className="text-text-secondary">Redirecting...</p>
      </div>
    </div>
  );
}

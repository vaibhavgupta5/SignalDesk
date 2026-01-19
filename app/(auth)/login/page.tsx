"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/lib/api";
import { socketClient } from "@/lib/socket";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setIsLoading(true);
      const response = await authAPI.login(email, password);
      const { user, token } = response.data;

      if (typeof window !== "undefined") {
        sessionStorage.setItem("token", token);
      }

      setUser(user, token);
      socketClient.connect(token);

      router.push("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-bg p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">SD</span>
          </div>
          <h1 className="text-text-primary text-3xl font-bold mb-2">
            Welcome to SignalDesk
          </h1>
          <p className="text-text-secondary">Sign in to your workspace</p>
        </div>

        <div className="bg-base-surface border border-base-border rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-text-secondary text-sm font-medium mb-2">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="text-accent hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        <p className="text-text-muted text-xs text-center mt-8">
          Project-based team collaboration platform
        </p>
      </div>
    </div>
  );
}

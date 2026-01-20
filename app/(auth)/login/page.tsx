"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// Replaced custom Label component with standard label tag due to resolution issues
import { useAuthStore } from "@/store/authStore";
import { authAPI } from "@/lib/api";
import { socketClient } from "@/lib/socket";
import { Loader2 } from "lucide-react";

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
    <div className="relative">
      <div className="bg-base-surface border border-base-border p-8 lg:p-12 shadow-2xl rounded-none">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-text-primary mb-2">
            Welcome Back
          </h2>
          <p className="text-text-secondary">
            Sign in to your SignalDesk account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 text-sm text-red-400 bg-red-900/10 border border-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-text-secondary"
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
              disabled={isLoading}
              className="h-12 bg-base-bg border-base-border text-text-primary focus:border-accent transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-text-secondary"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={isLoading}
              className="h-12 bg-base-bg border-base-border text-text-primary focus:border-accent transition-colors"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-accent hover:bg-accent-hover text-white font-medium transition-all shadow-[0_0_15px_rgba(124,58,237,0.2)]"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-text-muted text-sm">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-accent hover:text-accent-hover font-medium transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

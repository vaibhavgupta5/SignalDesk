"use client";

import { useRef, useEffect, ReactNode } from "react";
import Link from "next/link";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const mouseGlowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (mouseGlowRef.current) {
        mouseGlowRef.current.style.background = `radial-gradient(circle 400px at ${e.clientX}px ${e.clientY}px, rgba(124, 58, 237, 0.12), transparent 80%)`;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-base-bg">
      {/* Interactive Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]"></div>

      {/* Mouse Glow Effect */}
      <div
        ref={mouseGlowRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{ opacity: 1 }}
      />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16">
          <div>
            <Link href="/" className="inline-flex items-center space-x-3">
              <div className="text-8xl bg-black/30 border-dashed border-2 border-white/10 p-4 pb-7 font-bold tracking-tight text-white shadow-[0_0_50px_rgba(124,58,237,0.1)] group-hover:border-white/15 transition-colors duration-500 group">
                <span className="text-accent group-hover:text-white transition-colors duration-500">
                  @
                </span>
                signal
                <span className=" group-hover:text-white transition-colors duration-500">
                  DESK
                </span>
              </div>
            </Link>
          </div>

          <div className="space-y-6">
            <div className="max-w-md">
              <h1 className="text-4xl font-bold text-white mb-4">
                Slack isn’t <span className="text-accent">broken.</span> It’s
                just not{" "}
                <span className="text-accent italic underline decoration-accent/30 underline-offset-8">
                  enough.
                </span>
              </h1>
              <p className="text-text-secondary text-lg">
                Conversations disappear, decisions get lost, and execution falls
                apart. SignalDesk uses AI to turn team discussions into
                decisions, workflows, and real progress... automatically.
              </p>
            </div>

            <div className="text-sm text-text-muted font-medium">
              © 2026 SignalDesk. All rights reserved.
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center font-bold text-2xl text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                  SD
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white">SignalDesk</h2>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

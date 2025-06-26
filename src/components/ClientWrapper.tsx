"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Dynamically import AuthProvider to avoid SSR issues
const AuthProvider = dynamic(
  () => import("../context/AuthContext").then((mod) => ({ default: mod.AuthProvider })),
  { ssr: false }
);

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>;
  }

  return <AuthProvider>{children}</AuthProvider>;
}
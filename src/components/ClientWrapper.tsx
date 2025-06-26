"use client";
import { AuthProvider } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return <AuthProvider>{children}</AuthProvider>;
}
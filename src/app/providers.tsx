"use client";

import { AuthProvider as AuthProviderComponent } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProviderComponent>
      {children}
      <Toaster />
    </AuthProviderComponent>
  );
}
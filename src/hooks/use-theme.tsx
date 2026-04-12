"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export function useTheme() {
  const { barbearia } = useAuth();

  useEffect(() => {
    if (typeof document === "undefined") return;
    
    const paleta = barbearia?.paleta || "dourado";
    document.documentElement.setAttribute("data-theme", paleta);
    
    if (barbearia?.cores) {
      const root = document.documentElement;
      root.style.setProperty("--color-primary", barbearia.cores.primary);
      root.style.setProperty("--color-accent", barbearia.cores.accent);
      root.style.setProperty("--color-background", barbearia.cores.background);
      root.style.setProperty("--color-foreground", barbearia.cores.primary);
      root.style.setProperty("--color-card", barbearia.cores.background);
      root.style.setProperty("--color-popover", barbearia.cores.background);
      root.style.setProperty("--color-card-foreground", barbearia.cores.primary);
      root.style.setProperty("--color-popover-foreground", barbearia.cores.primary);
    }
  }, [barbearia?.paleta, barbearia?.cores]);
}
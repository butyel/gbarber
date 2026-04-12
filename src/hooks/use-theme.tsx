"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

const DEFAULT_CORES = {
  primary: "#212121",
  accent: "#CE9B65",
  background: "#FFFBEF",
};

export function useTheme() {
  const { barbearia } = useAuth();

  const aplicarCores = (cores: typeof DEFAULT_CORES) => {
    if (typeof document === "undefined") return;
    
    const root = document.documentElement;
    root.style.setProperty("--color-primary", cores.primary);
    root.style.setProperty("--color-accent", cores.accent);
    root.style.setProperty("--color-background", cores.background);
    root.style.setProperty("--color-card", cores.background);
    root.style.setProperty("--color-popover", cores.background);
    root.style.setProperty("--color-foreground", cores.primary);
    root.style.setProperty("--color-card-foreground", cores.primary);
    root.style.setProperty("--color-popover-foreground", cores.primary);
    root.style.setProperty("--color-primary-foreground", cores.accent);
    root.style.setProperty("--color-secondary", cores.accent);
    root.style.setProperty("--color-secondary-foreground", cores.primary);
    root.style.setProperty("--color-muted", cores.accent + "30");
    root.style.setProperty("--color-muted-foreground", cores.primary);
    root.style.setProperty("--color-accent-foreground", cores.primary);
    root.style.setProperty("--color-border", cores.accent);
    root.style.setProperty("--color-input", cores.accent);
    root.style.setProperty("--color-ring", cores.accent);
  };

  useEffect(() => {
    if (!barbearia?.cores) {
      aplicarCores(DEFAULT_CORES);
      return;
    }
    aplicarCores(barbearia.cores);
  }, [barbearia?.cores]);
}
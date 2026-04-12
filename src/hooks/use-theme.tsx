"use client";

import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

const DEFAULT_CORES = {
  primary: "#212121",
  accent: "#CE9B65",
  background: "#FFFBEF",
};

export function useTheme() {
  const { barbearia } = useAuth();

  useEffect(() => {
    if (!barbearia || !db) return;

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

    const cores = barbearia?.cores || DEFAULT_CORES;
    aplicarCores(cores);
  }, [barbearia]);

  useEffect(() => {
    if (!db) return;
    
    const buscarCoresAtualizadas = async () => {
      if (!barbearia?.id) return;
      
      try {
        const docRef = doc(db, "barbearias", barbearia.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.cores) {
            const root = document.documentElement;
            root.style.setProperty("--color-primary", data.cores.primary);
            root.style.setProperty("--color-accent", data.cores.accent);
            root.style.setProperty("--color-background", data.cores.background);
            root.style.setProperty("--color-card", data.cores.background);
            root.style.setProperty("--color-popover", data.cores.background);
            root.style.setProperty("--color-foreground", data.cores.primary);
            root.style.setProperty("--color-card-foreground", data.cores.primary);
            root.style.setProperty("--color-popover-foreground", data.cores.primary);
            root.style.setProperty("--color-primary-foreground", data.cores.accent);
            root.style.setProperty("--color-secondary", data.cores.accent);
            root.style.setProperty("--color-secondary-foreground", data.cores.primary);
            root.style.setProperty("--color-muted", data.cores.accent + "30");
            root.style.setProperty("--color-muted-foreground", data.cores.primary);
            root.style.setProperty("--color-accent-foreground", data.cores.primary);
            root.style.setProperty("--color-border", data.cores.accent);
            root.style.setProperty("--color-input", data.cores.accent);
            root.style.setProperty("--color-ring", data.cores.accent);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar cores:", error);
      }
    };

    buscarCoresAtualizadas();
  }, [barbearia?.id, db]);
}
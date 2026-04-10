"use client";

import { usePathname } from "next/navigation";
import { Bell, User, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/servicos": "Serviços",
  "/dashboard/atendimentos": "Atendimentos",
  "/dashboard/barbeiros": "Barbeiros",
  "/dashboard/produtos": "Produtos",
  "/dashboard/caixa": "Caixa do Dia",
  "/dashboard/relatorios": "Relatórios",
  "/dashboard/configuracoes": "Configurações",
  "/dashboard/admin": "Admin",
};

export function Topbar({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAdmin, barbearia } = useAuth();

  const title = pageTitles[pathname] || "Dashboard";
  const displayTitle = pathname === "/dashboard" && barbearia 
    ? `Dashboard - ${barbearia.nome}` 
    : title;

  return (
    <header className="sticky top-0 z-20 h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground">{displayTitle}</h1>
      </div>

      <div className="flex items-center gap-3">
        {action}
        
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 ml-2">
          <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
            {isAdmin ? <Crown className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-primary" />}
          </div>
          <span className="text-sm font-medium hidden sm:inline">
            {user?.nome}
          </span>
        </div>
      </div>
    </header>
  );
}
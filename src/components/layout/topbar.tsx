"use client";

import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Bell, Crown, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/agenda": "Agenda",
  "/dashboard/clientes": "Clientes",
  "/dashboard/servicos": "Serviços",
  "/dashboard/atendimentos": "Atendimentos",
  "/dashboard/barbeiros": "Barbeiros",
  "/dashboard/produtos": "Produtos",
  "/dashboard/caixa": "Caixa do Dia",
  "/dashboard/relatorios": "Relatórios",
  "/dashboard/configuracoes": "Configurações",
  "/dashboard/planos": "Planos",
  "/dashboard/admin": "Admin",
};

export function Topbar({ action }: { action?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, barbearia, logout } = useAuth();

  const title = pageTitles[pathname] || "Dashboard";
  const displayTitle = pathname === "/dashboard" && barbearia 
    ? `Dashboard - ${barbearia.nome}` 
    : title;

  const planoAtual = "Free";

  return (
    <header className="sticky top-0 z-30 h-16 md:h-20 glass-panel border-b border-white/20 px-4 md:px-8 lg:px-12 flex items-center justify-between transition-all duration-300">
      <div className="flex items-center gap-4">
        <div className="md:hidden w-10" /> {/* Space for menu button */}
        <h1 className="text-lg md:text-2xl font-black tracking-tight text-primary truncate max-w-[200px] md:max-w-none">
          {displayTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {action}
        
        <Button variant="ghost" size="icon" className="hidden sm:flex" onClick={() => router.push("/dashboard/alertas")}>
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 py-1.5 h-auto">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                {isAdmin ? <Crown className="h-4 w-4 text-primary" /> : <User className="h-4 w-4 text-primary" />}
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">{user?.nome}</span>
                <span className="text-xs text-muted-foreground">{planoAtual}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="md:hidden">
              <span className="text-sm font-medium">{user?.nome}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="md:hidden" />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-accent">
                  <Crown className="mr-2 h-4 w-4" />
                  <span>Upgrade Pro</span>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
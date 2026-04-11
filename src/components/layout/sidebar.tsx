"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Scissors, 
  Users, 
  Package, 
  Wallet, 
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Crown,
  Calendar,
  User,
  ClipboardList,
  X,
  ChevronLeft,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/atendimentos", label: "Atendimentos", icon: ClipboardList },
  { href: "/dashboard/clientes", label: "Clientes", icon: User },
  { href: "/dashboard/barbeiros", label: "Barbeiros", icon: Users },
  { href: "/dashboard/caixa", label: "Caixa", icon: Wallet },
  { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
  { href: "/dashboard/servicos", label: "Serviços", icon: Scissors },
  { href: "/dashboard/produtos", label: "Produtos", icon: Package },
  { href: "/dashboard/alertas", label: "Alertas", icon: Bell },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

export function Sidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const adminItems = isAdmin ? [
    { href: "/dashboard/admin", label: "Admin", icon: Crown },
  ] : [];

  const allItems = [...navItems, ...adminItems];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50 bg-primary text-primary-foreground"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-primary text-primary-foreground flex flex-col transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-secondary">
          {mobileOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-accent">GBarber</h1>
              <p className="text-xs text-muted-foreground mt-1 truncate max-w-[150px]">
                {isAdmin ? "Painel Admin" : user?.nome || "Minha Barbearia"}
              </p>
            </div>
          )}
          {isCollapsed && (
            <div className="flex-1 flex justify-center">
              <span className="text-accent font-bold text-lg">GB</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("text-muted-foreground hover:text-primary-foreground", mobileOpen && "md:hidden")}
            onClick={onToggle}
          >
            <ChevronLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {allItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-primary-foreground",
                  isCollapsed && "justify-center"
                )}
                onClick={() => setMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-secondary">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-muted-foreground hover:bg-destructive hover:text-destructive-foreground",
              isCollapsed && "justify-center px-2"
            )}
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3">Sair</span>}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-accent text-primary hover:bg-accent/80 shadow-md hidden md:flex items-center justify-center"
          onClick={onToggle}
        >
          <ChevronLeft className={cn("h-3 w-3 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </aside>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
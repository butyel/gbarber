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
  Bell,
  CreditCard
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
  { href: "/dashboard/planos", label: "Planos", icon: CreditCard },
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
        className="md:hidden fixed top-4 left-4 z-50 bg-[#1A2E21] text-[#C9A84C]"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-[#1A2E21] text-[#C9A84C] flex flex-col transition-all duration-500 ease-in-out border-r border-white/5",
          isCollapsed ? "w-20" : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Subtle Background pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-grid-pattern" />
        
        <div className="flex items-center justify-between p-6 border-b border-white/10 relative z-10">
          {!isCollapsed && (
            <div className="animate-scale-in">
              <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-accent text-primary flex items-center justify-center text-xl">G</span>
                GBarber
              </h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent/80">
                  {isAdmin ? "Administrator" : user?.nome || "Premium Studio"}
                </p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex-1 flex justify-center animate-scale-in">
              <span className="w-10 h-10 rounded-xl bg-accent text-primary flex items-center justify-center font-black text-xl shadow-lg shadow-accent/20">G</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto relative z-10 custom-scrollbar">
          {allItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group relative",
                  isActive
                    ? "bg-accent text-primary shadow-lg shadow-accent/20"
                    : "text-white/60 hover:bg-white/5 hover:text-white",
                  isCollapsed && "justify-center px-0"
                )}
                onClick={() => setMobileOpen(false)}
                title={isCollapsed ? item.label : undefined}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110", isActive && "scale-110")} />
                {!isCollapsed && <span className="truncate tracking-tight">{item.label}</span>}
                {isActive && !isCollapsed && (
                  <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 relative z-10 bg-[#1A2E21]/50 backdrop-blur-md">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-white/50 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 rounded-xl h-12",
              isCollapsed && "justify-center px-0"
            )}
            onClick={logout}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span className="ml-3 font-bold tracking-tight">Sair da Conta</span>}
          </Button>
        </div>

        {/* Floating Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-accent text-primary hover:bg-white shadow-xl hidden md:flex items-center justify-center border border-white/20 transition-all duration-500 hover:scale-110"
          onClick={onToggle}
        >
          <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-500", isCollapsed && "rotate-180")} />
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
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
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/agenda", label: "Agenda", icon: Calendar },
  { href: "/dashboard/clientes", label: "Clientes", icon: User },
  { href: "/dashboard/servicos", label: "Serviços", icon: Scissors },
  { href: "/dashboard/atendimentos", label: "Atendimentos", icon: Scissors },
  { href: "/dashboard/barbeiros", label: "Barbeiros", icon: Users },
  { href: "/dashboard/produtos", label: "Produtos", icon: Package },
  { href: "/dashboard/caixa", label: "Caixa", icon: Wallet },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const adminItems = isAdmin ? [
    { href: "/dashboard/admin", label: "Admin", icon: Crown },
  ] : [];

  const allItems = [...navItems, ...adminItems];

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-6 w-6" />
      </Button>

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen w-64 bg-primary text-primary-foreground flex flex-col transition-transform duration-200",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-secondary">
          <h1 className="text-xl font-bold text-accent">GBarber</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? "Painel Admin" : user?.nome || "Minha Barbearia"}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {allItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-primary-foreground"
                )}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-secondary space-y-2">
          <Link
            href="/dashboard/configuracoes"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-primary-foreground transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <Settings className="h-5 w-5" />
            Configurações
          </Link>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
            onClick={logout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
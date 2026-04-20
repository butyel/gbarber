"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Search, FileText, Users, Calendar, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyType = "clients" | "appointments" | "services" | "barbers" | "search" | "products" | "generic";

interface EmptyStateProps {
  type?: EmptyType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const illustrations: Record<EmptyType, React.ReactNode> = {
  clients: <Users className="h-12 w-12" />,
  appointments: <Calendar className="h-12 w-12" />,
  services: <Scissors className="h-12 w-12" />,
  barbers: <Users className="h-12 w-12" />,
  search: <Search className="h-12 w-12" />,
  products: <FileText className="h-12 w-12" />,
  generic: <FileText className="h-12 w-12" />,
};

const defaults: Record<EmptyType, { title: string; description: string }> = {
  clients: {
    title: "Nenhum cliente cadastrado",
    description: "Comece adicionando seus primeiros clientes para gerenciar seus agendamentos.",
  },
  appointments: {
    title: "Nenhum atendimento registrado",
    description: "Agende seu primeiro atendimento para começar a operar.",
  },
  services: {
    title: "Nenhum serviço cadastrado",
    description: "Adicione os serviços que você oferece na sua barbearia.",
  },
  barbers: {
    title: "Nenhum barbeiro cadastrado",
    description: "Cadastre seus barbeiros para gerenciar comissões e agendamentos.",
  },
  search: {
    title: "Nenhum resultado encontrado",
    description: "Tente buscar com outros termos ou limpe os filtros.",
  },
  products: {
    title: "Nenhum produto cadastrado",
    description: "Adicione os produtos que você vende na sua barbearia.",
  },
  generic: {
    title: "Nada aqui ainda",
    description: "Esta área está vazia.",
  },
};

export const EmptyState = memo(function EmptyState({
  type = "generic",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const defaultConfig = defaults[type];

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mb-6 text-muted-foreground/40">
        {illustrations[type]}
      </div>
      
      <h3 className="text-lg font-semibold mb-2">
        {title || defaultConfig.title}
      </h3>
      
      <p className="text-muted-foreground max-w-sm mb-6">
        {description || defaultConfig.description}
      </p>
      
      {action && (
        <Button onClick={action.onClick}>
          <Plus className="h-4 w-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  );
});

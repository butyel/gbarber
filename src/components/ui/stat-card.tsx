"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  description?: string;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
  className?: string;
  valueClassName?: string;
}

export const StatCard = memo(function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  trendLabel = "vs ontem",
  loading = false,
  className,
  valueClassName,
}: StatCardProps) {
  if (loading) {
    return (
      <Card className={cn("glass-card border-none", className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-32 mb-1" />
          <Skeleton className="h-4 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "glass-card border-none transition-all duration-500 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group animate-scale-in", 
      className
    )}>
      {/* Background Glow */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors duration-500" />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        {icon && (
          <div className="p-2 rounded-xl bg-secondary/50 text-primary transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:scale-110 group-hover:rotate-3 shadow-sm">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className={cn("text-3xl font-black tracking-tight mb-1", valueClassName)}>{value}</div>
        
        <div className="flex items-center gap-2">
          {trend !== undefined && trend !== 0 && (
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
              trend >= 0 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
          {description && (
            <p className="text-[11px] text-muted-foreground font-medium">{description || trendLabel}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

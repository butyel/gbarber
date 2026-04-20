"use client";

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  Tooltip as RechartsTooltip,
  LineChart as RechartsLineChart,
  Line,
  ResponsiveContainer as RechartsResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface FaturamentoChartProps {
  data: { dia: string; valor: number }[];
}

export function FaturamentoChart({ data }: FaturamentoChartProps) {
  return (
    <RechartsResponsiveContainer width="100%" height={160}>
      <RechartsBarChart data={data}>
        <RechartsXAxis dataKey="dia" tick={{ fontSize: 12 }} />
        <RechartsYAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
        <RechartsTooltip 
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
        />
        <Bar dataKey="valor" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </RechartsResponsiveContainer>
  );
}

interface AtendimentosChartProps {
  data: { hora: string; count: number }[];
  empty?: boolean;
}

export function AtendimentosChart({ data, empty }: AtendimentosChartProps) {
  if (empty) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
        Nenhum atendimento hoje
      </div>
    );
  }

  return (
    <RechartsResponsiveContainer width="100%" height={160}>
      <RechartsLineChart data={data}>
        <RechartsXAxis dataKey="hora" tick={{ fontSize: 12 }} />
        <RechartsYAxis tick={{ fontSize: 12 }} />
        <RechartsTooltip 
          contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
        />
        <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b" }} />
      </RechartsLineChart>
    </RechartsResponsiveContainer>
  );
}

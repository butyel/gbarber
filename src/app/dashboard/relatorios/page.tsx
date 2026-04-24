"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChart3, TrendingUp, Calendar, Search } from "lucide-react";
import type { Atendimento, Servico } from "@/types";

interface RelatorioData {
  dias: { data: string; faturamento: number; atendimentos: number }[];
  servicosMaisVendidos: { nome: string; count: number; valor: number }[];
  barbeirosPerformance: { nome: string; atendimentos: number; comissao: number; valor: number }[];
  totalFaturamento: number;
  totalAtendimentos: number;
  ticketMedio: number;
}

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("7");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [data, setData] = useState<RelatorioData | null>(null);

  useEffect(() => {
    if (!user) return;
    if (periodo !== "custom") {
      fetchData();
    }
  }, [user, periodo]);

  const handleCustomSearch = () => {
    if (!dataInicio || !dataFim) {
      alert("Selecione ambas as datas");
      return;
    }
    const start = new Date(dataInicio);
    const end = new Date(dataFim);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 90) {
      alert("O intervalo máximo é de 90 dias");
      return;
    }
    fetchData();
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let startDate = new Date();
      let endDate = new Date();
      
      if (periodo === "custom") {
        startDate = new Date(dataInicio + "T00:00:00");
        endDate = new Date(dataFim + "T23:59:59");
      } else {
        const dias = parseInt(periodo);
        startDate.setDate(startDate.getDate() - dias);
      }

      const constraints = [
        where("createdAt", ">=", startDate),
        orderBy("createdAt", "desc")
      ];
      
      if (periodo === "custom") {
        constraints.push(where("createdAt", "<=", endDate));
      }

      const appointmentsSnap = await getDocs(query(
        collection(db, `barbearias/${user.id}/atendimentos`),
        ...constraints
      ));

      const servicosSnap = await getDocs(query(
        collection(db, `barbearias/${user.id}/servicos`),
        orderBy("nome")
      ));

      const appointments = appointmentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Atendimento[];

      const servicos = servicosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Servico[];

      const diasAgrupados: Record<string, { faturamento: number; atendimentos: number }> = {};
      
      appointments.forEach(a => {
        const dataKey = a.createdAt.toISOString().split("T")[0];
        if (!diasAgrupados[dataKey]) {
          diasAgrupados[dataKey] = { faturamento: 0, atendimentos: 0 };
        }
        diasAgrupados[dataKey].faturamento += a.valor + (a.produtoVendido?.valor || 0);
        diasAgrupados[dataKey].atendimentos += 1;
      });

      const diasArray = Object.entries(diasAgrupados)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, valores]) => ({
          data,
          faturamento: valores.faturamento,
          atendimentos: valores.atendimentos,
        }));

      const servicosContagem: Record<string, { count: number; valor: number }> = {};
      appointments.forEach(a => {
        if (!servicosContagem[a.servicoNome]) {
          servicosContagem[a.servicoNome] = { count: 0, valor: 0 };
        }
        servicosContagem[a.servicoNome].count += 1;
        servicosContagem[a.servicoNome].valor += a.valor;
      });

      const servicosMaisVendidos = Object.entries(servicosContagem)
        .map(([nome, valores]) => ({ nome, ...valores }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const barbeirosContagem: Record<string, { atendimentos: number; comissao: number; valor: number }> = {};
      appointments.forEach(a => {
        if (!barbeirosContagem[a.barbeiroNome]) {
          barbeirosContagem[a.barbeiroNome] = { atendimentos: 0, comissao: 0, valor: 0 };
        }
        barbeirosContagem[a.barbeiroNome].atendimentos += 1;
        barbeirosContagem[a.barbeiroNome].comissao += a.comissao;
        barbeirosContagem[a.barbeiroNome].valor += a.valor;
      });

      const barbeirosPerformance = Object.entries(barbeirosContagem)
        .map(([nome, valores]) => ({ nome, ...valores }))
        .sort((a, b) => b.valor - a.valor);

      const totalFaturamento = appointments.reduce((sum, a) => sum + a.valor + (a.produtoVendido?.valor || 0), 0);
      const totalComissoes = appointments.reduce((sum, a) => sum + a.comissao, 0);

      setData({
        dias: diasArray,
        servicosMaisVendidos,
        barbeirosPerformance,
        totalFaturamento,
        totalAtendimentos: appointments.length,
        ticketMedio: appointments.length > 0 ? totalFaturamento / appointments.length : 0,
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const maxFaturamento = data ? Math.max(...data.dias.map(d => d.faturamento), 1) : 1;

  return (
    <div className="min-h-screen">
      <Topbar 
        action={
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 2 meses</SelectItem>
              <SelectItem value="90">Últimos 3 meses</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="p-6 space-y-6">
        {periodo === "custom" && (
          <Card className="p-4 glass-card border-accent/20">
            <div className="flex flex-col sm:flex-row items-end gap-4">
              <div className="grid gap-2">
                <label className="text-xs font-medium uppercase tracking-wider text-accent/70">Data Início</label>
                <input 
                  type="date" 
                  value={dataInicio} 
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-medium uppercase tracking-wider text-accent/70">Data Fim</label>
                <input 
                  type="date" 
                  value={dataFim} 
                  onChange={(e) => setDataFim(e.target.value)}
                  className="bg-background border border-white/10 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <Button onClick={handleCustomSearch} className="bg-accent text-primary hover:bg-accent/90">
                <Search className="h-4 w-4 mr-2" />
                Filtrar Período
              </Button>
            </div>
          </Card>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold">{formatCurrency(data?.totalFaturamento || 0)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Atendimentos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{data?.totalAtendimentos || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold">{formatCurrency(data?.ticketMedio || 0)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Faturamento por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="space-y-3">
                  {data?.dias.map((dia, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{formatDate(dia.data)}</span>
                        <span className="font-medium">{formatCurrency(dia.faturamento)}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${(dia.faturamento / maxFaturamento) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!data?.dias || data.dias.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">Sem dados para o período</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Serviços Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <div className="space-y-4">
                  {data?.servicosMaisVendidos.map((servico, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{servico.nome}</p>
                        <p className="text-sm text-muted-foreground">{servico.count}x</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(servico.valor)}</p>
                      </div>
                    </div>
                  ))}
                  {(!data?.servicosMaisVendidos || data.servicosMaisVendidos.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">Sem dados para o período</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance dos Barbeiros</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="space-y-4">
                {data?.barbeirosPerformance.map((barbeiro, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{barbeiro.nome}</p>
                        <p className="text-sm text-muted-foreground">{barbeiro.atendimentos} atendimentos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{formatCurrency(barbeiro.valor)}</p>
                      <p className="text-sm text-muted-foreground">Comissão: {formatCurrency(barbeiro.comissao)}</p>
                    </div>
                  </div>
                ))}
                {(!data?.barbeirosPerformance || data.barbeirosPerformance.length === 0) && (
                  <p className="text-center text-muted-foreground py-8">Sem dados para o período</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
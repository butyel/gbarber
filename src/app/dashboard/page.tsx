"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatTime } from "@/lib/utils";
import { DollarSign, Users, Receipt, TrendingUp, TrendingDown, Plus, Wallet, Award } from "lucide-react";
import type { Atendimento } from "@/types";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, barbearia } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    faturamentoDia: 0,
    atendimentosDia: 0,
    ticketMedio: 0,
    comissoesDia: 0,
    lucroDia: 0,
    crescimento: 0,
    yesterdayFaturamento: 0,
  });
  const [topBarbeiro, setTopBarbeiro] = useState<{ nome: string; valor: number } | null>(null);
  const [topServico, setTopServico] = useState<{ nome: string; quantidade: number } | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<Atendimento[]>([]);

  useEffect(() => {
    if (!user || !db) return;
    fetchData();
  }, [user, db]);

  const fetchData = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const yesterday = new Date(todayStart);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = new Date(yesterday);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);

      const allAppointmentsRef = collection(db, `barbearias/${user.id}/atendimentos`);
      const allSnap = await getDocs(query(allAppointmentsRef, orderBy("createdAt", "desc")));
      
      const allAppointments = allSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Atendimento[];

      const todayAppointments = allAppointments.filter(a => a.createdAt >= todayStart);
      const yesterdayAppointments = allAppointments.filter(a => 
        a.createdAt >= yesterdayStart && a.createdAt <= yesterdayEnd
      );

      const faturamentoDia = todayAppointments.reduce((sum, a) => sum + a.valor, 0);
      const comissoesDia = todayAppointments.reduce((sum, a) => sum + a.comissao, 0);
      const lucroDia = faturamentoDia - comissoesDia;
      const count = todayAppointments.length;
      
      const yesterdayFaturamento = yesterdayAppointments.reduce((sum, a) => sum + a.valor, 0);
      const crescimento = yesterdayFaturamento > 0 
        ? ((faturamentoDia - yesterdayFaturamento) / yesterdayFaturamento) * 100 
        : yesterdayFaturamento === 0 && faturamentoDia > 0 ? 100 : 0;

      setStats({
        faturamentoDia,
        atendimentosDia: count,
        ticketMedio: count > 0 ? faturamentoDia / count : 0,
        comissoesDia,
        lucroDia,
        crescimento,
        yesterdayFaturamento,
      });

      setRecentAppointments(todayAppointments.slice(0, 10));

      const barbeiroFaturamento: Record<string, number> = {};
      const servicoCount: Record<string, number> = {};
      
      todayAppointments.forEach(a => {
        barbeiroFaturamento[a.barbeiroNome] = (barbeiroFaturamento[a.barbeiroNome] || 0) + a.valor;
        servicoCount[a.servicoNome] = (servicoCount[a.servicoNome] || 0) + 1;
      });

      if (Object.keys(barbeiroFaturamento).length > 0) {
        const top = Object.entries(barbeiroFaturamento).reduce((a, b) => a[1] > b[1] ? a : b);
        setTopBarbeiro({ nome: top[0], valor: top[1] });
      }

      if (Object.keys(servicoCount).length > 0) {
        const top = Object.entries(servicoCount).reduce((a, b) => a[1] > b[1] ? a : b);
        setTopServico({ nome: top[0], quantidade: top[1] });
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Topbar
        action={
          <div className="flex gap-2">
            <Button onClick={() => router.push("/dashboard/atendimentos")} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Novo</span>
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/caixa")} size="sm" className="hidden sm:flex">
              <Wallet className="h-4 w-4 mr-2" />
              Caixa
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(stats.faturamentoDia)}</div>
                  {stats.crescimento !== 0 && (
                    <p className={`text-xs ${stats.crescimento >= 0 ? "text-green-500" : "text-red-500"} flex items-center gap-1`}>
                      {stats.crescimento >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(stats.crescimento).toFixed(1)}% vs ontem
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro do Dia</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.lucroDia)}</div>
                  <p className="text-xs text-muted-foreground">Receita - Comissões</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.atendimentosDia}</div>
                  <p className="text-xs text-muted-foreground">Clientes hoje</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(stats.ticketMedio)}</div>
                  <p className="text-xs text-muted-foreground">Por atendimento</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topBarbeiro && (
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  Barbeiro do Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{topBarbeiro.nome}</div>
                <p className="text-sm text-muted-foreground">{formatCurrency(topBarbeiro.valor)} faturado</p>
              </CardContent>
            </Card>
          )}

          {topServico && (
            <Card className="bg-gradient-to-br from-accent/10 to-accent/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-accent" />
                  Serviço Mais Vendida
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{topServico.nome}</div>
                <p className="text-sm text-muted-foreground">{topServico.quantidade} atendimentos</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="overflow-x-auto">
          <CardHeader>
            <CardTitle>Últimos Atendimentos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Barbeiro</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Hora</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      </TableRow>
                    ))
                  ) : recentAppointments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum atendimento hoje
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentAppointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell className="font-medium">{appointment.cliente}</TableCell>
                        <TableCell className="whitespace-nowrap">{appointment.barbeiroNome}</TableCell>
                        <TableCell className="whitespace-nowrap">{appointment.servicoNome}</TableCell>
                        <TableCell>{formatCurrency(appointment.valor)}</TableCell>
                        <TableCell>{formatTime(appointment.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
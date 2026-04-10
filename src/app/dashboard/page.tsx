"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatTime, getToday } from "@/lib/utils";
import { DollarSign, Users, Receipt, TrendingUp, Plus, Wallet } from "lucide-react";
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
  });
  const [recentAppointments, setRecentAppointments] = useState<Atendimento[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const today = getToday();
        const todayStart = new Date(today);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const appointmentsRef = collection(db, `barbearias/${user.id}/atendimentos`);
        const q = query(
          appointmentsRef,
          where("createdAt", ">=", todayStart),
          where("createdAt", "<=", todayEnd),
          orderBy("createdAt", "desc"),
          limit(10)
        );

        const snapshot = await getDocs(q);
        const appointments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Atendimento[];

        setRecentAppointments(appointments);

        const faturamento = appointments.reduce((sum, a) => sum + a.valor, 0);
        const comissoes = appointments.reduce((sum, a) => sum + a.comissao, 0);
        const count = appointments.length;

        setStats({
          faturamentoDia: faturamento,
          atendimentosDia: count,
          ticketMedio: count > 0 ? faturamento / count : 0,
          comissoesDia: comissoes,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <div className="min-h-screen">
      <Topbar
        action={
          <div className="flex gap-2">
            <Button onClick={() => router.push("/dashboard/atendimentos")}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Atendimento
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard/caixa")}>
              <Wallet className="h-4 w-4 mr-2" />
              Fechar Caixa
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  <p className="text-xs text-muted-foreground">Total de serviços</p>
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(stats.comissoesDia)}</div>
                  <p className="text-xs text-muted-foreground">Total do dia</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Últimos Atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <TableCell>{appointment.barbeiroNome}</TableCell>
                      <TableCell>{appointment.servicoNome}</TableCell>
                      <TableCell>{formatCurrency(appointment.valor)}</TableCell>
                      <TableCell>{formatTime(appointment.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
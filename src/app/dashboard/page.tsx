"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatTime } from "@/lib/utils";
import { DollarSign, Users, Receipt, TrendingUp, TrendingDown, Plus, Wallet, Award, Cake } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import type { Atendimento } from "@/types";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    faturamentoDia: 0,
    atendimentosDia: 0,
    ticketMedio: 0,
    comissoesDia: 0,
    lucroDia: 0,
    crescimento: 0,
  });
  const [topBarbeiro, setTopBarbeiro] = useState<{ nome: string; valor: number } | null>(null);
  const [topServico, setTopServico] = useState<{ nome: string; quantidade: number } | null>(null);
  const [recentAppointments, setRecentAppointments] = useState<Atendimento[]>([]);
  const [faturamentoSemanal, setFaturamentoSemanal] = useState<{ dia: string; valor: number }[]>([]);
  const [atendimentosHora, setAtendimentosHora] = useState<{ hora: string; count: number }[]>([]);
  const [aniversariantesSemana, setAniversariantesSemana] = useState<{ nome: string; data: string }[]>([]);

  useEffect(() => {
    if (!user || !db) return;
    fetchData();
  }, [user, db]);

  const fetchData = async () => {
    try {
      const now = new Date();
      const todayString = format(now, "yyyy-MM-dd");
      const yesterdayString = format(addDays(now, -1), "yyyy-MM-dd");

      const allAppointmentsRef = collection(db, `barbearias/${user.id}/atendimentos`);
      const allSnap = await getDocs(query(allAppointmentsRef, orderBy("createdAt", "desc")));
      
      const allAppointments = allSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Atendimento[];

      // Filter by the planned 'data' field, not createdAt
      const todayAppointments = allAppointments.filter(a => a.data === todayString);
      const todayFinalized = todayAppointments.filter(a => a.status === "finalizado");
      const yesterdayFinalized = allAppointments.filter(a => 
        a.data === yesterdayString && a.status === "finalizado"
      );

      const faturamentoDia = todayFinalized.reduce((sum, a) => sum + a.valor, 0);
      const comissoesDia = todayFinalized.reduce((sum, a) => sum + a.comissao, 0);
      const lucroDia = faturamentoDia - comissoesDia;
      const count = todayAppointments.length; // Count all planned for today
      
      const yesterdayFaturamento = yesterdayFinalized.reduce((sum, a) => sum + a.valor, 0);
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

        // Calculate values for chart using the 'data' field
        const today = new Date();
        const semanal: { dia: string; valor: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = addDays(today, -i);
          const dString = format(d, "yyyy-MM-dd");
          const doDia = allAppointments.filter(a => a.data === dString && a.status === "finalizado");
          const valor = doDia.reduce((sum, a) => sum + a.valor, 0);
          
          semanal.push({
            dia: format(d, "EEE", { locale: ptBR }),
            valor,
          });
        }
      setFaturamentoSemanal(semanal);

      const horaCount: Record<string, number> = {};
      todayAppointments.forEach(a => {
        const hora = a.createdAt.getHours();
        const label = `${hora}h`;
        horaCount[label] = (horaCount[label] || 0) + 1;
      });
      
      const horaData = Object.entries(horaCount)
        .map(([hora, count]) => ({ hora, count }))
        .sort((a, b) => parseInt(a.hora) - parseInt(b.hora));
      setAtendimentosHora(horaData);

      // Buscar aniversariantes da semana
      const clientesSnap = await getDocs(collection(db, `barbearias/${user.id}/clientes`));
      const niverData: { nome: string; data: string }[] = [];
      const hoje = new Date();
      
      clientesSnap.forEach(doc => {
        const cliente = doc.data();
        if (cliente.dataNascimento) {
          const birthDate = new Date(cliente.dataNascimento + "T12:00:00");
          const birthMonth = birthDate.getMonth();
          const birthDay = birthDate.getDate();
          
          const thisYearBirth = new Date(hoje.getFullYear(), birthMonth, birthDay);
          const diffTime = thisYearBirth.getTime() - hoje.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays >= 0 && diffDays <= 7) {
            niverData.push({
              nome: cliente.nome,
              data: `${birthDay.toString().padStart(2, '0')}/${(birthMonth + 1).toString().padStart(2, '0')}`,
            });
          }
        }
      });
      setAniversariantesSemana(niverData);

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

          {aniversariantesSemana.length > 0 && (
            <Card className="bg-[#7A3B2E]/10 border-[#7A3B2E]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-[#7A3B2E]">
                  <Cake className="h-4 w-4" />
                  Aniversariantes da Semana
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {aniversariantesSemana.map((niver, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white/50 p-2 rounded text-sm">
                      <span className="font-medium text-[#7A3B2E] font-bold">{niver.nome}</span>
                      <span className="text-[#7A3B2E]/80 font-bold">{niver.data}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Faturamento últimos 7 dias</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={faturamentoSemanal}>
                    <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Bar dataKey="valor" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Atendimentos por hora (Hoje)</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-40 w-full" />
              ) : atendimentosHora.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-muted-foreground text-sm">
                  Nenhum atendimento hoje
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={atendimentosHora}>
                    <XAxis dataKey="hora" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
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
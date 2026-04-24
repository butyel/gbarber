"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Scissors, User, Calendar, Clock, DollarSign, Check, X, Loader2, LogOut } from "lucide-react";
import { cn, formatCurrency, getToday } from "@/lib/utils";
import type { Atendimento } from "@/types";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

import { StatCard } from "@/components/ui/stat-card";

function BarbearDashboard() {
  const searchParams = useSearchParams();
  const barbeariaId = searchParams.get("barbearia");
  const barbeiroId = searchParams.get("barbeiro");

  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [barbeiroNome, setBarbeiroNome] = useState("");
  const [comissaoPercent, setComissaoPercent] = useState(40);
  
  const [agenda, setAgenda] = useState<Atendimento[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Atendimento[]>([]);

  useEffect(() => {
    if (!barbeariaId || !barbeiroId) return;
    fetchData();
  }, [barbeariaId, barbeiroId]);

  const fetchData = async () => {
    if (!barbeariaId || !barbeiroId) return;
    try {
      const barberDoc = await getDoc(doc(db, `barbearias/${barbeariaId}/barbeiros`, barbeiroId));
      if (barberDoc.exists()) {
        const bData = barberDoc.data();
        setBarbeiroNome(bData.nome || "Barbeiro");
        setComissaoPercent(bData.comissaoServico || 40);
      }

      const appointmentsSnap = await getDocs(query(
        collection(db, `barbearias/${barbeariaId}/atendimentos`),
        where("barbeiroId", "==", barbeiroId),
        orderBy("data", "asc"),
        orderBy("hora", "asc")
      ));

      const appointments = appointmentsSnap.docs
        .filter(d => ["agendado", "em_atendimento", "finalizado"].includes(d.data().status))
        .map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
        })) as Atendimento[];

      const today = getToday();
      const todayAppts = appointments.filter(a => a.data === today);
      
      setAgenda(appointments.filter(a => a.status !== "finalizado"));
      setTodayAppointments(todayAppts.filter(a => a.status !== "cancelado"));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarAtendimento = async (id: string) => {
    if (!barbeariaId) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, `barbearias/${barbeariaId}/atendimentos`, id), {
        status: "em_atendimento",
        startedAt: serverTimestamp(),
      });
      toast({ title: "Atendimento iniciado!" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro" });
    } finally {
      setSubmitting(false);
    }
  };

  const concluirAtendimento = async (id: string) => {
    if (!barbeariaId) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, `barbearias/${barbeariaId}/atendimentos`, id), {
        status: "finalizado",
        completedAt: serverTimestamp(),
      });
      toast({ title: "Atendimento concluído!" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro" });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelarAtendimento = async (id: string) => {
    if (!barbeariaId || !confirm("Cancelar este agendamento?")) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, `barbearias/${barbeariaId}/atendimentos`, id), {
        status: "cancelado",
        cancelledAt: serverTimestamp(),
      });
      toast({ title: "Agendamento cancelado" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro" });
    } finally {
      setSubmitting(false);
    }
  };

  const comissaoHoje = todayAppointments
    .filter(a => a.status === "finalizado")
    .reduce((sum, a) => sum + a.comissao, 0);

  const comissaoTotal = todayAppointments
    .filter(a => a.status === "finalizado")
    .reduce((sum, a) => sum + a.comissao, 0);

  const proximos = agenda.filter(a => a.status === "agendado");

  return (
    <div className="min-h-screen bg-mesh">
      <div className="bg-primary text-white border-b border-white/10 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-accent/20 rounded-full blur-[80px]" />
        
        <div className="max-w-5xl mx-auto p-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-accent text-primary flex items-center justify-center font-black text-2xl shadow-lg shadow-accent/20">
                  {barbeiroNome.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
                    {barbeiroNome}
                    <span className="text-accent text-4xl leading-none">.</span>
                  </h1>
                  <p className="text-accent/70 font-bold uppercase tracking-widest text-[10px] mt-0.5">Staff Portal & Dashboard</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 animate-slide-up" style={{ animationDelay: '50ms' }}>
              <div className="text-right hidden md:block mr-2">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Sessão Ativa</p>
                <p className="font-bold">{format(new Date(), "dd 'de' MMMM", { locale: ptBR })}</p>
              </div>
              <Link href="/login">
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl border border-white/10 hover:bg-white/10 text-white transition-all hover:scale-105 active:scale-95">
                  <LogOut className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
        <div className="grid gap-6 md:grid-cols-3">
          <StatCard 
            title="Minha Comissão Hoje"
            value={formatCurrency(comissaoHoje)}
            icon={<DollarSign className="h-5 w-5" />}
            valueClassName="text-success"
          />
          <StatCard 
            title="Atendimentos Hoje"
            value={todayAppointments.length}
            icon={<Scissors className="h-5 w-5" />}
          />
          <StatCard 
            title="Próximos"
            value={proximos.length}
            icon={<Calendar className="h-5 w-5" />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="glass-card border-none overflow-hidden animate-slide-up" style={{ animationDelay: '100ms' }}>
              <CardHeader className="border-b border-white/10 bg-white/50 backdrop-blur-md flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-accent" />
                  Agenda do Dia
                </CardTitle>
                <div className="px-3 py-1 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest">
                  {todayAppointments.length} agendados
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : todayAppointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                    <Calendar className="h-12 w-12 opacity-10" />
                    <p className="font-bold uppercase tracking-widest text-xs">Nenhum atendimento para hoje</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {todayAppointments.map((apt) => (
                      <div key={apt.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 group hover:bg-muted/10 transition-all">
                        <div className="flex items-center gap-6 w-full md:w-auto">
                          <div className="flex flex-col items-center justify-center bg-primary text-white p-3 rounded-2xl min-w-[70px] shadow-lg shadow-primary/20">
                            <span className="text-xl font-black">{apt.hora}</span>
                            <span className="text-[10px] font-bold opacity-70 uppercase tracking-tight">Hoje</span>
                          </div>
                          <div>
                            <p className="text-xl font-black text-primary tracking-tight">{apt.cliente}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-2 py-0.5 rounded-lg bg-accent/10 text-accent text-[10px] font-black uppercase tracking-wider">
                                {apt.servicoNome}
                              </span>
                              <span className="text-muted-foreground font-bold text-xs">
                                {formatCurrency(apt.valor)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                          <span className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                            apt.status === "agendado" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                            apt.status === "em_atendimento" ? "bg-blue-100 text-blue-800 border-blue-200 animate-pulse" :
                            apt.status === "finalizado" ? "bg-green-100 text-green-800 border-green-200" :
                            "bg-red-100 text-red-800 border-red-200"
                          )}>
                            {apt.status === "em_atendimento" ? "Em andamento" : apt.status}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {apt.status === "agendado" && (
                              <>
                                <Button onClick={() => iniciarAtendimento(apt.id)} disabled={submitting} className="rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar"}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => cancelarAtendimento(apt.id)} disabled={submitting} className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10">
                                  <X className="h-5 w-5" />
                                </Button>
                              </>
                            )}
                            {apt.status === "em_atendimento" && (
                              <Button onClick={() => concluirAtendimento(apt.id)} disabled={submitting} className="rounded-xl font-bold bg-success hover:bg-success/90 shadow-lg shadow-success/20 hover:scale-105 active:scale-95 transition-all">
                                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Concluir"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <Card className="glass-card border-none overflow-hidden group">
              <CardHeader className="border-b border-white/10 bg-white/50 backdrop-blur-md">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  Próximos Dias
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {proximos.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 text-xs font-bold uppercase opacity-50">Nenhum agendamento futuro</p>
                ) : (
                  <div className="space-y-3">
                    {proximos.slice(0, 5).map(apt => (
                      <div key={apt.id} className="p-4 rounded-2xl bg-white border border-white/20 shadow-sm group-hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-black text-primary uppercase tracking-tight">{apt.cliente}</p>
                            <p className="text-[10px] text-muted-foreground font-bold mt-0.5">{apt.servicoNome}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-accent text-sm leading-none">{apt.hora}</p>
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tight mt-1">{apt.data}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="p-6 rounded-3xl bg-primary text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Mensagem do Dia</p>
              <h3 className="text-xl font-black mt-3 leading-tight tracking-tight">"A excelência não é um ato, é um hábito. Corte com paixão." ✂️</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BarbearPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-mesh"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <BarbearDashboard />
    </Suspense>
  );
}
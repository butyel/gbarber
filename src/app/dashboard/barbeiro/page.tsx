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
import { formatCurrency, getToday } from "@/lib/utils";
import type { Atendimento } from "@/types";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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
        .filter(d => ["agendado", "em_atendimento"].includes(d.data().status))
        .map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
        })) as Atendimento[];

      setAgenda(appointments);

      const today = getToday();
      const todayAppts = appointmentsSnap.docs
        .filter(d => d.data().data === today)
        .map(d => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate() || new Date(),
        })) as Atendimento[];

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
      const apt = agenda.find(a => a.id === id);
      await updateDoc(doc(db, `barbearias/${barbeariaId}/atendimentos`, id), {
        status: "concluido",
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
    .filter(a => a.status === "concluido")
    .reduce((sum, a) => sum + a.comissao, 0);

  const comissaoTotal = agenda
    .filter(a => a.status === "concluido")
    .reduce((sum, a) => sum + a.comissao, 0);

  const proximos = agenda.filter(a => a.status === "agendado");

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-primary text-white p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Scissors className="h-6 w-6" />
              {barbeiroNome}
            </h1>
            <p className="text-sm opacity-80">Área do Barbeiro</p>
          </div>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-white hover:text-white hover:bg-white/20">
              <LogOut className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Comissão Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold text-green-600">{formatCurrency(comissaoHoje)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Atendimentos Hoje</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-10" /> : (
                <div className="text-2xl font-bold">{todayAppointments.length}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Comissão</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-20" /> : (
                <div className="text-2xl font-bold">{formatCurrency(comissaoTotal)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Agenda de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : todayAppointments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum atendimento hoje
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todayAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">{apt.hora}</TableCell>
                      <TableCell>{apt.cliente}</TableCell>
                      <TableCell>{apt.servicoNome}</TableCell>
                      <TableCell>{formatCurrency(apt.valor)}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          apt.status === "agendado" ? "bg-yellow-100 text-yellow-800" :
                          apt.status === "em_atendimento" ? "bg-blue-100 text-blue-800" :
                          apt.status === "concluido" ? "bg-green-100 text-green-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {apt.status === "agendado" && <Clock className="h-3 w-3 mr-1" />}
                          {apt.status === "em_atendimento" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {apt.status === "concluido" && <Check className="h-3 w-3 mr-1" />}
                          {apt.status === "cancelado" && <X className="h-3 w-3 mr-1" />}
                          {apt.status === "agendado" ? "Agendado" :
                           apt.status === "em_atendimento" ? "Em andamento" :
                           apt.status === "concluido" ? "Concluído" : "Cancelado"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {apt.status === "agendado" && (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => iniciarAtendimento(apt.id)}>
                              Iniciar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => cancelarAtendimento(apt.id)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {apt.status === "em_atendimento" && (
                          <Button size="sm" onClick={() => concluirAtendimento(apt.id)}>
                            Concluir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {proximos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Próximos Agendamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {proximos.slice(0, 5).map(apt => (
                  <div key={apt.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{apt.cliente}</p>
                      <p className="text-sm text-muted-foreground">{apt.servicoNome}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{apt.hora}</p>
                      <p className="text-sm text-muted-foreground">{apt.data}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function BarbearPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <BarbearDashboard />
    </Suspense>
  );
}
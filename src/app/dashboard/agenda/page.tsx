"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Plus, Clock, User, Scissors, X, Check, Phone, Calendar, CalendarDays, List } from "lucide-react";
import type { Atendimento, Barbeiro, Servico, Cliente } from "@/types";
import { useToast } from "@/hooks/use-toast";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00
const DAYS_OF_WEEK = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function AgendaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Atendimento[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; hour: number } | null>(null);
  const [selectedBarbeiro, setSelectedBarbeiro] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"day" | "week">("week");
  
  const [formData, setFormData] = useState({
    cliente: "",
    telefone: "",
    barbeiroId: "",
    servicoId: "",
    hora: "09:00",
    data: "",
  });

  useEffect(() => {
    if (!user || !db) return;
    fetchData();
  }, [user, db]);

  const fetchData = async () => {
    try {
      const [appointmentsSnap, barbeirosSnap, servicosSnap, clientesSnap] = await Promise.all([
        getDocs(query(collection(db, `barbearias/${user!.id}/atendimentos`), orderBy("data", "asc"))),
        getDocs(query(collection(db, `barbearias/${user!.id}/barbeiros`), orderBy("nome"))),
        getDocs(query(collection(db, `barbearias/${user!.id}/servicos`), orderBy("nome"))),
        getDocs(query(collection(db, `barbearias/${user!.id}/clientes`), orderBy("nome"))),
      ]);

      setAppointments(appointmentsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as Atendimento;
      }));

      setBarbeiros(barbeirosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Barbeiro[]);

      setServicos(servicosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Servico[]);

      setClientes(clientesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Cliente[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      return day;
    });
  };

  const getAppointmentsForSlot = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split("T")[0];
    const hourStr = hour.toString().padStart(2, "0");
    return appointments.filter(a => a.data === dateStr && a.hora.startsWith(hourStr));
  };

  const getMonthName = () => {
    if (viewMode === "day") {
      return currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    }
    return currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - (viewMode === "day" ? 1 : 7));
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (viewMode === "day" ? 1 : 7));
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const openNewAppointment = (date?: Date, hour?: number) => {
    const selectedDate = date || new Date();
    const dateStr = selectedDate.toISOString().split("T")[0];
    setFormData({
      cliente: "",
      telefone: "",
      barbeiroId: "",
      servicoId: "",
      hora: hour ? `${hour.toString().padStart(2, "0")}:00` : "09:00",
      data: dateStr,
    });
    setSelectedSlot(date ? { date: dateStr, hour: hour || 9 } : null);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !db || !formData.cliente || !formData.barbeiroId || !formData.servicoId) {
      toast({ variant: "destructive", title: "Preencha todos os campos obrigatórios" });
      return;
    }

    setSubmitting(true);
    try {
      const barbeiro = barbeiros.find(b => b.id === formData.barbeiroId);
      const servico = servicos.find(s => s.id === formData.servicoId);
      
      const comissao = servico ? (servico.preco * (barbeiro?.comissaoServico || 15)) / 100 : 0;

      await addDoc(collection(db, `barbearias/${user.id}/atendimentos`), {
        cliente: formData.cliente,
        telefone: formData.telefone || "",
        barbeiroId: formData.barbeiroId,
        barbeiroNome: barbeiro?.nome || "",
        servicoId: formData.servicoId,
        servicoNome: servico?.nome || "",
        valor: servico?.preco || 0,
        comissao,
        data: formData.data,
        hora: formData.hora,
        status: "agendado",
        createdAt: serverTimestamp(),
      });

      toast({ title: "Agendamento realizado com sucesso!" });
      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao agendar", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (appointment: Atendimento, status: string) => {
    if (!user || !db) return;
    try {
      await updateDoc(doc(db, `barbearias/${user.id}/atendimentos`, appointment.id), {
        status,
      });
      toast({ title: "Status atualizado!" });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Cancelar este agendamento?")) return;
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, `barbearias/${user.id}/atendimentos`, id));
      toast({ title: "Agendamento cancelado" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao cancelar" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "agendado": return "bg-blue-500";
      case "em_atendimento": return "bg-yellow-500";
      case "concluido": return "bg-green-500";
      case "cancelado": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const weekDays = getWeekDays();

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden relative">
      <Topbar 
        action={
          <Button onClick={() => openNewAppointment()} className="shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        }
      />

      <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-card p-1 rounded-lg border shadow-sm">
            <Button variant="ghost" size="icon" onClick={prevWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg md:text-xl font-semibold capitalize min-w-[200px] text-center">
              {getMonthName()}
            </h2>
            <Button variant="ghost" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday} className="ml-2">Hoje</Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex border rounded-md overflow-hidden bg-card shadow-sm p-1">
              <Button 
                variant={viewMode === "day" ? "secondary" : "ghost"} 
                size="sm" 
                className={`rounded-sm px-4 ${viewMode === "day" ? "shadow-sm bg-background" : ""}`}
                onClick={() => setViewMode("day")}
              >
                <List className="w-4 h-4 mr-2" /> Dia
              </Button>
              <Button 
                variant={viewMode === "week" ? "secondary" : "ghost"} 
                size="sm" 
                className={`rounded-sm px-4 ${viewMode === "week" ? "shadow-sm bg-background" : ""}`}
                onClick={() => setViewMode("week")}
              >
                <CalendarDays className="w-4 h-4 mr-2" /> Semana
              </Button>
            </div>

            <Select value={selectedBarbeiro} onValueChange={setSelectedBarbeiro}>
              <SelectTrigger className="w-[180px] bg-card shadow-sm">
                <SelectValue placeholder="Todos os barbeiros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os barbeiros</SelectItem>
                {barbeiros.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden shadow-md border-border/50">
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className={`grid border-b bg-muted/40 z-10 sticky top-0 ${viewMode === "week" ? "grid-cols-[80px_repeat(7,1fr)]" : "grid-cols-[100px_1fr]"}`}>
              <div className="p-3 text-center text-sm font-medium text-muted-foreground border-r flex items-center justify-center">
                <Clock className="w-4 h-4 mr-1" />
                Horário
              </div>
              
              {viewMode === "week" ? (
                weekDays.map((day, i) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} className={`p-3 text-center border-r last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{DAYS_OF_WEEK[day.getDay()]}</div>
                      <div className={`text-xl mt-1 ${isToday ? "text-primary font-bold" : "font-medium"}`}>{day.getDate()}</div>
                    </div>
                  );
                })
              ) : (
                <div className="p-3 bg-primary/5 text-center flex items-center justify-center gap-3">
                  <div className="text-lg text-primary font-bold uppercase">{DAYS_OF_WEEK[currentDate.getDay()]}</div>
                  <div className="text-3xl font-black text-primary">{currentDate.getDate()}</div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto w-full relative">
              {HOURS.map(hour => (
                <div key={hour} className={`grid border-b min-h-[100px] ${viewMode === "week" ? "grid-cols-[80px_repeat(7,1fr)]" : "grid-cols-[100px_1fr]"}`}>
                  <div className="p-2 text-center text-sm text-muted-foreground border-r bg-muted/10 flex items-start justify-center pt-4 sticky left-0 font-medium">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  
                  {viewMode === "week" ? (
                    weekDays.map((day, dayIndex) => {
                      const dayAppointments = getAppointmentsForSlot(day, hour).filter(a => 
                        selectedBarbeiro === "all" || a.barbeiroId === selectedBarbeiro
                      );
                      const isToday = day.toDateString() === new Date().toDateString();
                      
                      return (
                        <div 
                          key={dayIndex} 
                          className={`p-1.5 border-r last:border-r-0 group cursor-pointer transition-colors hover:bg-muted/30 relative ${isToday ? "bg-primary/[0.02]" : ""}`}
                          onClick={() => openNewAppointment(day, hour)}
                        >
                          <div className="absolute inset-x-0 top-0 h-0.5 bg-border/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <div className="flex flex-col gap-1.5">
                            {dayAppointments.map(apt => (
                              <div 
                                key={apt.id}
                                className={`text-xs p-2 rounded-md shadow-sm cursor-pointer border ${getStatusColor(apt.status)}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="font-semibold text-foreground truncate">{apt.cliente}</div>
                                <div className="truncate text-muted-foreground mt-0.5" title={apt.servicoNome}>{apt.servicoNome}</div>
                                <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/20">
                                  <div className="truncate text-[10px] uppercase font-medium">{apt.barbeiroNome}</div>
                                  <div className="font-medium text-foreground">R$ {apt.valor}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div 
                      className="p-3 group cursor-pointer transition-colors hover:bg-muted/10 relative"
                      onClick={() => openNewAppointment(currentDate, hour)}
                    >
                      <div className="absolute inset-y-0 left-0 w-0.5 bg-border/80 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {getAppointmentsForSlot(currentDate, hour)
                          .filter(a => selectedBarbeiro === "all" || a.barbeiroId === selectedBarbeiro)
                          .map(apt => (
                            <div 
                              key={apt.id}
                              className={`text-sm p-3 rounded-lg shadow-sm cursor-pointer border flex flex-col gap-2 ${getStatusColor(apt.status)} hover:shadow-md transition-all`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-bold text-foreground truncate text-base">{apt.cliente}</div>
                                <div className="font-bold whitespace-nowrap bg-background/50 px-2 py-0.5 rounded text-xs border border-border/50">R$ {apt.valor}</div>
                              </div>
                              <div className="flex items-center gap-1.5 text-muted-foreground mt-1 bg-background/30 rounded p-1">
                                <Scissors className="w-3 h-3" />
                                <span className="truncate" title={apt.servicoNome}>{apt.servicoNome}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/20">
                                <div className="flex items-center gap-1.5 text-foreground font-medium bg-background/40 py-0.5 px-2 rounded-full text-xs">
                                  <User className="w-3 h-3" />
                                  <span className="truncate">{apt.barbeiroNome}</span>
                                </div>
                                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-70">
                                  {apt.status.replace("_", " ")}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-3 rounded-lg border shadow-sm text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <span className="font-medium text-blue-700 dark:text-blue-300">Agendado</span>
            </div>
            <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-md border border-yellow-200 dark:border-yellow-800">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <span className="font-medium text-yellow-700 dark:text-yellow-300">Aguardando/Sendo Atendido</span>
            </div>
            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-md border border-green-200 dark:border-green-800">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              <span className="font-medium text-green-700 dark:text-green-300">Concluído</span>
            </div>
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-md border border-red-200 dark:border-red-800">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <span className="font-medium text-red-700 dark:text-red-300">Cancelado</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="hidden sm:inline">Dica:</span> Clique em qualquer horário vazio para agendar
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input 
                  type="date" 
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Select value={formData.hora} onValueChange={(v) => setFormData({ ...formData, hora: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HOURS.map(h => (
                      <SelectItem key={h} value={`${h.toString().padStart(2, "0")}:00`}>
                        {h.toString().padStart(2, "0")}:00
                      </SelectItem>
                    ))}
                    {HOURS.map(h => (
                      <SelectItem key={h} value={`${h.toString().padStart(2, "0")}:30`}>
                        {h.toString().padStart(2, "0")}:30
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cliente *</Label>
              <Select 
                value={formData.cliente || "__manual__"} 
                onValueChange={(value) => {
                  if (value === "__manual__") {
                    setFormData({ ...formData, cliente: "", telefone: "" });
                  } else {
                    const cliente = clientes.find(c => c.id === value);
                    if (cliente) {
                      setFormData({ 
                        ...formData, 
                        cliente: cliente.nome,
                        telefone: cliente.telefone || "",
                      });
                    }
                  }
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione ou digite" /></SelectTrigger>
                <SelectContent>
                  {clientes.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome} {c.telefone && `- ${c.telefone}`}
                    </SelectItem>
                  ))}
                  <SelectItem value="__manual__">Digitar nome...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <Input 
                value={formData.cliente}
                onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input 
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label>Barbeiro *</Label>
              <Select value={formData.barbeiroId} onValueChange={(v) => setFormData({ ...formData, barbeiroId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {barbeiros.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Serviço *</Label>
              <Select value={formData.servicoId} onValueChange={(v) => setFormData({ ...formData, servicoId: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {servicos.map(s => <SelectItem key={s.id} value={s.id}>{s.nome} - {formatCurrency(s.preco)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Salvando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
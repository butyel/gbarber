"use client";

import { useState, useEffect, useMemo } from "react";
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
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
import { cn } from "@/lib/utils";
import type { Atendimento, Barbeiro, Servico, Cliente } from "@/types";
import { useToast } from "@/hooks/use-toast";

const HOURS = Array.from({ length: 26 }, (_, i) => i + 16); // 16: 8:00, 17: 8:30, ... hasta 52 (20:30)
const getHourLabel = (idx: number) => Math.floor(idx / 2) + ":" + (idx % 2 === 0 ? "00" : "30");
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
    servicoIds: [] as string[],
    hora: "09:00",
    data: "",
    status: "agendado",
  });

  useEffect(() => {
    if (!user || !db) return;
    fetchData();
  }, [user, db]);

  const fetchData = async () => {
    try {
      const weekStart = format(startOfWeek(currentDate), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(currentDate), "yyyy-MM-dd");

      const [appointmentsSnap, barbeirosSnap, servicosSnap, clientesSnap] = await Promise.all([
        getDocs(query(
          collection(db, `barbearias/${user!.id}/atendimentos`),
          where("data", ">=", weekStart),
          where("data", "<=", weekEnd),
          orderBy("data", "asc")
        )),
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

  const appointmentsBySlot = useMemo(() => {
    const map = new Map<string, Atendimento[]>();
    appointments.forEach(a => {
      const key = `${a.data}-${a.hora}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return map;
  }, [appointments]);

  const getAppointmentsForSlot = (date: Date, hour: number) => {
    const dateStr = date.toISOString().split("T")[0];
    const hourLabel = getHourLabel(hour);
    return appointmentsBySlot.get(`${dateStr}-${hourLabel}`) || [];
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
      servicoIds: [],
      hora: hour ? `${hour.toString().padStart(2, "0")}:00` : "09:00",
      data: dateStr,
      status: dateStr < new Date().toISOString().split("T")[0] ? "finalizado" : "agendado",
    });
    setSelectedSlot(date ? { date: dateStr, hour: hour || 9 } : null);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!user || !db || !formData.cliente || !formData.barbeiroId || formData.servicoIds.length === 0) {
      toast({ variant: "destructive", title: "Preencha todos os campos obrigatórios" });
      return;
    }

    setSubmitting(true);
    try {
      const barbeiro = barbeiros.find(b => b.id === formData.barbeiroId);
      const servicosSelecionados = servicos.filter(s => formData.servicoIds.includes(s.id));
      
      const valorTotal = servicosSelecionados.reduce((sum, s) => sum + s.preco, 0);
      const comissaoTotal = servicosSelecionados.reduce((sum, s) => sum + (s.preco * (barbeiro?.comissaoServico || 15)) / 100, 0);

      await addDoc(collection(db, `barbearias/${user.id}/atendimentos`), {
        cliente: formData.cliente,
        telefone: formData.telefone || "",
        barbeiroId: formData.barbeiroId,
        barbeiroNome: barbeiro?.nome || "",
        servicoIds: formData.servicoIds,
        servicoNomes: servicosSelecionados.map(s => s.nome).join(", "),
        valor: valorTotal,
        comissao: comissaoTotal,
        data: formData.data,
        hora: formData.hora,
        status: formData.status,
        createdAt: new Date(`${formData.data}T${formData.hora}:00`),
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
      case "agendado": return "bg-blue-600 text-white";
      case "em_atendimento": return "bg-yellow-500 text-white";
      case "finalizado": return "bg-green-600 text-white";
      case "cancelado": return "bg-red-600 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const weekDays = getWeekDays();

  return (    <div className="h-screen flex flex-col bg-mesh overflow-hidden relative">
      <Topbar 
        action={
          <Button onClick={() => openNewAppointment()} className="shadow-lg shadow-primary/20 rounded-xl px-6">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        }
      />

      <div className="flex-1 flex flex-col p-4 md:p-8 space-y-6 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slide-up">
          <div className="flex items-center gap-2 glass-panel p-1.5 rounded-2xl border-white shadow-sm">
            <Button variant="ghost" size="icon" onClick={prevWeek} className="rounded-xl hover:bg-primary/5">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-black tracking-tight capitalize min-w-[220px] text-center text-primary">
              {getMonthName()}
            </h2>
            <Button variant="ghost" size="icon" onClick={nextWeek} className="rounded-xl hover:bg-primary/5">
              <ChevronRight className="h-5 w-5" />
            </Button>
            <div className="w-px h-6 bg-border mx-2" />
            <Button variant="outline" size="sm" onClick={goToToday} className="rounded-lg border-primary/10 font-bold">Hoje</Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex glass-panel p-1 rounded-xl border-white shadow-sm">
              <Button 
                variant={viewMode === "day" ? "secondary" : "ghost"} 
                size="sm" 
                className={cn(
                  "rounded-lg px-4 font-bold transition-all",
                  viewMode === "day" ? "bg-white shadow-sm text-primary" : "text-muted-foreground"
                )}
                onClick={() => setViewMode("day")}
              >
                <List className="w-4 h-4 mr-2" /> Dia
              </Button>
              <Button 
                variant={viewMode === "week" ? "secondary" : "ghost"} 
                size="sm" 
                className={cn(
                  "rounded-lg px-4 font-bold transition-all",
                  viewMode === "week" ? "bg-white shadow-sm text-primary" : "text-muted-foreground"
                )}
                onClick={() => setViewMode("week")}
              >
                <CalendarDays className="w-4 h-4 mr-2" /> Semana
              </Button>
            </div>

            <Select value={selectedBarbeiro} onValueChange={setSelectedBarbeiro}>
              <SelectTrigger className="w-[200px] glass-card border-none rounded-xl font-bold text-primary">
                <SelectValue placeholder="Barbeiro" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-white shadow-2xl">
                <SelectItem value="all">Todos os barbeiros</SelectItem>
                {barbeiros.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden glass-card border-none animate-slide-up" style={{ animationDelay: '100ms' }}>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className={`grid border-b border-white/10 bg-white/50 backdrop-blur-md z-20 sticky top-0 ${viewMode === "week" ? "grid-cols-[80px_repeat(7,1fr)]" : "grid-cols-[100px_1fr]"}`}>
              <div className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r border-white/10 flex items-center justify-center">
                <Clock className="w-4 h-4 mr-1.5 opacity-50" />
                Hora
              </div>
              
              {viewMode === "week" ? (
                weekDays.map((day, i) => {
                  const isToday = day.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} className={`p-4 text-center border-r border-white/10 last:border-r-0 ${isToday ? "bg-primary/5" : ""}`}>
                      <div className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">{DAYS_OF_WEEK[day.getDay()]}</div>
                      <div className={`text-2xl mt-1 tracking-tighter ${isToday ? "text-primary font-black" : "font-bold text-muted-foreground/80"}`}>{day.getDate()}</div>
                      {isToday && <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 bg-primary/5 text-center flex items-center justify-center gap-4">
                  <div className="text-sm text-primary font-black uppercase tracking-[0.3em]">{DAYS_OF_WEEK[currentDate.getDay()]}</div>
                  <div className="text-4xl font-black text-primary tracking-tighter">{currentDate.getDate()}</div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto w-full relative custom-scrollbar">
              {HOURS.map(hour => (
                <div key={hour} className={`grid border-b border-white/5 min-h-[120px] ${viewMode === "week" ? "grid-cols-[80px_repeat(7,1fr)]" : "grid-cols-[100px_1fr]"}`}>
                  <div className="p-2 text-center text-xs text-muted-foreground/60 border-r border-white/5 bg-muted/5 flex items-start justify-center pt-6 sticky left-0 font-black tracking-tighter z-10">
                    {getHourLabel(hour)}
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
                          className={cn(
                            "p-2 border-r border-white/5 last:border-r-0 group cursor-pointer transition-all duration-300 hover:bg-primary/[0.03] relative",
                            isToday && "bg-primary/[0.01]"
                          )}
                          onClick={() => openNewAppointment(day, hour)}
                        >
                          <div className="flex flex-col gap-2">
                            {dayAppointments.map(apt => (
                              <div 
                                key={apt.id}
                                className={cn(
                                  "text-[10px] p-2.5 rounded-xl shadow-lg cursor-pointer border transition-all duration-300 hover:scale-[1.03] hover:shadow-xl",
                                  getStatusColor(apt.status)
                                )}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="font-black truncate uppercase tracking-tight">{apt.cliente}</div>
                                <div className="truncate mt-0.5 font-bold opacity-80" title={apt.servicoNomes || apt.servicoNome}>{apt.servicoNomes || apt.servicoNome}</div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                                  <div className="truncate font-black text-[9px] uppercase tracking-widest opacity-70">{apt.barbeiroNome}</div>
                                  <div className="font-black text-xs">R$ {apt.valor}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div 
                      className="p-4 group cursor-pointer transition-all duration-300 hover:bg-primary/[0.02] relative"
                      onClick={() => openNewAppointment(currentDate, hour)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {getAppointmentsForSlot(currentDate, hour)
                          .filter(a => selectedBarbeiro === "all" || a.barbeiroId === selectedBarbeiro)
                          .map(apt => (
                            <div 
                              key={apt.id}
                              className={cn(
                                "text-sm p-4 rounded-2xl shadow-xl cursor-pointer border flex flex-col gap-3 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-2xl",
                                getStatusColor(apt.status)
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-black truncate text-lg tracking-tighter uppercase">{apt.cliente}</div>
                                <div className="font-black whitespace-nowrap bg-white/20 px-3 py-1 rounded-lg text-sm border border-white/30 shadow-inner">R$ {apt.valor}</div>
                              </div>
                              <div className="flex items-center gap-2 mt-1 bg-black/10 rounded-xl p-2 border border-white/5 shadow-inner">
                                <Scissors className="w-3.5 h-3.5 opacity-70" />
                                <span className="font-bold text-xs uppercase tracking-tight truncate" title={apt.servicoNomes || apt.servicoNome}>{apt.servicoNomes || apt.servicoNome}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1 pt-3 border-t border-white/20">
                                <div className="flex items-center gap-2 font-black bg-white/20 py-1 px-3 rounded-full text-[10px] uppercase tracking-widest border border-white/10">
                                  <div className="w-4 h-4 rounded-full bg-primary text-white flex items-center justify-center text-[8px]">{apt.barbeiroNome.charAt(0)}</div>
                                  <span className="truncate">{apt.barbeiroNome}</span>
                                </div>
                                <div className="text-[9px] uppercase tracking-[0.2em] font-black opacity-60">
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

        <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-4 rounded-2xl border-white shadow-sm text-sm animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-600 shadow-lg shadow-blue-600/30"></div>
              <span className="font-black text-[10px] uppercase tracking-[0.15em] text-blue-800">Agendado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/30"></div>
              <span className="font-black text-[10px] uppercase tracking-[0.15em] text-yellow-800">Atendimento</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-600 shadow-lg shadow-green-600/30"></div>
              <span className="font-black text-[10px] uppercase tracking-[0.15em] text-green-800">Finalizado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-600 shadow-lg shadow-red-600/30"></div>
              <span className="font-black text-[10px] uppercase tracking-[0.15em] text-red-800">Cancelado</span>
            </div>
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground/60 flex items-center gap-2 bg-muted/30 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Dica: Clique em qualquer horário vazio para agendar
          </div>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
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
                      <SelectItem key={h} value={getHourLabel(h)}>
                        {getHourLabel(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
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
              <Label>Serviços *</Label>
              <div className="border rounded-md divide-y max-h-[200px] overflow-y-auto">
                {servicos.map(s => (
                  <label 
                    key={s.id} 
                    className={cn(
                      "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                      formData.servicoIds.includes(s.id) 
                        ? "bg-primary/10" 
                        : "hover:bg-muted/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={formData.servicoIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, servicoIds: [...formData.servicoIds, s.id] });
                        } else {
                          setFormData({ ...formData, servicoIds: formData.servicoIds.filter(id => id !== s.id) });
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="flex-1 font-medium">{s.nome}</span>
                    <span className="text-sm font-semibold text-primary">{formatCurrency(s.preco)}</span>
                  </label>
                ))}
              </div>
              {formData.servicoIds.length > 0 && (() => {
                const total = servicos.filter(s => formData.servicoIds.includes(s.id)).reduce((sum, s) => sum + s.preco, 0);
                return (
                  <p className="text-sm text-muted-foreground">
                    Total: {formatCurrency(total)}
                  </p>
                );
              })()}
            </div>
          </div>
          <DialogFooter className="mt-4 pb-2">
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
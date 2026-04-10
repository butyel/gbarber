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
import { ChevronLeft, ChevronRight, Plus, Clock, User, Scissors, X, Check, Phone, Calendar } from "lucide-react";
import type { Atendimento, Barbeiro, Servico, Cliente } from "@/types";
import { useToast } from "@/hooks/use-toast";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
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
    return currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
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
    <div className="min-h-screen">
      <Topbar 
        action={
          <Button onClick={() => openNewAppointment()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={prevWeek}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold capitalize">{getMonthName()}</h2>
            <Button variant="outline" size="icon" onClick={nextWeek}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedBarbeiro} onValueChange={setSelectedBarbeiro}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todos os barbeiros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os barbeiros</SelectItem>
                {barbeiros.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={goToToday}>Hoje</Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-8 border-b">
              <div className="p-3 text-center font-medium text-muted-foreground border-r bg-muted/30">Horários</div>
              {weekDays.map((day, i) => {
                const isToday = day.toDateString() === new Date().toDateString();
                return (
                  <div key={i} className={`p-3 text-center font-medium border-r ${isToday ? "bg-accent/20" : "bg-muted/30"}`}>
                    <div className="text-xs text-muted-foreground">{DAYS_OF_WEEK[day.getDay()]}</div>
                    <div className={`text-lg ${isToday ? "text-accent font-bold" : ""}`}>{day.getDate()}</div>
                  </div>
                );
              })}
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-8 border-b min-h-[80px]">
                  <div className="p-2 text-center text-sm text-muted-foreground border-r bg-muted/20 flex items-center justify-center">
                    {hour.toString().padStart(2, "0")}:00
                  </div>
                  {weekDays.map((day, dayIndex) => {
                    const dayAppointments = getAppointmentsForSlot(day, hour).filter(a => 
                      selectedBarbeiro === "all" || a.barbeiroId === selectedBarbeiro
                    );
                    return (
                      <div 
                        key={dayIndex} 
                        className="p-1 border-r hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() => openNewAppointment(day, hour)}
                      >
                        {dayAppointments.map(apt => (
                          <div 
                            key={apt.id}
                            className={`text-xs p-1 rounded mb-1 cursor-pointer ${getStatusColor(apt.status)} text-white`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="font-bold truncate">{apt.cliente}</div>
                            <div className="truncate opacity-80">{apt.servicoNome}</div>
                            <div className="truncate opacity-80">{apt.barbeiroNome}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm">Agendado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm">Em Atendimento</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm">Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm">Cancelado</span>
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
"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, addDays, addMonths, subMonths, isSameMonth, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Plus, Search, Trash2, Loader2, RotateCcw, Eye, Pencil, Check, List, Scissors, ChevronLeft, ChevronRight } from "lucide-react";
import type { Atendimento, Barbeiro, Servico, Produto } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function AtendimentosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [appointments, setAppointments] = useState<Atendimento[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [clientes, setClientes] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showClienteSuggestions, setShowClienteSuggestions] = useState(false);
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [lastAtendimento, setLastAtendimento] = useState<{servicoIds: string[]; barbeiroId: string; valor: number} | null>(null);
  
  const [formData, setFormData] = useState({
    cliente: "",
    barbeiroId: "",
    servicoIds: [] as string[],
    valor: 0,
    produtoId: "",
    produtoQuantidade: 1,
    data: new Date().toISOString().split("T")[0],
    hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
  });

  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));

  useEffect(() => {
    if (!user || !db) return;
    fetchData();
  }, [user, db]);

  const fetchData = async () => {
    try {
      const [appointmentsSnap, barbeirosSnap, servicosSnap, produtosSnap, clientesSnap] = await Promise.all([
        getDocs(query(collection(db, `barbearias/${user!.id}/atendimentos`), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, `barbearias/${user!.id}/barbeiros`), orderBy("nome"))),
        getDocs(query(collection(db, `barbearias/${user!.id}/servicos`), orderBy("nome"))),
        getDocs(query(collection(db, `barbearias/${user!.id}/produtos`))),
        getDocs(query(collection(db, `barbearias/${user!.id}/clientes`), orderBy("nome"))),
      ]);

      const appointmentsData = appointmentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Atendimento[];

      setAppointments(appointmentsData);

      const uniqueClientes = [...new Set(appointmentsData.map(a => a.cliente).filter(Boolean))];
      setClientes(uniqueClientes);

      if (appointmentsData.length > 0) {
        const last = appointmentsData[0];
        setLastAtendimento({
          servicoIds: last.servicoIds || (last.servicoId ? [last.servicoId] : []),
          barbeiroId: last.barbeiroId,
          valor: last.valor,
        });
      }

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

      setProdutos(produtosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Produto[]);

      // Carregar clientes cadastrados na página Clientes
      const clientesData = clientesSnap.docs.map(doc => doc.data().nome).filter(Boolean);
      setClientes(clientesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.cliente || !formData.barbeiroId || formData.servicoIds.length === 0) {
      toast({ variant: "destructive", title: "Preencha todos os campos" });
      return;
    }

    // Verificar se o cliente está cadastrado na página Clientes
    if (!clientes.includes(formData.cliente)) {
      toast({ variant: "destructive", title: "Cliente não encontrado", description: "Selecione um cliente cadastrado na página Clientes" });
      return;
    }

    setSubmitting(true);
    try {
      const barbeiro = barbeiros.find(b => b.id === formData.barbeiroId);
      const servicosSelecionados = servicos.filter(s => formData.servicoIds.includes(s.id));
      
      let comissao = 0;
      if (barbeiro) {
        comissao = servicosSelecionados.reduce((sum, s) => sum + (s.preco * barbeiro.comissaoServico) / 100, 0);
      }

      const atendimento: any = {
        cliente: formData.cliente,
        barbeiroId: formData.barbeiroId,
        barbeiroNome: barbeiro?.nome || "",
        servicoIds: formData.servicoIds,
        servicoNomes: servicosSelecionados.map(s => s.nome).join(", "),
        valor: formData.valor,
        comissao,
        data: formData.data,
        hora: formData.hora,
        status: "finalizado",
        createdAt: new Date(`${formData.data}T${formData.hora}:00`),
      };

      if (formData.produtoId && formData.produtoQuantidade > 0) {
        const produto = produtos.find(p => p.id === formData.produtoId);
        if (produto) {
          atendimento.produtoVendido = {
            produtoId: formData.produtoId,
            nome: produto.nome,
            valor: produto.precoVenda * formData.produtoQuantidade,
            quantidade: formData.produtoQuantidade,
          };
          comissao += (produto.precoVenda * formData.produtoQuantidade * (barbeiro?.comissaoProduto || 15)) / 100;
          atendimento.comissao = comissao;
        }
      }

      await import("firebase/firestore").then(({ addDoc, collection }) => 
        addDoc(collection(db, `barbearias/${user.id}/atendimentos`), atendimento)
      );

      toast({ title: "Atendimento criado com sucesso!" });
      setIsModalOpen(false);
      setFormData({ 
        cliente: "", 
        barbeiroId: "", 
        servicoIds: [], 
        valor: 0, 
        produtoId: "", 
        produtoQuantidade: 1,
        data: new Date().toISOString().split("T")[0],
        hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
      });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao criar atendimento", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async (id: string) => {
    try {
      await import("firebase/firestore").then(({ updateDoc, doc }) => 
        updateDoc(doc(db, `barbearias/${user!.id}/atendimentos`, id), {
          status: "finalizado",
          updatedAt: new Date(),
        })
      );
      toast({ title: "Atendimento finalizado!", description: "O valor foi contabilizado no faturamento." });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao finalizar" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      await deleteDoc(doc(db, `barbearias/${user!.id}/atendimentos`, id));
      toast({ title: "Atendimento excluído" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  const handleViewDetails = (appointment: Atendimento) => {
    setSelectedAtendimento(appointment);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEdit = (appointment: Atendimento) => {
    setSelectedAtendimento(appointment);
    setIsEditMode(true);
    setFormData({
      cliente: appointment.cliente,
      barbeiroId: appointment.barbeiroId,
      servicoIds: appointment.servicoIds || (appointment.servicoId ? [appointment.servicoId] : []),
      valor: appointment.valor,
      produtoId: appointment.produtoVendido?.produtoId || "",
      produtoQuantidade: appointment.produtoVendido?.quantidade || 1,
      data: appointment.data || (appointment.createdAt ? new Date(appointment.createdAt).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]),
      hora: appointment.hora || (appointment.createdAt ? new Date(appointment.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })),
    });
    setIsModalOpen(true);
  };

  const filteredAppointments = appointments.filter(a => 
    a.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.barbeiroNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.servicoNomes || a.servicoNome || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleRepeatLast = () => {
    if (lastAtendimento) {
      setFormData({
        ...formData,
        servicoIds: lastAtendimento.servicoIds,
        barbeiroId: lastAtendimento.barbeiroId,
        valor: lastAtendimento.valor,
      });
      toast({ title: "Último serviço preenchido" });
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.toLowerCase().includes(formData.cliente.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="min-h-screen">
      <Topbar 
        action={
          <div className="flex gap-2">
            {lastAtendimento && (
              <Button variant="outline" onClick={handleRepeatLast} title="Repetir último serviço">
                <RotateCcw className="h-4 w-4 mr-1" />
                Repetir
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo
            </Button>
          </div>
        }
      />

      <div className="p-4 md:p-8 lg:p-12 space-y-8 bg-mesh min-h-[calc(100vh-80px)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-primary">Histórico</h1>
            <p className="text-muted-foreground font-semibold mt-2 text-lg">Gerencie e acompanhe todos os serviços realizados.</p>
          </div>
          <div className="flex items-center gap-3 bg-muted/40 p-2 rounded-2xl shadow-xl border-white/40">
            {lastAtendimento && (
              <Button variant="outline" onClick={handleRepeatLast} title="Repetir último serviço" className="rounded-xl border-accent/30 text-accent hover:bg-accent/10 h-12 px-6 font-bold">
                <RotateCcw className="h-5 w-5 mr-2" />
                Repetir Último
              </Button>
            )}
            <Button onClick={() => setIsModalOpen(true)} className="rounded-xl shadow-lg shadow-primary/20 h-12 px-6 font-bold text-base">
              <Plus className="h-5 w-5 mr-2" />
              Novo Atendimento
            </Button>
          </div>
        </div>

        <div className="flex gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input 
              placeholder="Buscar por cliente, barbeiro..." 
              className="pl-10 rounded-xl border-none bg-background focus-visible:ring-primary shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="bg-card shadow-sm border border-border/40 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="border-b border-white/10 bg-white/40 backdrop-blur-md p-6">
            <CardTitle className="text-xl font-black text-primary flex items-center gap-2">
              <List className="h-5 w-5 text-accent" />
              Listagem Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-bold text-primary py-4">Data</TableHead>
                  <TableHead className="font-bold text-primary">Cliente</TableHead>
                  <TableHead className="font-bold text-primary">Barbeiro</TableHead>
                  <TableHead className="font-bold text-primary">Serviço</TableHead>
                  <TableHead className="font-bold text-primary">Valor Total</TableHead>
                  <TableHead className="font-bold text-primary">Status</TableHead>
                  <TableHead className="font-bold text-primary text-right px-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum atendimento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id} className="group hover:bg-muted/10 transition-all">
                      <TableCell className="py-4 font-medium text-muted-foreground">{formatDate(appointment.createdAt)}</TableCell>
                      <TableCell>
                        <div className="font-bold text-primary">{appointment.cliente}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-black uppercase border border-primary/5">
                            {appointment.barbeiroNome.charAt(0)}
                          </div>
                          <span className="font-medium">{appointment.barbeiroNome}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-black uppercase tracking-wider">
                          {appointment.servicoNomes || appointment.servicoNome}
                        </span>
                      </TableCell>
                      <TableCell className="font-black text-primary">
                        {formatCurrency(appointment.valor + (appointment.produtoVendido?.valor || 0))}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          appointment.status === "finalizado" 
                            ? "bg-success/10 text-success border-success/20" 
                            : appointment.status === "cancelado" 
                              ? "bg-destructive/10 text-destructive border-destructive/20" 
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20 shadow-sm shadow-blue-500/5 animate-pulse"
                        )}>
                          {appointment.status || "agendado"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {appointment.status !== "finalizado" && (
                            <Button variant="ghost" size="icon" onClick={() => handleFinalize(appointment.id)} className="min-w-[44px] min-h-[44px] h-8 w-8 rounded-lg text-success hover:bg-success/10">
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(appointment)} className="min-w-[44px] min-h-[44px] h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(appointment)} className="min-w-[44px] min-h-[44px] h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(appointment.id)} className="min-w-[44px] min-h-[44px] h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] sm:max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Atendimento" : selectedAtendimento ? "Detalhes do Atendimento" : "Novo Atendimento"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="overflow-y-auto pr-1 -mr-1 space-y-4 max-h-[calc(85vh-8rem)] sm:max-h-[calc(80vh-8rem)]">
          {selectedAtendimento && !isEditMode ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">{formatDate(selectedAtendimento.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hora</p>
                  <p className="font-medium">{formatTime(selectedAtendimento.createdAt)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <p className="font-medium">{selectedAtendimento.cliente}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Barbeiro</p>
                <p className="font-medium">{selectedAtendimento.barbeiroNome}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serviço(s)</p>
                <p className="font-medium">{selectedAtendimento.servicoNomes || selectedAtendimento.servicoNome}</p>
              </div>
              {selectedAtendimento.produtoVendido && (
                <div>
                  <p className="text-sm text-muted-foreground">Produto</p>
                  <p className="font-medium">{selectedAtendimento.produtoVendido.nome} (x{selectedAtendimento.produtoVendido.quantidade})</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-bold text-lg">{formatCurrency(selectedAtendimento.valor + (selectedAtendimento.produtoVendido?.valor || 0))}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissão</p>
                  <p className="font-medium">{formatCurrency(selectedAtendimento.comissao)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4" onKeyDown={handleKeyDown}>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={formData.cliente} onValueChange={(v) => setFormData({ ...formData, cliente: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente, idx) => (
                      <SelectItem key={idx} value={cliente}>{cliente}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clientes.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhum cliente cadastrado. Vá na página Clientes para adicionar.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Data</Label>
                <div className="bg-white/40 rounded-xl p-2.5 border border-white/60 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary/10 text-muted-foreground/60 hover:text-primary transition-all"
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </button>
                    <div className="text-center">
                      <span className="text-[11px] font-bold capitalize text-foreground">
                        {format(calendarMonth, "MMMM", { locale: ptBR })}
                      </span>
                      <span className="text-[11px] font-light text-muted-foreground ml-0.5">
                        {format(calendarMonth, "yyyy")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                      className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-primary/10 text-muted-foreground/60 hover:text-primary transition-all"
                    >
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-0 text-center mb-1">
                    {["D", "S", "T", "Q", "Q", "S", "S"].map(d => (
                      <div key={d} className="text-[8px] font-bold text-muted-foreground/30 tracking-wider py-0.5">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0">
                    {(() => {
                      const monthStart = startOfMonth(calendarMonth);
                      const monthEnd = endOfMonth(calendarMonth);
                      const startDate = startOfWeek(monthStart);
                      const endDate = endOfWeek(monthEnd);
                      const rows: JSX.Element[] = [];
                      let day = startDate;
                      while (day <= endDate) {
                        for (let i = 0; i < 7; i++) {
                          const currentDay = day;
                          const dateStr = format(currentDay, "yyyy-MM-dd");
                          const isSelected = formData.data === dateStr;
                          const isCurrentMonth = isSameMonth(currentDay, calendarMonth);
                          const isToday = isSameDay(currentDay, new Date());
                          rows.push(
                            <button
                              key={dateStr}
                              type="button"
                              onClick={() => setFormData({ ...formData, data: dateStr })}
                              className={cn(
                                "relative h-7 w-full rounded-full text-[11px] font-semibold transition-all duration-200",
                                !isCurrentMonth && "text-transparent pointer-events-none",
                                isCurrentMonth && !isSelected && "text-foreground/60 hover:bg-primary/10 hover:text-primary",
                                isCurrentMonth && isSelected && "bg-primary text-primary-foreground shadow-sm font-bold",
                                isCurrentMonth && isToday && !isSelected && "text-primary font-bold"
                              )}
                            >
                              {format(currentDay, "d")}
                              {isCurrentMonth && isToday && !isSelected && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full bg-primary" />
                              )}
                            </button>
                          );
                          day = addDays(day, 1);
                        }
                      }
                      return rows;
                    })()}
                  </div>
                </div>
                {formData.data && (
                  <div className="flex items-center justify-center gap-1 pt-0.5">
                    <div className="w-1 h-1 rounded-full bg-primary" />
                    <span className="text-[10px] font-semibold text-primary">
                      {format(new Date(formData.data + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input 
                    type="time" 
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Barbeiro</Label>
                <Select value={formData.barbeiroId} onValueChange={(v) => setFormData({ ...formData, barbeiroId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {barbeiros.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Serviço(s) *</Label>
                <div className="border rounded-lg divide-y max-h-[180px] overflow-y-auto bg-muted/10">
                  {servicos.map(s => {
                    const isSelected = formData.servicoIds.includes(s.id);
                    return (
                      <label key={s.id} className={cn(
                        "flex items-center gap-3 p-2.5 cursor-pointer transition-colors text-sm",
                        isSelected ? "bg-primary/10" : "hover:bg-muted/30"
                      )}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const novosIds = [...formData.servicoIds, s.id];
                              const total = servicos.filter(ss => novosIds.includes(ss.id)).reduce((sum, ss) => sum + ss.preco, 0);
                              setFormData({ ...formData, servicoIds: novosIds, valor: total });
                            } else {
                              const novosIds = formData.servicoIds.filter(id => id !== s.id);
                              const total = servicos.filter(ss => novosIds.includes(ss.id)).reduce((sum, ss) => sum + ss.preco, 0);
                              setFormData({ ...formData, servicoIds: novosIds, valor: total });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="flex-1 font-medium">{s.nome}</span>
                        <span className="text-sm font-semibold text-primary">{formatCurrency(s.preco)}</span>
                      </label>
                    );
                  })}
                </div>
                {formData.servicoIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formData.servicoIds.length} serviço(s) selecionado(s) — Total: {formatCurrency(formData.valor)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input 
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Produto (opcional)</Label>
                <Select value={formData.produtoId} onValueChange={(v) => setFormData({ ...formData, produtoId: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {produtos.filter(p => p.quantidade > 0).map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsModalOpen(false);
              setSelectedAtendimento(null);
              setIsEditMode(false);
              setFormData({ 
                cliente: "", 
                barbeiroId: "", 
                servicoIds: [], 
                valor: 0, 
                produtoId: "", 
                produtoQuantidade: 1,
                data: new Date().toISOString().split("T")[0],
                hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              });
            }}>Fechar</Button>
            {isEditMode && (
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
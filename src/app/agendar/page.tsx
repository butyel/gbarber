"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { collection, query, getDocs, doc, getDoc, addDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, startOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Calendar, Clock, Check, Loader2, AlertCircle, Scissors, ChevronLeft, ChevronRight } from "lucide-react";
import type { Servico, Barbeiro, Cliente } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const HORARIOS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00"
];

function formatTelefone(valor: string) {
  // Limita a 11 dígitos (DDD 2 + celular 9 dígitos)
  const nums = valor.replace(/\D/g, "").slice(0, 11);
  if (nums.length <= 2) return nums;
  if (nums.length <= 6) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
  if (nums.length <= 10) {
    // Fixo: (XX) XXXX-XXXX
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 6)}-${nums.slice(6)}`;
  }
  // Celular: (XX) 9XXXX-XXXX
  return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7)}`;
}

function AgendarContent() {
  const searchParams = useSearchParams();
  const barbeariaId = searchParams.get("barbearia");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");
  const [nomeBarbearia, setNomeBarbearia] = useState("");

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);

  const [servicoIds, setServicoIds] = useState<string[]>([]);
  const [barbeiroId, setBarbeiroId] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horaSelecionada, setHoraSelecionada] = useState("");

  const [nomeCliente, setNomeCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));

  useEffect(() => {
    if (!barbeariaId) return;
    fetchData();
  }, [barbeariaId]);

  useEffect(() => {
    if (dataSelecionada && barbeariaId && barbeiroId) {
      fetchHorariosOcupados();
    }
  }, [dataSelecionada, barbeiroId, barbeariaId]);

  const fetchData = async () => {
    if (!barbeariaId) return;
    try {
      console.log("Fetching data for barbeariaId:", barbeariaId);
      
      const barbeariaDoc = await getDoc(doc(db, "barbearias", barbeariaId));
      if (barbeariaDoc.exists()) {
        setNomeBarbearia(barbeariaDoc.data().nome || "Barbearia");
      }

      const servicosSnap = await getDocs(query(collection(db, `barbearias/${barbeariaId}/servicos`)));
      const servicosData = servicosSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Servico[];
      setServicos(servicosData);

      const barbeirosSnap = await getDocs(query(collection(db, `barbearias/${barbeariaId}/barbeiros`)));
      const barbeirosData = barbeirosSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Barbeiro[];
      setBarbeiros(barbeirosData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHorariosOcupados = async () => {
    if (!barbeariaId || !dataSelecionada || !barbeiroId) return;
    try {
      const snap = await getDocs(query(
        collection(db, `barbearias/${barbeariaId}/atendimentos`),
      ));

      const ocupados = snap.docs
        .filter(d => {
          const data = d.data();
          return data.barbeiroId === barbeiroId &&
            data.data === dataSelecionada &&
            data.status !== "cancelado";
        })
        .map(d => d.data().hora);

      setHorariosOcupados(ocupados);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleTelefoneChange = (valor: string) => {
    setTelefoneCliente(formatTelefone(valor));
  };

  const handleSubmit = async () => {
    const telefoneLimpi = telefoneCliente.replace(/\D/g, "");
    if (!barbeariaId || !nomeCliente || !telefoneCliente || servicoIds.length === 0 || !barbeiroId || !dataSelecionada || !horaSelecionada) {
      setErro("Preencha todos os campos");
      return;
    }

    if (telefoneLimpi.length < 10 || telefoneLimpi.length > 11) {
      setErro("Telefone inválido. Use o padrão (DDD) 9XXXX-XXXX");
      return;
    }

    setSubmitting(true);
    setErro("");
    try {
      const barbeiro = barbeiros.find(b => b.id === barbeiroId);
      const servicosSelecionados = servicos.filter(s => servicoIds.includes(s.id));
      const valorTotal = servicosSelecionados.reduce((sum, s) => sum + s.preco, 0);
      const comissaoTotal = servicosSelecionados.reduce((sum, s) => sum + (s.preco * (barbeiro?.comissaoServico || 40)) / 100, 0);
      const telefoneLimpo = telefoneCliente.replace(/\D/g, "");

      const snap = await getDocs(query(
        collection(db, `barbearias/${barbeariaId}/clientes`),
        where("telefone", "==", telefoneCliente)
      ));

      let clienteId = "";
      if (!snap.empty) {
        clienteId = snap.docs[0].id;
      } else {
        const clienteDoc = await addDoc(collection(db, `barbearias/${barbeariaId}/clientes`), {
          nome: nomeCliente,
          telefone: telefoneCliente,
          dataNascimento: dataNascimento || null,
          pontosFidelidade: 0,
          createdAt: serverTimestamp(),
        });
        clienteId = clienteDoc.id;
      }

      await addDoc(collection(db, `barbearias/${barbeariaId}/atendimentos`), {
        cliente: nomeCliente,
        telefone: telefoneCliente,
        clienteId: clienteId,
        barbeiroId,
        barbeiroNome: barbeiro?.nome || "",
        servicoIds,
        servicoNomes: servicosSelecionados.map(s => s.nome).join(", "),
        valor: valorTotal,
        comissao: comissaoTotal,
        data: dataSelecionada,
        hora: horaSelecionada,
        status: "agendado",
        createdAt: new Date(`${dataSelecionada}T${horaSelecionada}:00`),
      });

      setSucesso(true);
    } catch (error: any) {
      setErro(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!barbeariaId) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-none shadow-2xl">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">Link inválido</h1>
            <p className="text-muted-foreground">Acesse o link correto da sua barbearia.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
        <Card className="w-full max-w-md glass-card border-none shadow-2xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-black mb-2">Agendamento Confirmado!</h1>
            <p className="text-muted-foreground mb-6">
              Seu horário foi marcado para {format(new Date(dataSelecionada + "T12:00:00"), "dd/MM/yyyy")} às {horaSelecionada}.
            </p>
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/60">
              <p className="text-sm text-muted-foreground">
                Você receberá uma confirmação em breve.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const servicosSelecionados = servicos.filter(s => servicoIds.includes(s.id));
  const barbeiroSelecionado = barbeiros.find(b => b.id === barbeiroId);
  const valorTotal = servicosSelecionados.reduce((sum, s) => sum + s.preco, 0);

  return (
    <div className="min-h-screen bg-mesh py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-premium-gradient shadow-lg shadow-primary/20 mb-4">
            <Scissors className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">{nomeBarbearia}</h1>
          <p className="text-muted-foreground font-medium mt-1">Agende seu horário online</p>
        </div>

        {loading ? (
          <div className="space-y-4 animate-slide-up">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        ) : (
          <div className="space-y-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {erro && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-xl border border-destructive/20 text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {erro}
              </div>
            )}

            <Card className="glass-card border-none shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Seus Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    placeholder="Seu nome completo"
                    className="bg-white/60 border-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp *</Label>
                  <Input
                    value={telefoneCliente}
                    onChange={(e) => handleTelefoneChange(e.target.value)}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    inputMode="tel"
                    className="bg-white/60 border-white/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="bg-white/60 border-white/80"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-none shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Barbeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={barbeiroId} onValueChange={(val) => { setBarbeiroId(val); setHorariosOcupados([]); setHoraSelecionada(""); }}>
                  <SelectTrigger className="bg-white/60 border-white/80">
                    <SelectValue placeholder="Selecione um barbeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {barbeiros.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="glass-card border-none shadow-lg overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="pt-1 pb-3 px-5">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="text-center">
                      <span className="text-base font-bold capitalize tracking-tight text-foreground">
                        {format(calendarMonth, "MMMM", { locale: ptBR })}
                      </span>
                      <span className="text-base font-light text-muted-foreground ml-1.5">
                        {format(calendarMonth, "yyyy")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                      className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {["D", "S", "T", "Q", "Q", "S", "S"].map(d => (
                      <div key={d} className="text-[11px] font-semibold text-muted-foreground/40 tracking-wider py-1">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const monthStart = startOfMonth(calendarMonth);
                      const monthEnd = endOfMonth(calendarMonth);
                      const startDate = startOfWeek(monthStart);
                      const endDate = endOfWeek(monthEnd);
                      const today = startOfDay(new Date());
                      const rows: JSX.Element[] = [];
                      let day = startDate;
                      let weekCount = 0;
                      while (day <= endDate) {
                        weekCount++;
                        for (let i = 0; i < 7; i++) {
                          const currentDay = day;
                          const dateStr = format(currentDay, "yyyy-MM-dd");
                          const isDisabled = isBefore(currentDay, today) || currentDay.getDay() === 0;
                          const isSelected = dataSelecionada === dateStr;
                          const isCurrentMonth = isSameMonth(currentDay, calendarMonth);
                          const isToday = isSameDay(currentDay, new Date());
                          rows.push(
                            <button
                              key={dateStr}
                              type="button"
                              disabled={isDisabled || !isCurrentMonth}
                              onClick={() => { setDataSelecionada(dateStr); setHoraSelecionada(""); }}
                              className={cn(
                                "relative h-10 w-full rounded-full text-sm font-semibold transition-all duration-200",
                                !isCurrentMonth && "text-transparent pointer-events-none",
                                isCurrentMonth && isDisabled && "text-muted-foreground/20 cursor-not-allowed",
                                isCurrentMonth && !isDisabled && !isSelected && "text-foreground hover:bg-primary/8 hover:text-primary cursor-pointer",
                                isCurrentMonth && isSelected && "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105 font-bold",
                                isCurrentMonth && isToday && !isSelected && "text-primary font-bold"
                              )}
                            >
                              {format(currentDay, "d")}
                              {isCurrentMonth && isToday && !isSelected && (
                                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
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
                {dataSelecionada && (
                  <div className="border-t border-white/20 px-5 py-3 flex items-center justify-center gap-2 bg-white/30">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {format(new Date(dataSelecionada + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-none shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {HORARIOS.map(hora => {
                    const ocupado = horariosOcupados.includes(hora);
                    return (
                      <Button
                        key={hora}
                        variant={horaSelecionada === hora ? "default" : "outline"}
                        size="sm"
                        disabled={ocupado}
                        onClick={() => setHoraSelecionada(hora)}
                        className={cn(
                          "rounded-xl font-bold transition-all duration-200",
                          ocupado 
                            ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-100 cursor-not-allowed opacity-60" 
                            : horaSelecionada === hora 
                              ? "bg-primary text-primary-foreground hover:bg-primary shadow-lg shadow-primary/30 scale-105"
                              : "bg-white/60 border-white/80 text-foreground hover:border-primary/50 hover:bg-white hover:shadow-md"
                        )}
                      >
                        {hora}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                    <span>Disponível</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
                    <span>Ocupado</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-none shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Escolha o Serviço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Selecione um ou mais serviços</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {servicos.map(s => {
                    const isSelected = servicoIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setServicoIds(prev => 
                            isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id]
                          );
                        }}
                        className={cn(
                          "relative p-4 rounded-xl border-2 text-left transition-all duration-200 group",
                          isSelected 
                            ? "border-primary bg-primary/10 shadow-xl shadow-primary/10 scale-[1.02]" 
                            : "border-white/80 bg-white/40 hover:border-primary/40 hover:bg-white/60 hover:shadow-lg"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-bold text-base truncate",
                              isSelected && "text-primary"
                            )}>
                              {s.nome}
                            </p>
                            <p className={cn(
                              "text-lg font-black mt-1.5",
                              isSelected ? "text-primary" : "text-foreground"
                            )}>
                              {formatCurrency(s.preco)}
                            </p>
                          </div>
                          <div className={cn(
                            "w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200",
                            isSelected 
                              ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md" 
                              : "border-muted-foreground/30 group-hover:border-primary/50"
                          )}>
                            {isSelected && <Check className="h-4 w-4" />}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute inset-0 rounded-xl ring-2 ring-primary/30 pointer-events-none" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {servicos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8 bg-white/30 rounded-xl">
                    Nenhum serviço disponível no momento.
                  </p>
                )}
                {servicosSelecionados.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/40">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-muted-foreground">
                        {servicosSelecionados.length} serviço(s) selecionado(s)
                      </span>
                      <span className="text-lg font-black text-primary">
                        Total: {formatCurrency(valorTotal)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {servicosSelecionados.length > 0 && dataSelecionada && horaSelecionada && barbeiroSelecionado && (
              <div className="glass-panel rounded-2xl p-5 space-y-3 border border-white/60 animate-scale-in shadow-lg">
                <p className="font-black text-sm uppercase tracking-wider text-primary flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Resumo do Agendamento
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-white/30">
                    <span className="text-muted-foreground font-medium">Cliente</span>
                    <span className="font-bold">{nomeCliente}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/30">
                    <span className="text-muted-foreground font-medium">Barbeiro</span>
                    <span className="font-bold">{barbeiroSelecionado.nome}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-white/30">
                    <span className="text-muted-foreground font-medium">Data</span>
                    <span className="font-bold">{format(new Date(dataSelecionada + "T12:00:00"), "dd/MM/yyyy")} às {horaSelecionada}</span>
                  </div>
                  <div className="py-1.5 border-b border-white/30">
                    <span className="text-muted-foreground font-medium">Serviços</span>
                    <div className="mt-1.5 space-y-1">
                      {servicosSelecionados.map(s => (
                        <div key={s.id} className="flex justify-between text-sm">
                          <span className="font-medium">{s.nome}</span>
                          <span className="font-semibold text-primary">{formatCurrency(s.preco)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between py-2 mt-1">
                    <span className="text-muted-foreground font-medium">Total</span>
                    <span className="text-xl font-black text-primary">{formatCurrency(valorTotal)}</span>
                  </div>
                </div>
              </div>
            )}

            <Button 
              className="w-full h-14 text-base font-black rounded-2xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300"
              size="lg"
              onClick={handleSubmit} 
              disabled={submitting || !nomeCliente || !telefoneCliente || servicoIds.length === 0 || !barbeiroId || !dataSelecionada || !horaSelecionada}
            >
              {submitting && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              {submitting ? "Agendando..." : "Confirmar Agendamento"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-mesh flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <AgendarContent />
    </Suspense>
  );
}
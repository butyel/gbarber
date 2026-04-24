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
import { format, addDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { User, Calendar, Clock, Check, Loader2, AlertCircle, Scissors } from "lucide-react";
import type { Servico, Barbeiro, Cliente } from "@/types";
import { formatCurrency } from "@/lib/utils";

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

  const [servicoId, setServicoId] = useState("");
  const [barbeiroId, setBarbeiroId] = useState("");
  const [dataSelecionada, setDataSelecionada] = useState("");
  const [horaSelecionada, setHoraSelecionada] = useState("");

  const [nomeCliente, setNomeCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");

  const [datasDisponiveis, setDatasDisponiveis] = useState<Date[]>([]);
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);

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

      const datas: Date[] = [];
      const today = startOfDay(new Date());
      for (let i = 0; i <= 30; i++) { // Include today if possible
        const day = addDays(today, i);
        if (day.getDay() !== 0) {
          datas.push(day);
        }
      }
      setDatasDisponiveis(datas);
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
    if (!barbeariaId || !nomeCliente || !telefoneCliente || !servicoId || !barbeiroId || !dataSelecionada || !horaSelecionada) {
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
      const servico = servicos.find(s => s.id === servicoId);
      const barbeiro = barbeiros.find(b => b.id === barbeiroId);
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
        servicoId,
        servicoNome: servico?.nome || "",
        valor: servico?.preco || 0,
        comissao: (servico?.preco || 0) * (barbeiro?.comissaoServico || 40) / 100,
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">Link inválido</h1>
            <p className="text-muted-foreground">Acesse o link correto da sua barbearia.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">Agendamento Confirmado!</h1>
            <p className="text-muted-foreground mb-4">
              Seu horário foi marcado para {dataSelecionada} às {horaSelecionada}.
            </p>
            <p className="text-sm text-muted-foreground">
              Você receberá uma confirmação.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const servicoSelecionado = servicos.find(s => s.id === servicoId);
  const barbeiroSelecionado = barbeiros.find(b => b.id === barbeiroId);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{nomeBarbearia}</h1>
          <p className="text-muted-foreground">Agendamento Online</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {erro && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{erro}</div>
            )}

            <Card>
              <CardHeader>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Barbeiro
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={barbeiroId} onValueChange={(val) => { setBarbeiroId(val); setHorariosOcupados([]); setHoraSelecionada(""); }}>
                  <SelectTrigger>
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={dataSelecionada} onValueChange={(val) => { setDataSelecionada(val); setHoraSelecionada(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma data" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasDisponiveis.map(d => (
                      <SelectItem key={d.toISOString()} value={format(d, "yyyy-MM-dd")}>
                        {format(d, "EEEEEE, dd/MM", { locale: ptBR })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
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
                        className={ocupado 
                          ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-100" 
                          : horaSelecionada === hora 
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                        }
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scissors className="h-5 w-5" />
                  Serviço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={servicoId} onValueChange={setServicoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {servicos.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome} - {formatCurrency(s.preco)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {servicoSelecionado && (
              <div className="bg-gray-100 p-4 rounded-lg space-y-2">
                <p className="font-medium">Resumo do Agendamento:</p>
                <p><strong>Cliente:</strong> {nomeCliente}</p>
                <p><strong>Barbeiro:</strong> {barbeiroSelecionado?.nome}</p>
                <p><strong>Data:</strong> {dataSelecionada} às {horaSelecionada}</p>
                <p><strong>Serviço:</strong> {servicoSelecionado.nome}</p>
                <p className="text-xl font-bold text-green-600">
                  Total: {formatCurrency(servicoSelecionado.preco)}
                </p>
              </div>
            )}

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleSubmit} 
              disabled={submitting || !nomeCliente || !telefoneCliente || !servicoId || !barbeiroId || !dataSelecionada || !horaSelecionada}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Agendamento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AgendarContent />
    </Suspense>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
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
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { Plus, Search, Trash2, Loader2, RotateCcw, Eye, Pencil } from "lucide-react";
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

  const [lastAtendimento, setLastAtendimento] = useState<{servicoId: string; barbeiroId: string; valor: number} | null>(null);
  
  const [formData, setFormData] = useState({
    cliente: "",
    barbeiroId: "",
    servicoId: "",
    valor: 0,
    produtoId: "",
    produtoQuantidade: 1,
  });

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
          servicoId: last.servicoId,
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
    if (!user || !formData.cliente || !formData.barbeiroId || !formData.servicoId) {
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
      const servico = servicos.find(s => s.id === formData.servicoId);
      
      let comissao = 0;
      if (barbeiro && servico) {
        comissao = (servico.preco * barbeiro.comissaoServico) / 100;
      }

      const atendimento: any = {
        cliente: formData.cliente,
        barbeiroId: formData.barbeiroId,
        barbeiroNome: barbeiro?.nome || "",
        servicoId: formData.servicoId,
        servicoNome: servico?.nome || "",
        valor: formData.valor,
        comissao,
        createdAt: new Date(),
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
      setFormData({ cliente: "", barbeiroId: "", servicoId: "", valor: 0, produtoId: "", produtoQuantidade: 1 });
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao criar atendimento", description: error.message });
    } finally {
      setSubmitting(false);
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
      servicoId: appointment.servicoId,
      valor: appointment.valor,
      produtoId: appointment.produtoVendido?.produtoId || "",
      produtoQuantidade: appointment.produtoVendido?.quantidade || 1,
    });
    setIsModalOpen(true);
  };

  const filteredAppointments = appointments.filter(a => 
    a.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.barbeiroNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.servicoNome.toLowerCase().includes(searchTerm.toLowerCase())
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
        servicoId: lastAtendimento.servicoId,
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

      <div className="p-6 space-y-6">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente, barbeiro..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Barbeiro</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead></TableHead>
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
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum atendimento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>{formatDate(appointment.createdAt)}</TableCell>
                      <TableCell className="font-medium">{appointment.cliente}</TableCell>
                      <TableCell>{appointment.barbeiroNome}</TableCell>
                      <TableCell>{appointment.servicoNome}</TableCell>
                      <TableCell>{appointment.produtoVendido?.nome || "-"}</TableCell>
                      <TableCell>{formatCurrency(appointment.valor + (appointment.produtoVendido?.valor || 0))}</TableCell>
                      <TableCell>{formatCurrency(appointment.comissao)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleViewDetails(appointment)} title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(appointment)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(appointment.id)} title="Excluir">
                            <Trash2 className="h-4 w-4 text-destructive" />
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Editar Atendimento" : selectedAtendimento ? "Detalhes do Atendimento" : "Novo Atendimento"}
            </DialogTitle>
          </DialogHeader>
          
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
                <p className="text-sm text-muted-foreground">Serviço</p>
                <p className="font-medium">{selectedAtendimento.servicoNome}</p>
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
                <Label>Serviço</Label>
                <Select value={formData.servicoId} onValueChange={(v) => {
                  const servico = servicos.find(s => s.id === v);
                  setFormData({ ...formData, servicoId: v, valor: servico?.preco || 0 });
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {servicos.map(s => <SelectItem key={s.id} value={s.id}>{s.nome} - {formatCurrency(s.preco)}</SelectItem>)}
                  </SelectContent>
                </Select>
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
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsModalOpen(false);
              setSelectedAtendimento(null);
              setIsEditMode(false);
              setFormData({ cliente: "", barbeiroId: "", servicoId: "", valor: 0, produtoId: "", produtoQuantidade: 1 });
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
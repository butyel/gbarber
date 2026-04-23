"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, CreditCard, Tag, Sparkles, TrendingUp, Users } from "lucide-react";
import type { PlanoCliente, Cliente } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/ui/stat-card";
import { cn } from "@/lib/utils";

export default function PlanosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [planos, setPlanos] = useState<PlanoCliente[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    preco: 0,
    tipo: "mensal" as "mensal" | "semestral" | "anual",
    descricao: "",
  });

  useEffect(() => {
    if (!user || !db) return;
    fetchData();
  }, [user, db]);

  const fetchData = async () => {
    try {
      // Fetch Planos
      const planosSnapshot = await getDocs(query(collection(db, `barbearias/${user!.id}/planos_clientes`), orderBy("nome")));
      const planosList = planosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as PlanoCliente[];
      setPlanos(planosList);

      // Fetch Clientes to count active subscriptions
      const clientesSnapshot = await getDocs(collection(db, `barbearias/${user!.id}/clientes`));
      setClientes(clientesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Cliente[]);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({ variant: "destructive", title: "Erro ao carregar dados" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !db || !formData.nome || formData.preco <= 0) {
      toast({ variant: "destructive", title: "Preencha nome e preço do plano" });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, `barbearias/${user.id}/planos_clientes`, editingId), formData);
        toast({ title: "Plano atualizado!", description: "As alterações foram salvas com sucesso." });
      } else {
        await addDoc(collection(db, `barbearias/${user.id}/planos_clientes`), {
          ...formData,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Plano criado!", description: "O novo plano já está disponível para os clientes." });
      }
      setIsModalOpen(false);
      setFormData({ nome: "", preco: 0, tipo: "mensal", descricao: "" });
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (plano: PlanoCliente) => {
    setFormData({
      nome: plano.nome,
      preco: plano.preco,
      tipo: plano.tipo,
      descricao: plano.descricao || "",
    });
    setEditingId(plano.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este plano? Clientes vinculados perderão o acesso ao plano.")) return;
    try {
      await deleteDoc(doc(db, `barbearias/${user!.id}/planos_clientes`, id));
      toast({ title: "Plano excluído" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  const filteredPlanos = planos.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientesNoPlano = (planoId: string) => {
    return clientes.filter(c => c.planoId === planoId).length;
  };

  const totalAssinantes = clientes.filter(c => c.planoId && c.planoId !== "none").length;
  const faturamentoEstimado = planos.reduce((acc, p) => acc + (p.preco * getClientesNoPlano(p.id)), 0);

  return (
    <div className="min-h-screen bg-background pb-12">
      <Topbar 
        action={
          <Button 
            onClick={() => { setFormData({ nome: "", preco: 0, tipo: "mensal", descricao: "" }); setEditingId(null); setIsModalOpen(true); }}
            className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg glow-blue transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        }
      />

      <div className="bg-grid-pattern border-b border-border/50">
        <div className="p-6 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent" />
                Gestão de Planos
              </h2>
              <p className="text-muted-foreground mt-1">
                Configure e gerencie as assinaturas recorrentes dos seus clientes.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Total de Planos"
              value={planos.length}
              icon={<Tag className="h-4 w-4" />}
              description="Modelos de assinatura ativos"
              loading={loading}
              className="glass-card border-accent/20"
            />
            <StatCard 
              title="Assinantes Ativos"
              value={totalAssinantes}
              icon={<Users className="h-4 w-4" />}
              description="Clientes vinculados a planos"
              loading={loading}
              className="glass-card border-accent/20"
            />
            <StatCard 
              title="Faturamento Mensal (Est.)"
              value={`R$ ${faturamentoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              icon={<TrendingUp className="h-4 w-4 text-green-500" />}
              description="Baseado nas assinaturas atuais"
              loading={loading}
              valueClassName="text-green-600"
              className="glass-card border-accent/20"
            />
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-accent" />
            <Input 
              placeholder="Buscar por nome do plano..." 
              className="pl-10 bg-card border-border/50 focus:border-accent/50 focus:ring-accent/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="glass-card overflow-hidden border-border/50 shadow-xl">
          <CardHeader className="bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent" />
                  Lista de Planos Disponíveis
                </CardTitle>
                <CardDescription>
                  Visualize e edite os detalhes de cada oferta.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="pl-6">Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Assinantes</TableHead>
                  <TableHead className="hidden md:table-cell">Descrição</TableHead>
                  <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6"><div className="h-5 w-32 bg-muted animate-pulse rounded"></div></TableCell>
                      <TableCell><div className="h-5 w-20 bg-muted animate-pulse rounded"></div></TableCell>
                      <TableCell><div className="h-5 w-16 bg-muted animate-pulse rounded"></div></TableCell>
                      <TableCell><div className="h-5 w-12 bg-muted animate-pulse rounded"></div></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-5 w-48 bg-muted animate-pulse rounded"></div></TableCell>
                      <TableCell className="text-right pr-6"><div className="h-8 w-20 ml-auto bg-muted animate-pulse rounded"></div></TableCell>
                    </TableRow>
                  ))
                ) : filteredPlanos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <Tag className="h-10 w-10 opacity-20" />
                        <p className="text-lg font-medium">Nenhum plano encontrado</p>
                        <p className="text-sm">Clique em "Novo Plano" para começar.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlanos.map((plano) => (
                    <TableRow key={plano.id} className="hover:bg-muted/10 transition-colors group">
                      <TableCell className="font-semibold pl-6 text-foreground">{plano.nome}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          plano.tipo === 'mensal' ? "bg-blue-100 text-blue-700" :
                          plano.tipo === 'semestral' ? "bg-purple-100 text-purple-700" :
                          "bg-orange-100 text-orange-700"
                        )}>
                          {plano.tipo}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono font-bold text-accent">
                        R$ {plano.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{getClientesNoPlano(plano.id)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-xs truncate hidden md:table-cell">
                        {plano.descricao || "Sem descrição"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(plano)}
                            className="hover:bg-accent/10 hover:text-accent transition-colors"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(plano.id)}
                            className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                          >
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
        <DialogContent className="sm:max-w-[500px] glass-panel border-accent/20">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              {editingId ? <Pencil className="h-5 w-5 text-accent" /> : <Plus className="h-5 w-5 text-accent" />}
              {editingId ? "Editar Plano" : "Novo Plano de Assinatura"}
            </DialogTitle>
            <DialogDescription>
              Preencha os detalhes do plano que deseja oferecer aos seus clientes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="nome" className="text-sm font-semibold">Nome do Plano</Label>
              <Input 
                id="nome"
                value={formData.nome} 
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })} 
                placeholder="Ex: Assinatura Mensal Premium"
                className="bg-muted/50 border-border/50 focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo" className="text-sm font-semibold">Tipo de Ciclo</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(val) => setFormData({ ...formData, tipo: val as any })}
                >
                  <SelectTrigger id="tipo" className="bg-muted/50 border-border/50 focus:border-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="preco" className="text-sm font-semibold">Valor (R$)</Label>
                <Input 
                  id="preco"
                  type="number"
                  value={formData.preco} 
                  onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })} 
                  placeholder="0,00"
                  className="bg-muted/50 border-border/50 focus:border-accent font-mono"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descricao" className="text-sm font-semibold">O que está incluso?</Label>
              <Input 
                id="descricao"
                value={formData.descricao} 
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} 
                placeholder="Ex: Cortes ilimitados + Lavagem grátis"
                className="bg-muted/50 border-border/50 focus:border-accent"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="flex-1 sm:flex-none bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {submitting ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Plano"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
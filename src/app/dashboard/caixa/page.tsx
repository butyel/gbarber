"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, addDoc, doc, getDoc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, getToday, formatDate } from "@/lib/utils";
import { Wallet, DollarSign, TrendingUp, TrendingDown, Lock, Unlock, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Atendimento, CaixaDia, Despesa } from "@/types";

export default function CaixaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [caixaAtual, setCaixaAtual] = useState<CaixaDia | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Atendimento[]>([]);
  const [aberturaCaixa, setAberturaCaixa] = useState(0);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [isModalDespesaOpen, setIsModalDespesaOpen] = useState(false);
  const [despesaForm, setDespesaForm] = useState({ nome: "", valor: 0, categoria: "outros" });

  useEffect(() => {
    if (!user || !db) return;
    fetchData();
  }, [user, db]);

  const fetchData = async () => {
    try {
      const today = getToday();
      
      const caixaRef = doc(db, `barbearias/${user!.id}/caixa`, today);
      const caixaSnap = await getDoc(caixaRef);
      
      if (caixaSnap.exists()) {
        const data = caixaSnap.data();
        setCaixaAberto(data.fechado === false);
        setCaixaAtual({
          id: caixaSnap.id,
          data: today,
          abertura: data.abertura || 0,
          fechamento: data.fechamento,
          totalServicos: data.totalServicos || 0,
          totalProdutos: data.totalProdutos || 0,
          totalDespesas: data.totalDespesas || 0,
          totalComissoes: data.totalComissoes || 0,
          lucroLiquido: data.lucroLiquido || 0,
          fechado: data.fechado || false,
          createdAt: data.createdAt?.toDate() || new Date(),
        });
        setAberturaCaixa(data.abertura || 0);
      }

      const todayStart = new Date(today);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const appointmentsSnap = await getDocs(query(
        collection(db, `barbearias/${user!.id}/atendimentos`),
        where("createdAt", ">=", todayStart),
        where("createdAt", "<=", todayEnd),
        orderBy("createdAt", "desc")
      ));

      const appointments = appointmentsSnap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }))
        .filter((a: any) => a.status === "finalizado") as Atendimento[];

      setTodayAppointments(appointments);

      const despesasSnap = await getDocs(query(
        collection(db, `barbearias/${user!.id}/despesas`),
        where("data", "==", today)
      ));
      setDespesas(despesasSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate() || new Date(),
      })) as Despesa[]);
    } catch (error) {
      console.error("Error fetching caixa data:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirCaixa = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const today = getToday();
      
      await setDoc(doc(db, `barbearias/${user.id}/caixa`, today), {
        abertura: aberturaCaixa,
        totalServicos: 0,
        totalProdutos: 0,
        totalDespesas: 0,
        totalComissoes: 0,
        lucroLiquido: 0,
        fechado: false,
        createdAt: serverTimestamp(),
      });

      toast({ title: "Caixa aberto!" });
      setCaixaAberto(true);
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao abrir caixa", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const calcularLucro = () => {
    const totalServ = todayAppointments.reduce((sum, a) => sum + a.valor, 0);
    const totalProd = todayAppointments.reduce((sum, a) => sum + (a.produtoVendido?.valor || 0), 0);
    const totalComiss = todayAppointments.reduce((sum, a) => sum + a.comissao, 0);
    const desp = despesas.reduce((sum, d) => sum + d.valor, 0);
    const fat = totalServ + totalProd;
    return fat - totalComiss - desp;
  };

  const fecharCaixa = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const today = getToday();
      const totalServicos = todayAppointments.reduce((sum, a) => sum + a.valor, 0);
      const totalProdutos = todayAppointments.reduce((sum, a) => sum + (a.produtoVendido?.valor || 0), 0);
      const totalDespesasCalc = despesas.reduce((sum, d) => sum + d.valor, 0);
      const totalComissoes = todayAppointments.reduce((sum, a) => sum + a.comissao, 0);
      const faturamentoTotal = totalServicos + totalProdutos;
      const lucroLiquido = faturamentoTotal - totalComissoes - totalDespesasCalc;

      await setDoc(doc(db, `barbearias/${user.id}/caixa`, today), {
        abertura: aberturaCaixa,
        fechamento: aberturaCaixa + lucroLiquido,
        totalServicos,
        totalProdutos,
        totalDespesas: totalDespesasCalc,
        totalComissoes,
        lucroLiquido,
        fechado: true,
      }, { merge: true });

      toast({ title: "Caixa fechado!" });
      setCaixaAberto(false);
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro ao fechar caixa", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const totalServicos = todayAppointments.reduce((sum, a) => sum + a.valor, 0);
  const totalProdutos = todayAppointments.reduce((sum, a) => sum + (a.produtoVendido?.valor || 0), 0);
  const totalComissoes = todayAppointments.reduce((sum, a) => sum + a.comissao, 0);
  const totalDespesasDia = despesas.reduce((sum, d) => sum + d.valor, 0);
  const faturamentoTotal = totalServicos + totalProdutos;
  const lucroLiquido = faturamentoTotal - totalComissoes - totalDespesasDia;

  const adicionarDespesa = async () => {
    if (!user || !despesaForm.nome || despesaForm.valor <= 0) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, `barbearias/${user.id}/despesas`), {
        nome: despesaForm.nome,
        valor: despesaForm.valor,
        categoria: despesaForm.categoria,
        data: getToday(),
        createdAt: serverTimestamp(),
      });
      setIsModalDespesaOpen(false);
      setDespesaForm({ nome: "", valor: 0, categoria: "outros" });
      fetchData();
      toast({ title: "Despesa adicionada!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const excluirDespesa = async (id: string) => {
    if (!confirm("Excluir esta despesa?")) return;
    try {
      await deleteDoc(doc(db, `barbearias/${user!.id}/despesas`, id));
      toast({ title: "Despesa excluída" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  return (
    <div className="min-h-screen">
      <Topbar />

      <div className="p-6 space-y-6">
        {!caixaAberto && !loading && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Caixa Fechado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-yellow-800">Valor de Abertura</Label>
                  <Input 
                    type="number" 
                    value={aberturaCaixa} 
                    onChange={(e) => setAberturaCaixa(parseFloat(e.target.value) || 0)}
                    className="bg-white"
                  />
                </div>
                <Button onClick={abrirCaixa} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Unlock className="h-4 w-4 mr-2" />
                  Abrir Caixa
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abertura</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold">{formatCurrency(caixaAberto ? caixaAtual?.abertura || aberturaCaixa : aberturaCaixa)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold">{formatCurrency(faturamentoTotal)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Comissões</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold text-destructive">-{formatCurrency(totalComissoes)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold text-success">{formatCurrency(lucroLiquido)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviços</span>
                <span className="font-medium">{formatCurrency(totalServicos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Produtos</span>
                <span className="font-medium">{formatCurrency(totalProdutos)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Faturado</span>
                <span className="font-bold">{formatCurrency(faturamentoTotal)}</span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="text-muted-foreground">Comissões</span>
                <span className="font-medium text-destructive">-{formatCurrency(totalComissoes)}</span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="text-muted-foreground">Despesas</span>
                <span className="font-medium text-destructive">-{formatCurrency(totalDespesasDia)}</span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="font-medium">Lucro Líquido</span>
                <span className="font-bold text-success">{formatCurrency(lucroLiquido)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atendimentos do Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-3xl font-bold">{todayAppointments.length}</div>
                <p className="text-muted-foreground">atendimentos realizados</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Despesas do Dia</CardTitle>
            <Button size="sm" onClick={() => setIsModalDespesaOpen(true)} disabled={!caixaAberto}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            {despesas.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhuma despesa hoje</p>
            ) : (
              <Table>
                <TableBody>
                  {despesas.map(d => (
                    <TableRow key={d.id}>
                      <TableCell>{d.nome}</TableCell>
                      <TableCell className="capitalize">{d.categoria}</TableCell>
                      <TableCell className="text-right">{formatCurrency(d.valor)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => excluirDespesa(d.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {despesas.length > 0 && (
              <div className="border-t mt-4 pt-4 flex justify-between">
                <span className="font-medium">Total Despesas</span>
                <span className="font-bold text-destructive">-{formatCurrency(totalDespesasDia)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {caixaAberto && (
          <div className="flex justify-end">
            <Button onClick={fecharCaixa} disabled={submitting} className="bg-destructive hover:bg-destructive/90">
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Lock className="h-4 w-4 mr-2" />
              Fechar Caixa
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isModalDespesaOpen} onOpenChange={setIsModalDespesaOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Despesa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={despesaForm.nome}
                onChange={(e) => setDespesaForm({ ...despesaForm, nome: e.target.value })}
                placeholder="Ex: Aluguel, Luz, Produtos"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  value={despesaForm.valor}
                  onChange={(e) => setDespesaForm({ ...despesaForm, valor: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={despesaForm.categoria}
                  onValueChange={(val) => setDespesaForm({ ...despesaForm, categoria: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aluguel">Aluguel</SelectItem>
                    <SelectItem value="luz">Luz</SelectItem>
                    <SelectItem value="internet">Internet</SelectItem>
                    <SelectItem value="produtos">Produtos</SelectItem>
                    <SelectItem value="manutencao">Manutenção</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalDespesaOpen(false)}>Cancelar</Button>
            <Button onClick={adicionarDespesa} disabled={submitting}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
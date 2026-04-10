"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs, addDoc, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getToday, formatDate } from "@/lib/utils";
import { Wallet, DollarSign, TrendingUp, TrendingDown, Lock, Unlock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Atendimento, CaixaDia } from "@/types";

export default function CaixaPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [caixaAberto, setCaixaAberto] = useState(false);
  const [caixaAtual, setCaixaAtual] = useState<CaixaDia | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Atendimento[]>([]);
  const [aberturaCaixa, setAberturaCaixa] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

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

      const appointments = appointmentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Atendimento[];

      setTodayAppointments(appointments);
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

  const fecharCaixa = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const today = getToday();
      const totalServicos = todayAppointments.reduce((sum, a) => sum + a.valor, 0);
      const totalProdutos = todayAppointments.reduce((sum, a) => sum + (a.produtoVendido?.valor || 0), 0);
      const totalComissoes = todayAppointments.reduce((sum, a) => sum + a.comissao, 0);
      const faturamentoTotal = totalServicos + totalProdutos;
      const lucroLiquido = faturamentoTotal - totalComissoes;

      await setDoc(doc(db, `barbearias/${user.id}/caixa`, today), {
        abertura: aberturaCaixa,
        fechamento: aberturaCaixa + lucroLiquido,
        totalServicos,
        totalProdutos,
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
  const faturamentoTotal = totalServicos + totalProdutos;
  const lucroLiquido = faturamentoTotal - totalComissoes;

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
    </div>
  );
}
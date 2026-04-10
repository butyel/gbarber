"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, getToday } from "@/lib/utils";
import { TrendingUp, Calendar, Users } from "lucide-react";
import type { Atendimento } from "@/types";

interface BarbeiroComissao {
  nome: string;
  atendimentos: number;
  valorServicos: number;
  valorProdutos: number;
  comissaoServico: number;
  comissaoProduto: number;
  comissaoTotal: number;
}

export default function ComissoesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("hoje");
  const [barbeiros, setBarbeiros] = useState<BarbeiroComissao[]>([]);
  const [totalGeral, setTotalGeral] = useState({ comissao: 0, servicos: 0, produtos: 0 });

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, periodo]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const hoje = getToday();
      let startDate = new Date(hoje);
      startDate.setHours(0, 0, 0, 0);
      let endDate = new Date(hoje);
      endDate.setHours(23, 59, 59, 999);

      if (periodo === "semana") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      } else if (periodo === "mes") {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      const [appointmentsSnap, barbeirosSnap] = await Promise.all([
        getDocs(query(
          collection(db, `barbearias/${user.id}/atendimentos`),
          where("createdAt", ">=", startDate),
          where("createdAt", "<=", endDate),
          orderBy("createdAt", "desc")
        )),
        getDocs(query(collection(db, `barbearias/${user.id}/barbeiros`))),
      ]);

      const barbeirosMap: Record<string, any> = {};
      barbeirosSnap.docs.forEach(doc => {
        const data = doc.data();
        barbeirosMap[doc.id] = {
          comissaoServico: data.comissaoServico || 40,
          comissaoProduto: data.comissaoProduto || 15,
        };
      });

      const appointments = appointmentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Atendimento[];

      const barbeirosAgrupados: Record<string, BarbeiroComissao> = {};
      
      appointments.forEach(a => {
        if (!barbeirosAgrupados[a.barbeiroNome]) {
          const comissaoRates = barbeirosMap[a.barbeiroId] || { comissaoServico: 40, comissaoProduto: 15 };
          barbeirosAgrupados[a.barbeiroNome] = {
            nome: a.barbeiroNome,
            atendimentos: 0,
            valorServicos: 0,
            valorProdutos: 0,
            comissaoServico: 0,
            comissaoProduto: 0,
            comissaoTotal: 0,
          };
        }
        
        const rates = barbeirosMap[a.barbeiroId] || { comissaoServico: 40, comissaoProduto: 15 };
        
        barbeirosAgrupados[a.barbeiroNome].atendimentos += 1;
        barbeirosAgrupados[a.barbeiroNome].valorServicos += a.valor;
        barbeirosAgrupados[a.barbeiroNome].comissaoServico += (a.valor * rates.comissaoServico) / 100;
        
        if (a.produtoVendido) {
          barbeirosAgrupados[a.barbeiroNome].valorProdutos += a.produtoVendido.valor;
          barbeirosAgrupados[a.barbeiroNome].comissaoProduto += (a.produtoVendido.valor * rates.comissaoProduto) / 100;
        }
      });

      Object.keys(barbeirosAgrupados).forEach(nome => {
        barbeirosAgrupados[nome].comissaoTotal = 
          barbeirosAgrupados[nome].comissaoServico + 
          barbeirosAgrupados[nome].comissaoProduto;
      });

      const barbeirosOrdenados = Object.values(barbeirosAgrupados)
        .sort((a, b) => b.comissaoTotal - a.comissaoTotal);

      const totalComissao = barbeirosOrdenados.reduce((sum, b) => sum + b.comissaoTotal, 0);
      const totalServicos = barbeirosOrdenados.reduce((sum, b) => sum + b.valorServicos, 0);
      const totalProdutos = barbeirosOrdenados.reduce((sum, b) => sum + b.valorProdutos, 0);

      setBarbeiros(barbeirosOrdenados);
      setTotalGeral({ comissao: totalComissao, servicos: totalServicos, produtos: totalProdutos });
    } catch (error) {
      console.error("Error fetching commissions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Topbar 
        action={
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-40">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="semana">Esta Semana</SelectItem>
              <SelectItem value="mes">Este Mês</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total em Comissões</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold">{formatCurrency(totalGeral.comissao)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor em Serviços</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold">{formatCurrency(totalGeral.servicos)}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor em Produtos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-24" /> : (
                <div className="text-2xl font-bold">{formatCurrency(totalGeral.produtos)}</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Comissões por Barbeiro</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : barbeiros.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma comissão no período</p>
            ) : (
              <div className="space-y-4">
                {barbeiros.map((barbeiro, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent text-primary flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-lg">{barbeiro.nome}</p>
                        <p className="text-sm text-muted-foreground">{barbeiro.atendimentos} atendimentos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{formatCurrency(barbeiro.comissaoTotal)}</p>
                      <p className="text-sm text-muted-foreground">
                        Serviços: {formatCurrency(barbeiro.valorServicos)} | Produtos: {formatCurrency(barbeiro.valorProdutos)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
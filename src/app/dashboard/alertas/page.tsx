"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Package, TrendingDown, DollarSign } from "lucide-react";
import { formatCurrency, getToday } from "@/lib/utils";

interface AlertaEstoque {
  tipo: "estoque";
  produto: string;
  quantidade: number;
}

interface AlertaBarbeiro {
  tipo: "barbeiro";
  barbeiro: string;
  atendimentos: number;
  faturamento: number;
}

interface AlertaFaturamento {
  tipo: "faturamento";
  dia: string;
  valor: number;
}

export default function AlertasPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState<(AlertaEstoque | AlertaBarbeiro | AlertaFaturamento)[]>([]);

  useEffect(() => {
    if (!user || !db) return;
    fetchAlertas();
  }, [user, db]);

  const fetchAlertas = async () => {
    if (!user || !db) return;
    
    const novosAlertas: (AlertaEstoque | AlertaBarbeiro | AlertaFaturamento)[] = [];

    try {
      // Verificar estoque baixo
      const produtosSnap = await getDocs(collection(db, `barbearias/${user.id}/produtos`));
      produtosSnap.forEach(doc => {
        const produto = doc.data();
        if (produto.quantidade <= 5) {
          novosAlertas.push({
            tipo: "estoque",
            produto: produto.nome,
            quantidade: produto.quantidade,
          });
        }
      });

      // Verificar barbeiros com baixa performance (últimos 7 dias)
      const seteDiasAtras = new Date();
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      
      const atendimentosSnap = await getDocs(
        query(
          collection(db, `barbearias/${user.id}/atendimentos`),
          where("createdAt", ">=", seteDiasAtras),
          orderBy("createdAt", "desc")
        )
      );

      const barbeirosMap: Record<string, { atendimentos: number; faturamento: number }> = {};
      atendimentosSnap.forEach(doc => {
        const att = doc.data();
        if (!barbeirosMap[att.barbeiroId]) {
          barbeirosMap[att.barbeiroId] = { atendimentos: 0, faturamento: 0 };
        }
        barbeirosMap[att.barbeiroId].atendimentos++;
        barbeirosMap[att.barbeiroId].faturamento += att.valor || 0;
      });

      const barbeirosSnap = await getDocs(collection(db, `barbearias/${user.id}/barbeiros`));
      const barbeiros = barbeirosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      Object.entries(barbeirosMap).forEach(([barbeiroId, stats]) => {
        const barba = barbeiros.find(b => b.id === barbairoId);
        if (stats.atendimentos < 5) {
          novosAlertas.push({
            tipo: "barbeiro",
            barbeiro: barba?.nome || "Barbeiro",
            atendimentos: stats.atendimentos,
            faturamento: stats.faturamento,
          });
        }
      });

      // Verificar dia fraco de faturamento (últimos 7 dias)
      const ultimosAtendimentos = await getDocs(
        query(
          collection(db, `barbearias/${user.id}/atendimentos`),
          where("createdAt", ">=", seteDiasAtras),
          orderBy("createdAt", "desc")
        )
      );

      const faturamentoPorDia: Record<string, number> = {};
      ultimosAtendimentos.forEach(doc => {
        const att = doc.data();
        const data = att.createdAt?.toDate?.().toISOString().split("T")[0] || getToday();
        if (!faturamentoPorDia[data]) faturamentoPorDia[data] = 0;
        faturamentoPorDia[data] += att.valor || 0;
      });

      const valores = Object.values(faturamentoPorDia);
      const media = valores.length > 0 ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;

      Object.entries(faturamentoPorDia).forEach(([dia, valor]) => {
        if (valor < media * 0.5 && valores.length >= 3) {
          novosAlertas.push({
            tipo: "faturamento",
            dia,
            valor,
          });
        }
      });

    } catch (error) {
      console.error("Erro ao buscar alertas:", error);
    }

    setAlertas(novosAlertas);
    setLoading(false);
  };

  const getIconeAlerta = (tipo: string) => {
    switch (tipo) {
      case "estoque": return <Package className="h-5 w-5" />;
      case "barbeiro": return <TrendingDown className="h-5 w-5" />;
      case "faturamento": return <DollarSign className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getCorAlerta = (tipo: string) => {
    switch (tipo) {
      case "estoque": return "bg-orange-100 text-orange-800 border-orange-200";
      case "barbeiro": return "bg-red-100 text-red-800 border-red-200";
      case "faturamento": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTituloAlerta = (alerta: AlertaEstoque | AlertaBarbeiro | AlertaFaturamento) => {
    switch (alerta.tipo) {
      case "estoque": return `Estoque baixo: ${alerta.produto}`;
      case "barbeiro": return `Baixa performance: ${alerta.barbeiro}`;
      case "faturamento": return `Dia fraco: ${alerta.dia}`;
      default: return "Alerta";
    }
  };

  return (
    <div className="min-h-screen">
      <Topbar />
      
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Alertas do Sistema</h2>
          <p className="text-muted-foreground">Fique atento aos avisos importantes</p>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : alertas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium">Tudo em ordem!</p>
              <p className="text-muted-foreground">Nenhum alerta no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {alertas.map((alerta, idx) => (
              <Card key={idx} className={`border-l-4 ${getCorAlerta(alerta.tipo).split(" ")[2]}`}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`p-2 rounded-full ${getCorAlerta(alerta.tipo)}`}>
                    {getIconeAlerta(alerta.tipo)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{getTituloAlerta(alerta)}</p>
                    {alerta.tipo === "estoque" && (
                      <p className="text-sm text-muted-foreground">Apenas {alerta.quantidade} unidades restantes</p>
                    )}
                    {alerta.tipo === "barbeiro" && (
                      <p className="text-sm text-muted-foreground">{alerta.atendimentos} atendimentos (R$ {alerta.faturamento.toFixed(2)})</p>
                    )}
                    {alerta.tipo === "faturamento" && (
                      <p className="text-sm text-muted-foreground">Faturamento: {formatCurrency(alerta.valor)}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
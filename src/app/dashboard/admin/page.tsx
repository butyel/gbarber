"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Crown, Users } from "lucide-react";
import type { Barbearia } from "@/types";
import { redirect } from "next/navigation";

interface BarbeariaWithOwner extends Barbearia {
  ownerEmail: string;
}

export default function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [barbearias, setBarbearias] = useState<BarbeariaWithOwner[]>([]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  // Redirect if not admin
  if (!isAdmin) {
    redirect("/dashboard");
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const barbeariasSnap = await getDocs(
        query(collection(db, "barbearias"), orderBy("createdAt", "desc"))
      );
      
      const barbeariasData: BarbeariaWithOwner[] = [];
      
      for (const doc of barbeariasSnap.docs) {
        const usersSnap = await getDocs(collection(db, "users"));
        const userDoc = usersSnap.docs.find(u => u.id === doc.id);
        
        barbeariasData.push({
          id: doc.id,
          nome: doc.data().nome,
          plano: doc.data().plano || "free",
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          ownerEmail: userDoc?.data()?.email || "",
        });
      }
      
      setBarbearias(barbeariasData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Acesso restrito ao administrador</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Topbar />

      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-accent" />
              Painel do Administrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Barbearia</TableHead>
                  <TableHead>Email do Dono</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Data de Criação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : barbearias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Nenhuma barbearia encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  barbearias.map((barbearia) => (
                    <TableRow key={barbearia.id}>
                      <TableCell className="font-medium">{barbearia.nome}</TableCell>
                      <TableCell>{barbearia.ownerEmail}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          barbearia.plano === "premium" ? "bg-purple-100 text-purple-800" :
                          barbearia.plano === "pro" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {barbearia.plano.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(barbearia.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Estatísticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{barbearias.length}</p>
                <p className="text-sm text-muted-foreground">Total de Barbearias</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{barbearias.filter(b => b.plano === "pro").length}</p>
                <p className="text-sm text-muted-foreground">Plano Pro</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{barbearias.filter(b => b.plano === "premium").length}</p>
                <p className="text-sm text-muted-foreground">Plano Premium</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
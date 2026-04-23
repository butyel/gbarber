"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Search, CreditCard, Tag } from "lucide-react";
import type { PlanoCliente } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function PlanosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [planos, setPlanos] = useState<PlanoCliente[]>([]);
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
      const snapshot = await getDocs(query(collection(db, `barbearias/${user!.id}/planos_clientes`), orderBy("nome")));
      setPlanos(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as PlanoCliente[]);
    } catch (error) {
      console.error("Error fetching planos:", error);
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
        toast({ title: "Plano atualizado!" });
      } else {
        await addDoc(collection(db, `barbearias/${user.id}/planos_clientes`), {
          ...formData,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Plano criado!" });
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
    if (!confirm("Excluir este plano?")) return;
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

  const tipoLabel = (tipo: string) => {
    switch (tipo) {
      case "mensal": return "Mensal";
      case "semestral": return "Semestral";
      case "anual": return "Anual";
      default: return tipo;
    }
  };

  return (
    <div className="min-h-screen">
      <Topbar 
        action={
          <Button onClick={() => { setFormData({ nome: "", preco: 0, tipo: "mensal", descricao: "" }); setEditingId(null); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar plano..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Planos de Assinatura ({planos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-32 bg-muted rounded"></div></TableCell>
                      <TableCell><div className="h-4 w-20 bg-muted rounded"></div></TableCell>
                      <TableCell><div className="h-4 w-16 bg-muted rounded"></div></TableCell>
                      <TableCell><div className="h-4 w-40 bg-muted rounded"></div></TableCell>
                      <TableCell><div className="h-8 w-16 bg-muted rounded"></div></TableCell>
                    </TableRow>
                  ))
                ) : filteredPlanos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum plano cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlanos.map((plano) => (
                    <TableRow key={plano.id}>
                      <TableCell className="font-medium">{plano.nome}</TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {tipoLabel(plano.tipo)}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        R$ {plano.preco.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{plano.descricao || "-"}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(plano)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(plano.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Plano" : "Novo Plano de Assinatura"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Plano</Label>
              <Input 
                value={formData.nome} 
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })} 
                placeholder="Ex: Plano Premium"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Cobrança</Label>
              <Select 
                value={formData.tipo} 
                onValueChange={(val) => setFormData({ ...formData, tipo: val as "mensal" | "semestral" | "anual" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mensal">Mensal</SelectItem>
                  <SelectItem value="semestral">Semestral</SelectItem>
                  <SelectItem value="anual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input 
                type="number"
                value={formData.preco} 
                onChange={(e) => setFormData({ ...formData, preco: parseFloat(e.target.value) || 0 })} 
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input 
                value={formData.descricao} 
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} 
                placeholder="O que inclui"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
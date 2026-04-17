"use client";

import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import type { Barbeiro } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { normalizePhoneNumber } from "@/lib/utils";

export default function BarbeirosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    comissaoServico: 40,
    comissaoProduto: 15,
    email: "",
    senha: "",
  });

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, `barbearias/${user!.id}/barbeiros`), orderBy("nome")));
      setBarbeiros(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Barbeiro[]);
    } catch (error) {
      console.error("Error fetching barbers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.nome) {
      toast({ variant: "destructive", title: "Preencha o nome" });
      return;
    }

    setSubmitting(true);
    try {
      const normalizedPhone = normalizePhoneNumber(formData.telefone);
      if (editingId) {
        await updateDoc(doc(db, `barbearias/${user.id}/barbeiros`, editingId), {
          nome: formData.nome,
          telefone: normalizedPhone,
          comissaoServico: formData.comissaoServico,
          comissaoProduto: formData.comissaoProduto,
          email: formData.email,
          ...(formData.senha ? { senha: formData.senha } : {}),
        });
        toast({ title: "Barbeiro atualizado!" });
      } else {
        await addDoc(collection(db, `barbearias/${user.id}/barbeiros`), {
          nome: formData.nome,
          telefone: normalizedPhone,
          email: formData.email,
          comissaoServico: formData.comissaoServico,
          comissaoProduto: formData.comissaoProduto,
          senha: formData.senha || "",
          createdAt: new Date(),
        });
        toast({ title: "Barbeiro adicionado!", description: formData.senha ? `Senha: ${formData.senha}` : undefined });
      }
      setIsModalOpen(false);
      setFormData({ nome: "", telefone: "", comissaoServico: 40, comissaoProduto: 15, email: "", senha: "" });
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (barbeiro: Barbeiro) => {
    setFormData({
      nome: barbeiro.nome,
      telefone: barbeiro.telefone || "",
      comissaoServico: barbeiro.comissaoServico,
      comissaoProduto: barbeiro.comissaoProduto,
      email: barbeiro.email || "",
      senha: "",
    });
    setEditingId(barbeiro.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      await deleteDoc(doc(db, `barbearias/${user!.id}/barbeiros`, id));
      toast({ title: "Barbeiro excluído" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  const openNewModal = () => {
    setFormData({ nome: "", telefone: "", comissaoServico: 40, comissaoProduto: 15, email: "", senha: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Topbar 
        action={
          <Button onClick={openNewModal}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Barbeiro
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-primary">Acesso dos Barbeiros</h3>
            <p className="text-sm text-muted-foreground">Seus barbeiros precisam deste código para logar</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="bg-background px-3 py-1 rounded border font-mono font-bold text-lg">
              {user?.id}
            </code>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                navigator.clipboard.writeText(user?.id || "");
                toast({ title: "Código copiado!" });
              }}
            >
              Copiar
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Barbeiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Comissão Serviço (%)</TableHead>
                  <TableHead>Comissão Produto (%)</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : barbeiros.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum barbeiro cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  barbeiros.map((barbeiro) => (
                    <TableRow key={barbeiro.id}>
                      <TableCell className="font-medium">{barbeiro.nome}</TableCell>
                      <TableCell>{barbeiro.telefone || "-"}</TableCell>
                      <TableCell>{barbeiro.comissaoServico}%</TableCell>
                      <TableCell>{barbeiro.comissaoProduto}%</TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(barbeiro)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(barbeiro.id)}>
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
            <DialogTitle>{editingId ? "Editar Barbeiro" : "Novo Barbeiro"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input 
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome do barbeiro"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input 
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email (opcional)</Label>
                <Input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="barbeiro@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>{editingId ? "Nova Senha (deixe vazio para manter)" : "Senha de Acesso"}</Label>
                <Input 
                  type="password"
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  placeholder="Defina uma senha"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Comissão Serviço (%)</Label>
                <Input 
                  type="number"
                  value={formData.comissaoServico}
                  onChange={(e) => setFormData({ ...formData, comissaoServico: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Comissão Produto (%)</Label>
                <Input 
                  type="number"
                  value={formData.comissaoProduto}
                  onChange={(e) => setFormData({ ...formData, comissaoProduto: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
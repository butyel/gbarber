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
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Search, Phone, Mail, User, Cake, CreditCard, Download } from "lucide-react";
import type { Cliente, PlanoCliente } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClientesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    dataNascimento: "",
    planoId: "",
    observacoes: "",
  });
  const [planos, setPlanos] = useState<PlanoCliente[]>([]);

  useEffect(() => {
    if (!user || !db) return;
    fetchData();
    fetchPlanos();
  }, [user, db]);

  const fetchPlanos = async () => {
    const snap = await getDocs(collection(db, `barbearias/${user!.id}/planos_clientes`));
    setPlanos(snap.docs.map(d => ({ id: d.id, ...d.data() })) as PlanoCliente[]);
  };

  const fetchData = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, `barbearias/${user!.id}/clientes`), orderBy("nome")));
      setClientes(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Cliente[]);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !db || !formData.nome) {
      toast({ variant: "destructive", title: "Preencha o nome do cliente" });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, `barbearias/${user.id}/clientes`, editingId), {
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
          dataNascimento: formData.dataNascimento,
          planoId: formData.planoId,
          observacoes: formData.observacoes,
        });
        toast({ title: "Cliente atualizado!" });
      } else {
        await addDoc(collection(db, `barbearias/${user.id}/clientes`), {
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email,
          dataNascimento: formData.dataNascimento,
          planoId: formData.planoId,
          observacoes: formData.observacoes,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Cliente adicionado!" });
      }
      setIsModalOpen(false);
      setFormData({ nome: "", telefone: "", email: "", dataNascimento: "", planoId: "", observacoes: "" });
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone || "",
      email: cliente.email || "",
      dataNascimento: cliente.dataNascimento || "",
      planoId: cliente.planoId || "",
      observacoes: cliente.observacoes || "",
    });
    setEditingId(cliente.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      await deleteDoc(doc(db, `barbearias/${user!.id}/clientes`, id));
      toast({ title: "Cliente excluído" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  const handleExportCSV = () => {
    if (clientes.length === 0) {
      toast({ variant: "destructive", title: "Nenhum cliente para exportar" });
      return;
    }

    const headers = ["Nome", "Telefone", "Email", "Data de Nascimento", "Plano", "Observacoes"];
    const rows = clientes.map(c => [
      c.nome,
      c.telefone || "",
      c.email || "",
      c.dataNascimento || "",
      planos.find(p => p.id === c.planoId)?.nome || "Nenhum",
      c.observacoes || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `clientes_gbarber_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Planilha gerada com sucesso!" });
  };

  const filteredClientes = clientes.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Topbar 
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Baixar Planilha</span>
            </Button>
            <Button onClick={() => { setFormData({ nome: "", telefone: "", email: "", dataNascimento: "", planoId: "", observacoes: "" }); setEditingId(null); setIsModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <div className="flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, telefone ou email..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Clientes ({clientes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Aniversário</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredClientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum cliente cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClientes.map((cliente) => (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">{cliente.nome}</TableCell>
                      <TableCell>{cliente.telefone || "-"}</TableCell>
                      <TableCell>
                        {cliente.dataNascimento ? (
                          <div className="flex items-center gap-1 text-pink-600">
                            <Cake className="h-3 w-3" />
                            {new Date(cliente.dataNascimento + "T12:00:00").toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {cliente.planoId ? (
                          <div className="flex items-center gap-1 text-blue-600 font-medium">
                            <CreditCard className="h-3 w-3" />
                            {planos.find(p => p.id === cliente.planoId)?.nome || "Plano"}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{cliente.observacoes || "-"}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cliente)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cliente.id)}>
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
            <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input 
                value={formData.nome} 
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })} 
                placeholder="Nome completo"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  value={formData.telefone} 
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} 
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Nasc.</Label>
                <Input 
                  type="date"
                  value={formData.dataNascimento} 
                  onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Plano de Assinatura</Label>
              <Select 
                value={formData.planoId} 
                onValueChange={(val) => setFormData({ ...formData, planoId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum plano</SelectItem>
                  {planos.map(plano => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.nome} - R$ {plano.preco.toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                placeholder="email@exemplo.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input 
                value={formData.observacoes} 
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} 
                placeholder="Ex: Prefere corte às sextas"
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
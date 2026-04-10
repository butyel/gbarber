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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Loader2, Package, ArrowDown, ArrowUp } from "lucide-react";
import type { Produto } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function ProdutosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [stockProductId, setStockProductId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stockType, setStockType] = useState<"entrada" | "saida">("entrada");
  const [stockQuantidade, setStockQuantidade] = useState(1);
  const [stockMotivo, setStockMotivo] = useState("");
  
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    custo: 0,
    precoVenda: 0,
    quantidade: 0,
    estoqueMinimo: 5,
  });

  const categorias = ["Cosméticos", "Ferramentas", "Acessórios", "Higiene", "Outros"];

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, `barbearias/${user!.id}/produtos`), orderBy("nome")));
      setProdutos(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Produto[]);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !formData.nome || !formData.categoria) {
      toast({ variant: "destructive", title: "Preencha todos os campos" });
      return;
    }

    setSubmitting(true);
    try {
      const margin = formData.precoVenda > 0 ? ((formData.precoVenda - formData.custo) / formData.precoVenda * 100).toFixed(1) : 0;
      
      if (editingId) {
        await updateDoc(doc(db, `barbearias/${user.id}/produtos`, editingId), {
          nome: formData.nome,
          categoria: formData.categoria,
          custo: formData.custo,
          precoVenda: formData.precoVenda,
          quantidade: formData.quantidade,
          estoqueMinimo: formData.estoqueMinimo,
        });
        toast({ title: "Produto atualizado!" });
      } else {
        await addDoc(collection(db, `barbearias/${user.id}/produtos`), {
          ...formData,
          createdAt: serverTimestamp(),
        });
        toast({ title: "Produto adicionado!" });
      }
      setIsModalOpen(false);
      setFormData({ nome: "", categoria: "", custo: 0, precoVenda: 0, quantidade: 0, estoqueMinimo: 5 });
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleStockMovement = async () => {
    if (!user || !stockProductId || stockQuantidade <= 0) {
      toast({ variant: "destructive", title: "Quantidade inválida" });
      return;
    }

    setSubmitting(true);
    try {
      const produto = produtos.find(p => p.id === stockProductId);
      if (!produto) throw new Error("Produto não encontrado");

      let novaQuantidade = produto.quantidade;
      if (stockType === "entrada") {
        novaQuantidade += stockQuantidade;
      } else {
        if (stockQuantidade > produto.quantidade) {
          toast({ variant: "destructive", title: "Quantidade maior que o estoque disponível" });
          setSubmitting(false);
          return;
        }
        novaQuantidade -= stockQuantidade;
      }

      await updateDoc(doc(db, `barbearias/${user.id}/produtos`, stockProductId), {
        quantidade: novaQuantidade,
      });

      await addDoc(collection(db, `barbearias/${user!.id}/movimentosEstoque`), {
        produtoId: stockProductId,
        produtoNome: produto.nome,
        tipo: stockType,
        quantidade: stockQuantidade,
        motivo: stockMotivo,
        createdAt: serverTimestamp(),
      });

      toast({ title: stockType === "entrada" ? "Entrada registrada!" : "Saída registrada!" });
      setIsStockModalOpen(false);
      setStockQuantidade(1);
      setStockMotivo("");
      fetchData();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (produto: Produto) => {
    setFormData({
      nome: produto.nome,
      categoria: produto.categoria,
      custo: produto.custo,
      precoVenda: produto.precoVenda,
      quantidade: produto.quantidade,
      estoqueMinimo: produto.estoqueMinimo,
    });
    setEditingId(produto.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    try {
      await deleteDoc(doc(db, `barbearias/${user!.id}/produtos`, id));
      toast({ title: "Produto excluído" });
      fetchData();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  const openStockModal = (produtoId: string) => {
    setStockProductId(produtoId);
    setIsStockModalOpen(true);
  };

  const getLowStockProducts = () => produtos.filter(p => p.quantidade <= p.estoqueMinimo);

  return (
    <div className="min-h-screen">
      <Topbar 
        action={
          <Button onClick={() => { setFormData({ nome: "", categoria: "", custo: 0, precoVenda: 0, quantidade: 0, estoqueMinimo: 5 }); setEditingId(null); setIsModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {getLowStockProducts().length > 0 && (
          <Card className="border-yellow-500 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Estoque Baixo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {getLowStockProducts().map(p => (
                  <span key={p.id} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    {p.nome} ({p.quantidade})
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Custo</TableHead>
                  <TableHead>Venda</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                    </TableRow>
                  ))
                ) : produtos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum produto cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  produtos.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell>{produto.categoria}</TableCell>
                      <TableCell>{formatCurrency(produto.custo)}</TableCell>
                      <TableCell>{formatCurrency(produto.precoVenda)}</TableCell>
                      <TableCell>
                        <span className={produto.quantidade <= produto.estoqueMinimo ? "text-destructive font-medium" : ""}>
                          {produto.quantidade}
                        </span>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openStockModal(produto.id)} title="Movimentar">
                          <ArrowDown className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(produto)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(produto.id)}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} placeholder="Nome do produto" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Custo (R$)</Label>
                <Input type="number" value={formData.custo} onChange={(e) => setFormData({ ...formData, custo: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Venda (R$)</Label>
                <Input type="number" value={formData.precoVenda} onChange={(e) => setFormData({ ...formData, precoVenda: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input type="number" value={formData.quantidade} onChange={(e) => setFormData({ ...formData, quantidade: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Estoque Mínimo</Label>
                <Input type="number" value={formData.estoqueMinimo} onChange={(e) => setFormData({ ...formData, estoqueMinimo: parseInt(e.target.value) || 0 })} />
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

      <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentar Estoque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button variant={stockType === "entrada" ? "default" : "outline"} onClick={() => setStockType("entrada")}>
                <ArrowDown className="h-4 w-4 mr-2" />
                Entrada
              </Button>
              <Button variant={stockType === "saida" ? "destructive" : "outline"} onClick={() => setStockType("saida")}>
                <ArrowUp className="h-4 w-4 mr-2" />
                Saída
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input type="number" min="1" value={stockQuantidade} onChange={(e) => setStockQuantidade(parseInt(e.target.value) || 1)} />
            </div>
            <div className="space-y-2">
              <Label>Motivo</Label>
              <Input value={stockMotivo} onChange={(e) => setStockMotivo(e.target.value)} placeholder="Ex: Compra, Venda, Perda..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStockModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleStockMovement} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
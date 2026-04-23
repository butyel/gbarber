"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2, MessageCircle, Camera, X, User, CreditCard, Plus, Trash2, Link, Copy, Check, Lock } from "lucide-react";
import { collection, query, getDocs, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import type { PlanoCliente } from "@/types";

export default function ConfiguracoesPage() {
  const { user, barbearia, updateUserContext } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("perfil");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const [planos, setPlanos] = useState<PlanoCliente[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (barbearia) setNomeBarbearia(barbearia.nome);
    if (user) {
      setNomeUsuario(user.nome);
      setFotoPerfil(user.fotoPerfil || null);
    }
  }, [barbearia, user]);

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione uma imagem" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Erro", description: "A imagem deve ter no máximo 5MB" });
      return;
    }

    if (!supabase) {
      toast({ variant: "destructive", title: "Erro", description: "Supabase não está configurado" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('fotos-perfil')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('fotos-perfil')
        .getPublicUrl(fileName);

      await updateDoc(doc(db, "users", user.id), { fotoPerfil: data.publicUrl });
      setFotoPerfil(data.publicUrl);
      updateUserContext({ fotoPerfil: data.publicUrl });
      toast({ title: "Foto atualizada com sucesso!" });
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast({ variant: "destructive", title: "Erro", description: error.message || "Não foi possível fazer o upload da imagem" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFoto = async () => {
    if (!user || !fotoPerfil) return;

    if (!supabase) {
      toast({ variant: "destructive", title: "Erro", description: "Supabase não está configurado" });
      return;
    }

    setUploading(true);
    try {
      const fileName = fotoPerfil.split('/fotos-perfil/')[1];
      if (fileName) {
        await supabase.storage.from('fotos-perfil').remove([fileName]);
      }
      await updateDoc(doc(db, "users", user.id), { fotoPerfil: null });
      setFotoPerfil(null);
      updateUserContext({ fotoPerfil: undefined });
      toast({ title: "Foto removida" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (user) fetchPlanos();
  }, [user]);

  const fetchPlanos = async () => {
    if (!user) return;
    setLoadingPlanos(true);
    try {
      const snap = await getDocs(collection(db, `barbearias/${user.id}/planos_clientes`));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PlanoCliente[];
      setPlanos(list);

      // Se não houver planos, carregar os 3 iniciais sugeridos
      if (list.length === 0) {
        await initializeDefaultPlans();
      }
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
    } finally {
      setLoadingPlanos(false);
    }
  };

  const initializeDefaultPlans = async () => {
    if (!user) return;
    const defaults = [
      { nome: "Bronze", preco: 80, descricao: "Cortes ilimitados" },
      { nome: "Prata", preco: 120, descricao: "Cortes e Barba ilimitados" },
      { nome: "Ouro", preco: 180, descricao: "Completo + 1 Produto/mês" }
    ];

    for (const p of defaults) {
      await addDoc(collection(db, `barbearias/${user.id}/planos_clientes`), {
        ...p,
        createdAt: serverTimestamp()
      });
    }
    fetchPlanos();
  };

  const handleDeletePlano = async (id: string) => {
    if (!confirm("Excluir este plano?")) return;
    try {
      await deleteDoc(doc(db, `barbearias/${user!.id}/planos_clientes`, id));
      fetchPlanos();
      toast({ title: "Plano excluído" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao excluir" });
    }
  };

  const handleSave = async () => {
    if (!user || !db) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "barbearias", user.id), { nome: nomeBarbearia });
      await updateDoc(doc(db, "users", user.id), { nome: nomeUsuario });
      toast({ title: "Configurações salvas!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Topbar />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <div className="flex border-b border-[#C9A84C]/30 overflow-x-auto gap-6 mb-6">
          <button
            onClick={() => setActiveTab("perfil")}
            className={`pb-3 px-2 font-medium whitespace-nowrap transition-colors ${activeTab === "perfil" ? "border-b-2 border-[#C9A84C] text-[#C9A84C]" : "text-muted-foreground hover:text-foreground"}`}
          >
            Perfil da Conta
          </button>
          <button
            onClick={() => setActiveTab("servicos")}
            className={`pb-3 px-2 font-medium whitespace-nowrap transition-colors ${activeTab === "servicos" ? "border-b-2 border-[#C9A84C] text-[#C9A84C]" : "text-muted-foreground hover:text-foreground"}`}
          >
            Planos e Agendamento
          </button>
          <button
            onClick={() => setActiveTab("sistema")}
            className={`pb-3 px-2 font-medium whitespace-nowrap transition-colors ${activeTab === "sistema" ? "border-b-2 border-[#C9A84C] text-[#C9A84C]" : "text-muted-foreground hover:text-foreground"}`}
          >
            Acesso e Sistema
          </button>
        </div>

        {activeTab === "perfil" && (
        <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações da Conta
            </CardTitle>
            <CardDescription>Gerencie suas informações pessoais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-[#2D4A35] flex items-center justify-center border-2 border-[#C9A84C]/30">
                  {fotoPerfil ? (
                    <img src={fotoPerfil} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-[#C9A84C]/50" />
                  )}
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-[#C9A84C] animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="border-[#C9A84C]/50 text-[#C9A84C] hover:bg-[#C9A84C]/10"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {fotoPerfil ? "Alterar" : "Adicionar"}
                </Button>
                {fotoPerfil && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveFoto}
                    disabled={uploading}
                    className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome da Barbearia</Label>
              <Input 
                value={nomeBarbearia} 
                onChange={(e) => setNomeBarbearia(e.target.value)}
                placeholder="Minha Barbearia"
              />
            </div>
            <div className="space-y-2">
              <Label>Seu Nome</Label>
              <Input 
                value={nomeUsuario} 
                onChange={(e) => setNomeUsuario(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
            </div>
            <div className="space-y-2">
              <Label>Plano Atual</Label>
              <div className="px-3 py-2 bg-accent/10 text-accent rounded-md font-medium">
                {barbearia?.plano?.toUpperCase() || "FREE"}
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </CardContent>
        </Card>
        </div>
        )}

        {activeTab === "sistema" && (
        <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Acesso para Barbeiros
            </CardTitle>
            <CardDescription>Este é o código que seus colaboradores usarão para acessar o sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-sm text-muted-foreground mb-2">Código da Barbearia:</p>
              <div className="flex gap-2">
                <Input 
                  value={user?.id || ""} 
                  readOnly 
                  className="font-mono text-lg font-bold"
                />
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(user?.id || "");
                    toast({ title: "Código copiado!" });
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Seus barbeiros devem entrar na página de login de barbeiro e usar este código junto com o telefone e senha cadastrados.
            </p>
          </CardContent>
        </Card>
        </div>
        )}

        {activeTab === "servicos" && (
        <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Agendamento Online
            </CardTitle>
            <CardDescription>Compartilhe este link com seus clientes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Link para clientes agendarem:</p>
              <div className="flex gap-2">
                <Input 
                  value={`https://gbarber-sistema.vercel.app/agendar?barbearia=${user?.id}`} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://gbarber-sistema.vercel.app/agendar?barbearia=${user?.id}`);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                    toast({ title: "Link copiado!" });
                  }}
                >
                  {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Envie este link para seus clientes agendarem horários pelo site.
            </p>
          </CardContent>
        </Card>

        <Card className="border-accent/20 glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-accent">
              <CreditCard className="h-5 w-5" />
              Gestão de Planos de Assinatura
            </CardTitle>
            <CardDescription>
              Gerencie os planos recorrentes que seus clientes podem assinar para fidelização.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
              <p className="text-sm text-muted-foreground mb-4">
                Agora você tem uma página dedicada para gerenciar seus planos com mais detalhes, incluindo estatísticas de assinantes e faturamento estimado.
              </p>
              <Button 
                onClick={() => router.push("/dashboard/planos")}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Ir para Gestão de Planos
                <CreditCard className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sobre o Sistema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">GBarber v1.0</span> - Sistema de Gestão de Barbearia
              </p>
              <p className="text-sm text-muted-foreground">
                Desenvolvido para facilitar a gestão do seu negócio.
              </p>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Desenvolvedor</p>
              <p className="font-medium">Raphael Fernandes</p>
            </div>
            <Button 
              className="w-full" 
              onClick={() => window.open("https://wa.me/5518981939533", "_blank")}
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Suporte via WhatsApp
            </Button>
          </CardContent>
        </Card>
        </div>
        )}
      </div>
    </div>
  );
}

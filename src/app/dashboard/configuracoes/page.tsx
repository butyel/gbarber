"use client";

import { useState, useEffect, useRef } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, deleteObject, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2, MessageCircle, Camera, X, User } from "lucide-react";

export default function ConfiguracoesPage() {
  const { user, barbearia } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setUploading(true);
    try {
      if (fotoPerfil) {
        const oldRef = ref(storage, fotoPerfil);
        try {
          await deleteObject(oldRef);
        } catch {}
      }

      const fileName = `fotos-perfil/${user.id}/profile_${Date.now()}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", user.id), { fotoPerfil: downloadURL });
      setFotoPerfil(downloadURL);
      toast({ title: "Foto atualizada com sucesso!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFoto = async () => {
    if (!user || !fotoPerfil) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, fotoPerfil);
      await deleteObject(storageRef);
      await updateDoc(doc(db, "users", user.id), { fotoPerfil: null });
      setFotoPerfil(null);
      toast({ title: "Foto removida" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setUploading(false);
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

      <div className="p-6 space-y-6 max-w-2xl">
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
    </div>
  );
}

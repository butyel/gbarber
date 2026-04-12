"use client";

import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2, MessageCircle, Palette, Upload, Camera } from "lucide-react";

const PALETAS = [
  { id: "dourado", nome: "Dourado Clássico", primary: "#1a1a1a", accent: "#D4AF37", background: "#FAF8F5" },
  { id: "vip", nome: "VIP Gold", primary: "#1F1F1F", accent: "#FFD700", background: "#FFFEF5" },
  { id: "preto", nome: "Preto Elegante", primary: "#0A0A0A", accent: "#C0C0C0", background: "#F5F5F5" },
  { id: "azul", nome: "Azul Night", primary: "#0F172A", accent: "#06B6D4", background: "#F0F9FF" },
  { id: "vinho", nome: "Vinho Noblesse", primary: "#3D0000", accent: "#B91C1C", background: "#FEF2F2" },
  { id: "esmeralda", nome: "Esmeralda", primary: "#064E3B", accent: "#10B981", background: "#ECFDF5" },
  { id: "royal", nome: "Royal Purple", primary: "#2E1065", accent: "#8B5CF6", background: "#FAF5FF" },
  { id: "rose", nome: "Rose Gold", primary: "#2D2D2D", accent: "#F472B6", background: "#FDF2F8" },
  { id: "grafite", nome: "Grafite Moderno", primary: "#1F2937", accent: "#6366F1", background: "#F3F4F6" },
];

export default function ConfiguracoesPage() {
  const { user, barbearia } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [paleta, setPaleta] = useState(barbearia?.paleta || "dourado");
  const [logoUrl, setLogoUrl] = useState(barbearia?.logo || "");
  const [fotoPerfilUrl, setFotoPerfilUrl] = useState(user?.fotoPerfil || "");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const fotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (barbearia) {
      setNomeBarbearia(barbearia.nome);
      setPaleta(barbearia.paleta || "dourado");
      setLogoUrl(barbearia.logo || "");
    }
    if (user) {
      setNomeUsuario(user.nome);
      setFotoPerfilUrl(user.fotoPerfil || "");
    }
  }, [barbearia, user]);

  const uploadImage = async (file: File, path: string) => {
    if (!storage) return "";
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !db) return;
    setLoading(true);
    try {
      const url = await uploadImage(file, `barbearias/${user.id}/logo`);
      setLogoUrl(url);
      await updateDoc(doc(db, "barbearias", user.id), { logo: url });
      toast({ title: "Logo atualizada!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleFotoPerfilUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !db) return;
    setLoading(true);
    try {
      const url = await uploadImage(file, `users/${user.id}/fotoPerfil`);
      setFotoPerfilUrl(url);
      await updateDoc(doc(db, "users", user.id), { fotoPerfil: url });
      toast({ title: "Foto de perfil atualizada!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handlePaletaChange = async (novaPaleta: string) => {
    if (!user || !db) return;
    setPaleta(novaPaleta);
    const paletaSel = PALETAS.find(p => p.id === novaPaleta);
    if (!paletaSel) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "barbearias", user.id), {
        paleta: novaPaleta,
        cores: {
          primary: paletaSel.primary,
          accent: paletaSel.accent,
          background: paletaSel.background
        }
      });
      toast({ title: "Paleta alterada!" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } finally {
      setSaving(false);
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
              Configurações da Barbearia
            </CardTitle>
            <CardDescription>Gerencie as informações da sua barbearia</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Paleta de Cores
            </CardTitle>
            <CardDescription>Escolha a paleta de cores do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {PALETAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePaletaChange(p.id)}
                  disabled={saving}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    paleta === p.id ? "border-accent ring-2 ring-accent/30" : "border-border hover:border-accent/50"
                  }`}
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex gap-1 justify-center">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.accent }} />
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.background }} />
                    </div>
                    <span className="text-xs font-medium mt-1">{p.nome}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo da Barbearia
            </CardTitle>
            <CardDescription>Adicione o logo que aparece na sidebar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => logoInputRef.current?.click()} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar Logo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">PNG ou JPG, max 2MB</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto de Perfil
            </CardTitle>
            <CardDescription>Sua foto de perfil nos atendimentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                {fotoPerfilUrl ? (
                  <img src={fotoPerfilUrl} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <input
                  ref={fotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFotoPerfilUpload}
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fotoInputRef.current?.click()} disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Camera className="mr-2 h-4 w-4" />
                  Enviar Foto
                </Button>
                <p className="text-xs text-muted-foreground mt-2">PNG ou JPG, max 2MB</p>
              </div>
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
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2, MessageCircle } from "lucide-react";

export default function ConfiguracoesPage() {
  const { user, barbearia } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [nomeBarbearia, setNomeBarbearia] = useState("");
  const [nomeUsuario, setNomeUsuario] = useState("");

  useEffect(() => {
    if (barbearia) setNomeBarbearia(barbearia.nome);
    if (user) setNomeUsuario(user.nome);
  }, [barbearia, user]);

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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Scissors, Loader2, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { normalizePhoneNumber } from "@/lib/utils";

export default function BarbearLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [codigoBarbearia, setCodigoBarbearia] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefone || !senha || !codigoBarbearia) {
      toast({ variant: "destructive", title: "Preencha todos os campos" });
      return;
    }

    setLoading(true);
    try {
      const isEmail = telefone.includes("@");
      const normalizedIdentifier = isEmail ? telefone.toLowerCase() : normalizePhoneNumber(telefone);
      
      const snap = await getDocs(query(
        collection(db, `barbearias/${codigoBarbearia}/barbeiros`),
        where(isEmail ? "email" : "telefone", "==", normalizedIdentifier)
      ));

      if (snap.empty) {
        toast({ variant: "destructive", title: "Barbeiro não encontrado", description: "Verifique o telefone/email e o código da barbearia" });
        return;
      }

      const barberDoc = snap.docs[0];
      const barberData = barberDoc.data();

      if (barberData.senha !== senha) {
        toast({ variant: "destructive", title: "Senha incorreta" });
        return;
      }

      router.push(`/dashboard/barbeiro?barbearia=${codigoBarbearia}&barbeiro=${barberDoc.id}`);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro no login", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scissors className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Login Barbeiro</CardTitle>
          <CardDescription>Entre com sua conta de barbeiro</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Código da Barbearia</Label>
              <Input 
                value={codigoBarbearia}
                onChange={(e) => setCodigoBarbearia(e.target.value)}
                placeholder="Código fornecido pelo dono"
              />
            </div>
            <div className="space-y-2">
              <Label>Telefone ou Email</Label>
              <Input 
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000 ou email@exemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input 
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Lock className="h-4 w-4 mr-2" />
              Entrar
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            <Link href="/login" className="text-muted-foreground hover:underline">
              É dono? Login aqui
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
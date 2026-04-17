"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Scissors, Loader2, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      await login(data.email, data.password);
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Background Textures */}
      <div className="fixed inset-0 bg-premium-gradient -z-20" />
      <div className="fixed inset-0 bg-vertical-lines -z-10" />
      <div className="fixed inset-0 bg-grid-pattern opacity-10 -z-10" />
      
      {/* Glow Orbs */}
      <div className="glow-orb w-[400px] h-[400px] bg-primary/20 top-[10%] left-[-100px]" />
      <div className="glow-orb w-[400px] h-[400px] bg-purple-600/10 bottom-[10%] right-[-100px]" />

      <div className="w-full max-w-md relative z-10 transition-all">
        <div className="text-center mb-10 group">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-6 glow-blue animate-float group-hover:scale-110 transition-transform">
            <Scissors className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-white text-glow mb-2">GBarber<span className="text-primary italic">.ai</span></h1>
          <p className="text-muted-foreground font-medium italic">Elite Barbershop Management</p>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 border-white/10 shadow-2xl relative overflow-hidden">
          {/* Inner Glow Decorative */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-1 text-white">Bem-vindo</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              Entre para gerenciar sua arte <Sparkles className="h-3.5 w-3.5 text-primary" />
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold ml-1">Email Profissional</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@barbershop.com"
                  className="bg-white/5 border-white/10 rounded-2xl h-12 focus:border-primary/50 transition-all placeholder:text-white/20"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive font-medium ml-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <Label htmlFor="password" className="text-sm font-semibold">Senha</Label>
                <a href="#" className="text-[11px] text-primary/80 hover:text-primary transition-colors font-bold uppercase tracking-wider">Esqueceu?</a>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-white/5 border-white/10 rounded-2xl h-12 focus:border-primary/50 transition-all placeholder:text-white/20"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive font-medium ml-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold bg-primary hover:bg-primary/90 glow-blue transition-all" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Conectando...
                </>
              ) : (
                "Entrar no Sistema"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center space-y-4">
            <div className="text-xs">
              <span className="text-muted-foreground">Nova Barbearia? </span>
              <a href="/login/cadastro" className="text-primary hover:text-primary/80 transition-colors font-bold group">
                Criar Conta Pro
                <ChevronRight className="inline-block h-3 w-3 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
            
            <a href="/login/barbeiro" className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
              <Scissors className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold text-white/90">Acesso Colaborador</span>
            </a>
          </div>
        </div>
        
        <p className="text-center mt-10 text-[10px] text-white/20 uppercase tracking-[0.2em] font-bold">
          Powered by GBarber Intelligence
        </p>
      </div>
    </div>
  );
}
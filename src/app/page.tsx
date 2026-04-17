"use client";

import Link from "next/link";
import { Scissors, Calendar, Users, BarChart3, Clock, Sparkles, ChevronRight, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Textures */}
      <div className="fixed inset-0 bg-premium-gradient -z-20" />
      <div className="fixed inset-0 bg-vertical-lines -z-10" />
      <div className="fixed inset-0 bg-grid-pattern opacity-20 -z-10" />

      {/* Glow Orbs */}
      <div className="glow-orb w-[500px] h-[500px] bg-blue-600/20 top-[-100px] left-[-100px]" />
      <div className="glow-orb w-[600px] h-[600px] bg-purple-600/10 bottom-[-200px] right-[-100px]" />

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between glass-panel border-b-0 mt-4 rounded-2xl max-w-7xl mx-auto backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center glow-blue">
            <Scissors className="text-white h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-glow">GBarber<span className="text-primary">.ai</span></span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#" className="hover:text-primary transition-colors">Home</Link>
          <Link href="#" className="hover:text-primary transition-colors">Recursos</Link>
          <Link href="#" className="hover:text-primary transition-colors">Fidelidade</Link>
          <Link href="#" className="hover:text-primary transition-colors">Como Funciona</Link>
          <Link href="#" className="hover:text-primary transition-colors">FAQ</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">Entrar</Link>
          <Button className="rounded-full bg-primary hover:bg-primary/90 px-6 font-semibold glow-blue">
            Começar Agora
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 pt-20 pb-32">
        {/* Hero Section */}
        <section className="relative text-center max-w-4xl mx-auto mb-32">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-white/10 text-xs font-semibold text-primary mb-8 animate-float">
            <Sparkles className="h-3 w-3" />
            <span>Gestão Inteligente para Profissionais Premium</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-glow bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Economize Tempo e <br /> 
            <span className="text-primary italic">Aumente Lucros</span> em Cada Corte
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Descubra a gestão automatizada, receba recomendações baseadas em dados e gerencie sua agenda sem esforço com nossa plataforma de IA.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 h-14 text-lg font-bold bg-primary hover:bg-primary/90 glow-blue group">
              Agende sua Demo
              <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg font-bold glass-card border-white/20 hover:bg-white/5">
              <Play className="mr-2 h-5 w-5 fill-current" />
              Ver Vídeo
            </Button>
          </div>

          {/* Decorative Floating Tags from Reference */}
          <div className="absolute -left-10 top-0 glass-card px-4 py-2 rounded-full text-[10px] font-bold tracking-widest text-white/40 border-white/5 -rotate-12 animate-float" style={{ animationDelay: '0.5s' }}>
            WEBSITE
          </div>
          <div className="absolute left-0 bottom-20 glass-card px-4 py-2 rounded-full text-[10px] font-bold tracking-widest text-white/40 border-white/5 rotate-12 animate-float" style={{ animationDelay: '1.5s' }}>
            UI/UX
          </div>
          <div className="absolute right-10 top-20 glass-card px-4 py-2 rounded-full text-[10px] font-bold tracking-widest text-white/40 border-white/5 rotate-6 animate-float" style={{ animationDelay: '2s' }}>
            BOOKING
          </div>

          {/* Avatar Bubble decoration if possible or just use a placeholder icon */}
          <div className="absolute right-0 top-1/2 glass-card p-2 rounded-2xl flex items-center gap-2 animate-float hidden lg:flex" style={{ animationDelay: '2.5s' }}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 overflow-hidden border border-white/20">
               <Users className="w-full h-full p-2 text-white" />
            </div>
            <div className="text-left">
              <div className="text-[10px] font-bold text-white">@premium_barber</div>
              <div className="text-[8px] text-muted-foreground">Certified Partner</div>
            </div>
          </div>


          {/* Floating UI Elements from Reference */}
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 hidden lg:block animate-float" style={{ animationDelay: '1s' }}>
            <div className="glass-card p-6 rounded-3xl w-64 text-left border-blue-500/20">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Pontos de Fidelidade</span>
                <Sparkles className="text-primary h-4 w-4" />
              </div>
              <div className="text-3xl font-bold mb-1">13,200</div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">PRONTO</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Próximo Prémio: $20 OFF</span>
                </div>
                <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center">
                  <ChevronRight className="h-3 w-3" />
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -right-20 top-2/3 -translate-y-1/2 hidden lg:block animate-float">
            <div className="glass-card p-6 rounded-3xl w-64 text-left border-cyan-500/20 glow-cyan">
              <div className="bg-cyan-500/20 w-fit px-3 py-1 rounded-full text-[10px] font-bold text-cyan-400 mb-4 border border-cyan-400/30">
                PROMOÇÃO ATIVA
              </div>
              <div className="text-xs text-muted-foreground mb-1 uppercase">Última Atualização</div>
              <div className="text-xl font-bold mb-4">Corte + Barba <br /> <span className="text-cyan-400">Só R$ 85</span></div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="w-[85%] h-full bg-cyan-400" />
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground text-right italic">Vagas Limitadas (Meta batida)</div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-40">
          <div className="text-center mb-16">
            <div className="bg-primary/10 text-primary w-fit px-4 py-1 rounded-full text-xs font-bold mx-auto mb-4 border border-primary/20 uppercase tracking-widest">
              Funcionalidades Avançadas
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-glow italic">
              A Evolução do Atendimento <br /> Com Inteligência GBarber
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto italic">
              Gestão simplificada, previsões inteligentes e fidelização personalizada em uma única interface elegante.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Calendar, title: "Agendamento IA", desc: "Nossa IA otimiza sua grade para evitar buracos na agenda." },
              { icon: Users, title: "CRM VIP", desc: "Histórico completo e preferências automáticas de cada cliente." },
              { icon: BarChart3, title: "Insights Reais", desc: "Veja o crescimento do seu lucro em dashboards futuristas." },
              { icon: Clock, title: "Notificações", desc: "Alertas inteligentes via WhatsApp para reduzir faltas." }
            ].map((feature, i) => (
              <div key={i} className="glass-card group hover:border-primary/50 transition-all p-8 rounded-3xl text-left relative overflow-hidden">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:glow-blue transition-all">
                  <feature.icon className="h-6 w-6 text-white group-hover:text-primary transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
                <Link href="#" className="mt-6 flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  SAIBA MAIS <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
                {/* Decoration */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
              </div>
            ))}
          </div>
        </section>

        {/* Stats / Proof Section */}
        <section className="mt-40 glass-panel p-12 rounded-[3rem] border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Scissors className="w-64 h-64 -rotate-12" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6 text-glow leading-tight">
                Mais de <span className="text-primary italic">500 Barbearias</span> Estão Elevando o Nível
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Não é apenas um sistema, é um copiloto para o seu negócio. Reduza cancelamentos em 40% nas primeiras duas semanas.
              </p>
              <div className="flex items-center gap-8">
                <div>
                  <div className="text-4xl font-black text-white italic">+2k</div>
                  <div className="text-sm text-muted-foreground font-medium">Cortes Realizados</div>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div>
                  <div className="text-4xl font-black text-white italic">98%</div>
                  <div className="text-sm text-muted-foreground font-medium">Satisfação</div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="glass-card rounded-3xl p-2 relative z-10">
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 flex items-center justify-center">
                   <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/50 to-transparent z-0" />
                   <div className="text-center z-10">
                     <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center mx-auto mb-4 glow-blue cursor-pointer hover:scale-110 transition-transform">
                       <Play className="h-8 w-8 text-white fill-current translate-x-1" />
                     </div>
                     <span className="text-sm font-bold tracking-widest uppercase">Assista a Intro</span>
                   </div>
                </div>
              </div>
              {/* Decorative Glow */}
              <div className="absolute -inset-4 bg-primary/20 blur-3xl -z-10 rounded-full" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-12">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Scissors className="text-primary h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">GBarber.ai</span>
          </div>
          
          <div className="text-sm text-muted-foreground italic">
            © 2026 GBarber Intelligent Systems. All rights reserved.
          </div>
          
          <div className="flex gap-6">
            <Link href="#" className="text-muted-foreground hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="text-muted-foreground hover:text-white transition-colors">Instagram</Link>
            <Link href="#" className="text-muted-foreground hover:text-white transition-colors">LinkedIn</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
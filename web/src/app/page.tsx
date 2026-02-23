import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Sparkles, ArrowRight, HelpCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-puculuxa-orange/5 blur-[120px] rounded-full animate-pulse-soft" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-puculuxa-lime/5 blur-[120px] rounded-full animate-pulse-soft" />

      <div className="w-full max-w-4xl z-10 flex flex-col items-center text-center space-y-12">
        {/* Logo Section */}
        <div className="relative group animate-fade-in-up">
          <div className="absolute inset-0 bg-puculuxa-orange/20 blur-2xl rounded-full scale-0 group-hover:scale-110 transition-transform duration-500" />
          <Image
            src="/logo-puculuxa.png"
            alt="Puculuxa Logo"
            width={320}
            height={320}
            className="relative transform transition-transform duration-500 group-hover:scale-105"
            priority
          />
        </div>

        {/* Content Section */}
        <div className="space-y-6 animate-fade-in-up [animation-delay:0.2s]">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-puculuxa-orange/10 text-puculuxa-orange rounded-full text-sm font-bold tracking-wide">
            <Sparkles size={16} />
            PAINEL DE GESTÃO ELITE
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-800">
            Puculuxa <span className="text-puculuxa-orange">Admin</span>
          </h1>

          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            O coração tecnológico da sua confeitaria. Gerencie pedidos, produtos e clientes com a sofisticação que sua marca merece.
          </p>
        </div>

        {/* Action Section */}
        <div className="w-full max-w-md space-y-6 animate-fade-in-up [animation-delay:0.4s]">
          <Link href="/login" className="block">
            <Button className="w-full text-lg h-16 group">
              ACESSAR PAINEL
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
            <Link href="/support" className="flex items-center gap-1 hover:text-puculuxa-orange transition-colors">
              <HelpCircle size={16} />
              Precisa de ajuda?
            </Link>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span>Suporte Técnico</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-12 animate-fade-in-up [animation-delay:0.6s]">
          <p className="text-xs font-medium tracking-widest text-slate-400 uppercase">
            Powered by TechVision Labs © 2026
          </p>
        </div>
      </div>
    </main>
  );
}

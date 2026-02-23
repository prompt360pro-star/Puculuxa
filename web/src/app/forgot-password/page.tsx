'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function ForgotPasswordPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-puculuxa-cream">
            <div className="w-full max-w-md animate-fade-in-up">
                <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-puculuxa-orange transition-colors mb-8 group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Voltar ao login
                </Link>

                <Card className="border-t-4 border-t-puculuxa-orange">
                    <div className="flex flex-col items-center text-center space-y-4 mb-8">
                        <div className="w-16 h-16 bg-puculuxa-orange/10 rounded-full flex items-center justify-center">
                            <Mail size={32} className="text-puculuxa-orange" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Recuperar Senha</h2>
                            <p className="text-slate-500">Introduza o seu e-mail para receber as instruções de recuperação</p>
                        </div>
                    </div>

                    <form className="space-y-6">
                        <Input
                            label="E-mail de Cadastro"
                            placeholder="exemplo@puculuxa.com"
                            icon={<Mail size={20} />}
                        />

                        <Button className="w-full h-14">
                            ENVIAR INSTRUÇÕES
                        </Button>
                    </form>
                </Card>
            </div>
        </main>
    );
}

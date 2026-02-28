'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, CheckCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { API_BASE_URL } from '@/config';

type Step = 'request' | 'success';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<Step>('request');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setError('Por favor, insira um e-mail válido.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new Error('Erro no servidor');
            setStep('success');
        } catch {
            setError('Algo correu mal. Por favor, tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-puculuxa-cream">
            <div className="w-full max-w-md animate-fade-in-up">
                <Link href="/login" className="inline-flex items-center gap-2 text-slate-500 hover:text-puculuxa-orange transition-colors mb-8 group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Voltar ao login
                </Link>

                <Card className="border-t-4 border-t-puculuxa-orange">
                    {step === 'request' ? (
                        <>
                            <div className="flex flex-col items-center text-center space-y-4 mb-8">
                                <div className="w-16 h-16 bg-puculuxa-orange/10 rounded-full flex items-center justify-center">
                                    <Mail size={32} className="text-puculuxa-orange" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Recuperar Senha</h2>
                                    <p className="text-slate-500">Introduza o seu e-mail para receber as instruções de recuperação</p>
                                </div>
                            </div>

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <Input
                                    label="E-mail de Cadastro"
                                    placeholder="exemplo@puculuxa.com"
                                    icon={<Mail size={20} />}
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                {error && (
                                    <p className="text-red-500 text-sm text-center">{error}</p>
                                )}
                                <Button className="w-full h-14" disabled={isLoading}>
                                    {isLoading ? 'A enviar...' : 'ENVIAR INSTRUÇÕES'}
                                </Button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center text-center space-y-6 py-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle size={40} className="text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifique o seu e-mail</h2>
                                <p className="text-slate-500 text-sm">
                                    Se <strong>{email}</strong> estiver registado, receberá um link de recuperação em breve.
                                </p>
                            </div>
                            <button
                                onClick={() => setStep('request')}
                                className="flex items-center gap-2 text-slate-500 hover:text-puculuxa-orange transition-colors text-sm"
                            >
                                <RotateCcw size={14} /> Tentar com outro e-mail
                            </button>
                            <Link href="/login">
                                <Button className="w-full h-12">Voltar ao Login</Button>
                            </Link>
                        </div>
                    )}
                </Card>
            </div>
        </main>
    );
}

'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { API_BASE_URL } from '@/config';

type Step = 'form' | 'success' | 'invalid';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [step, setStep] = useState<Step>('form');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) setStep('invalid');
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('A password deve ter pelo menos 6 caracteres.');
            return;
        }
        if (password !== confirm) {
            setError('As passwords não coincidem.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Token inválido ou expirado');
            }
            setStep('success');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao redefinir a password.');
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
                    {step === 'invalid' && (
                        <div className="flex flex-col items-center text-center space-y-4 py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <Lock size={32} className="text-red-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Link Inválido</h2>
                            <p className="text-slate-500 text-sm">Este link de recuperação é inválido ou já expirou.</p>
                            <Link href="/forgot-password">
                                <Button className="w-full mt-4">Solicitar novo link</Button>
                            </Link>
                        </div>
                    )}

                    {step === 'form' && (
                        <>
                            <div className="flex flex-col items-center text-center space-y-4 mb-8">
                                <div className="w-16 h-16 bg-puculuxa-orange/10 rounded-full flex items-center justify-center">
                                    <Lock size={32} className="text-puculuxa-orange" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Nova Password</h2>
                                    <p className="text-slate-500 text-sm">Defina a sua nova password de acesso</p>
                                </div>
                            </div>

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Nova Password</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-puculuxa-orange/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Confirmar Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        placeholder="Repita a password"
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-puculuxa-orange/50"
                                    />
                                </div>

                                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                                <Button className="w-full h-14" disabled={isLoading}>
                                    {isLoading ? 'A guardar...' : 'REDEFINIR PASSWORD'}
                                </Button>
                            </form>
                        </>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center text-center space-y-6 py-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle size={40} className="text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 mb-2">Password Redefinida!</h2>
                                <p className="text-slate-500 text-sm">A sua password foi actualizada com sucesso. Já pode fazer login.</p>
                            </div>
                            <Link href="/login" className="w-full">
                                <Button className="w-full h-12">Ir para o Login</Button>
                            </Link>
                        </div>
                    )}
                </Card>
            </div>
        </main>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}

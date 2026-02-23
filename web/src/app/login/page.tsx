'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AuthWebService } from '@/services/authService';
import { Toaster, toast } from 'sonner';

const loginSchema = z.object({
    email: z.string().email('Introduza um e-mail válido'),
    password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        try {
            await AuthWebService.login(data.email, data.password);
            toast.success('Bem-vindo ao Painel Puculuxa!');
            setTimeout(() => router.push('/dashboard'), 1000);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Credenciais inválidas. Tente novamente.';
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fafafa] dark:bg-[#020617] relative overflow-hidden">
            <Toaster position="top-center" richColors />

            {/* Subtle background glow */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-puculuxa-orange/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-puculuxa-lime/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-[440px] z-10 animate-fade-in-up">
                {/* Brand Header */}
                <div className="flex flex-col items-center mb-12">
                    <div className="relative w-48 h-24 mb-6 transition-transform duration-700 hover:scale-105">
                        <Image
                            src="/logo-puculuxa.png"
                            alt="Puculuxa Logo"
                            fill
                            priority
                            className="object-contain drop-shadow-sm"
                        />
                    </div>
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                            Puculuxa <span className="bg-gradient-to-r from-puculuxa-orange to-puculuxa-gold bg-clip-text text-transparent">Admin</span>
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase text-xs">
                            Painel de Gestão Empresarial Elite
                        </p>
                    </div>
                </div>

                <div className="glass-card p-10 relative group">
                    {/* Interior gradient border line */}
                    <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-puculuxa-orange/30 to-transparent shadow-sm" />

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-6">
                            <Input
                                label="E-mail Corporativo"
                                placeholder="nome.sobrenome@puculuxa.ao"
                                icon={<Mail size={20} className="text-puculuxa-orange/60" />}
                                error={errors.email?.message}
                                {...register('email')}
                                disabled={isLoading}
                                className="!h-14 !rounded-xl border-slate-200 focus:border-puculuxa-orange"
                            />

                            <div className="relative">
                                <Input
                                    label="Chave de Acesso"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    icon={<Lock size={20} className="text-puculuxa-orange/60" />}
                                    error={errors.password?.message}
                                    {...register('password')}
                                    disabled={isLoading}
                                    className="!h-14 !rounded-xl border-slate-200 focus:border-puculuxa-orange"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-[44px] text-slate-400 hover:text-puculuxa-orange transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-3 cursor-pointer group/check">
                                <div className="relative flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        className="peer appearance-none w-5 h-5 rounded-md border-2 border-slate-200 text-puculuxa-orange checked:bg-puculuxa-orange checked:border-puculuxa-orange transition-all cursor-pointer"
                                    />
                                    <div className="absolute scale-0 peer-checked:scale-100 transition-transform text-white pointer-events-none">
                                        <ChevronRight size={14} className="rotate-90" />
                                    </div>
                                </div>
                                <span className="text-slate-500 dark:text-slate-400 font-medium group-hover/check:text-slate-800 dark:group-hover/check:text-slate-200 transition-colors">Manter sessão ativa</span>
                            </label>

                            <Link href="/forgot-password" className="text-puculuxa-orange font-bold hover:text-puculuxa-gold transition-colors tracking-tight">
                                Recuperar acesso
                            </Link>
                        </div>

                        <Button
                            type="submit"
                            className="btn-premium w-full h-14 !rounded-xl text-sm tracking-[0.2em] font-black group shadow-xl"
                            isLoading={isLoading}
                        >
                            <span className="relative z-10 flex items-center justify-center">
                                {isLoading ? 'AUTENTICANDO...' : 'ACESSAR INFRAESTRUTURA'}
                                {!isLoading && <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                            </span>
                        </Button>
                    </form>
                </div>

                {/* Secure Footer */}
                <div className="mt-12 flex flex-col items-center space-y-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Sistemas Operacionais
                        </div>
                        <div className="w-[1px] h-3 bg-slate-200" />
                        <Link href="/" className="text-xs text-slate-500 hover:text-puculuxa-orange transition-colors font-semibold">
                            Portal Institucional
                        </Link>
                    </div>
                    <p className="text-center text-slate-400 text-[10px] tracking-widest uppercase font-medium">
                        © 2026 Puculuxa Cakes & Catering • Enterprise Cloud Infrastructure
                    </p>
                </div>
            </div>
        </main>
    );
}

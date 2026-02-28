'use client';

import React, { useState } from 'react';
import { User, Lock, Bell, Store, Shield, Smartphone, Save, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { API_BASE_URL } from '@/config';

type Tab = 'profile' | 'brand' | 'security' | 'mfa' | 'notifications' | 'devices';

const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('puculuxa_token') : null;

const NAV_ITEMS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Perfil do Admin', icon: User },
    { id: 'brand', label: 'Detalhes da Marca', icon: Store },
    { id: 'security', label: 'Segurança & Password', icon: Lock },
    { id: 'mfa', label: 'Autenticação 2FA', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'devices', label: 'Dispositivos Conectados', icon: Smartphone },
];

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('profile');

    // Profile form state
    const [name, setName] = useState('Admin Elite');
    const [phone, setPhone] = useState('+244 923 000 000');
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ name, phone }),
            });
            if (!res.ok) throw new Error('Erro ao guardar');
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 transition-colors duration-300 max-w-5xl mx-auto">
            <header className="mb-12">
                <h1 className="text-3xl font-bold text-text-primary">Configurações do Sistema</h1>
                <p className="text-text-secondary">Ajuste preferências de conta, notificações e detalhes da empresa.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-12">
                {/* Lateral Menu */}
                <nav className="flex flex-col gap-2">
                    {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium text-left ${activeTab === id
                                    ? 'bg-gradient-to-r from-puculuxa-orange/10 to-transparent border-l-4 border-puculuxa-orange text-puculuxa-orange font-bold rounded-r-xl'
                                    : 'text-text-secondary hover:text-text-primary hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                }`}
                        >
                            <Icon size={18} />
                            {label}
                        </button>
                    ))}
                </nav>

                {/* Content Area */}
                <div className="space-y-8 animate-fade-in-up">
                    {activeTab === 'profile' && (
                        <Card className="p-8 bg-bg-card border border-border-main shadow-sm">
                            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                                <User size={24} className="text-puculuxa-orange" />
                                Informações Pessoais
                            </h2>

                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-puculuxa-orange to-puculuxa-gold flex items-center justify-center text-white text-3xl font-black shadow-puculuxa">
                                    {name.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-primary">{name}</h3>
                                    <p className="text-text-secondary text-sm mb-3">admin@puculuxa.com</p>
                                    <div className="flex gap-2">
                                        <Button variant="outline" className="h-8 text-[10px] px-3">Alterar Avatar</Button>
                                        <Button variant="outline" className="h-8 text-[10px] px-3 border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-900/20 hover:text-red-500">Remover</Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Nome Completo</label>
                                    <input
                                        title="Nome Completo"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-puculuxa-orange/50 text-text-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Email Profissional</label>
                                    <input title="Email Profissional" type="email" defaultValue="admin@puculuxa.com" disabled className="w-full bg-slate-100 dark:bg-slate-800 border border-border-main rounded-xl px-4 py-3 text-sm text-text-secondary opacity-70 cursor-not-allowed" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Telemóvel</label>
                                    <input
                                        title="Telemóvel"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-puculuxa-orange/50 text-text-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Cargo</label>
                                    <input title="Cargo" type="text" defaultValue="Administrador Geral" disabled className="w-full bg-slate-100 dark:bg-slate-800 border border-border-main rounded-xl px-4 py-3 text-sm text-text-secondary opacity-70 cursor-not-allowed" />
                                </div>
                            </div>

                            <div className="mt-8 flex items-center justify-end gap-4">
                                {saveSuccess && (
                                    <span className="flex items-center gap-2 text-green-600 text-sm font-bold animate-fade-in-up">
                                        <CheckCircle size={16} /> Guardado com sucesso!
                                    </span>
                                )}
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="bg-gradient-to-r from-puculuxa-orange to-puculuxa-gold text-white font-bold h-10 px-8 rounded-xl shadow-puculuxa hover:shadow-glow transition-all flex items-center gap-2"
                                >
                                    <Save size={16} />
                                    {isSaving ? 'A guardar...' : 'Guardar Alterações'}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card className="p-8 bg-bg-card border border-border-main shadow-sm">
                            <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
                                <Lock size={24} className="text-puculuxa-orange" />
                                Alterar Password
                            </h2>
                            <div className="space-y-4 max-w-md">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Password Atual</label>
                                    <input title="Password Atual" type="password" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-puculuxa-orange/50 text-text-primary" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Nova Password</label>
                                    <input title="Nova Password" type="password" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-puculuxa-orange/50 text-text-primary" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary uppercase tracking-widest mb-2">Confirmar Nova Password</label>
                                    <input title="Confirmar Nova Password" type="password" className="w-full bg-slate-50 dark:bg-slate-800/50 border border-border-main rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-puculuxa-orange/50 text-text-primary" placeholder="••••••••" />
                                </div>
                                <Button className="mt-4">Actualizar Password</Button>
                            </div>
                        </Card>
                    )}

                    {(activeTab === 'brand' || activeTab === 'mfa' || activeTab === 'notifications' || activeTab === 'devices') && (
                        <Card className="p-8 bg-bg-card border border-border-main shadow-sm flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                                {(() => { const item = NAV_ITEMS.find(n => n.id === activeTab); return item ? <item.icon size={28} className="text-slate-400" /> : null; })()}
                            </div>
                            <h3 className="text-xl font-bold text-text-primary mb-2">Em breve</h3>
                            <p className="text-text-secondary text-sm max-w-xs">Esta secção está a ser desenvolvida e estará disponível em breve.</p>
                        </Card>
                    )}

                    {/* Security Banner */}
                    <Card className="p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0 shadow-2xl relative overflow-hidden">
                        <div className="absolute right-0 top-0 opacity-10 blur-xl translate-x-1/4 -translate-y-1/4">
                            <Shield size={250} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-puculuxa-lime/20 rounded-lg text-puculuxa-lime">
                                    <Shield size={20} />
                                </div>
                                <h3 className="text-xl font-bold">Segurança de Nível Elite Ativada</h3>
                            </div>
                            <p className="text-slate-400 text-sm mb-6 max-w-md">
                                Sua conta está protegida por encriptação AES-256 e Throttler Guards contra ataques de força bruta. Recomendamos ativar o MFA para segurança máxima.
                            </p>
                            <Button className="bg-white text-slate-900 hover:bg-slate-100 font-bold h-10 px-6 rounded-xl border-0" onClick={() => setActiveTab('mfa')}>
                                Configurar Autenticação 2FA
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

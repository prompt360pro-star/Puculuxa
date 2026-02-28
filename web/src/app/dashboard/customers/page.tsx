'use client';

import React, { useState } from 'react';
import { AuthWebService } from '@/services/authService';
import { User } from '@/types';
import { Users, Mail, Phone, Calendar, Search, Filter, MoreVertical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function CustomersPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data: users = [], isLoading: loading } = useQuery<User[]>({
        queryKey: ['customers'],
        queryFn: () => AuthWebService.getUsers(),
    });

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate new customers this month
    const newCustomersThisMonth = users.filter(user => {
        const userDate = new Date(user.createdAt);
        const now = new Date();
        return userDate.getMonth() === now.getMonth() && userDate.getFullYear() === now.getFullYear();
    }).length;

    const handleExportCSV = () => {
        if (users.length === 0) return;

        const headers = ['Nome', 'Email', 'Telefone', 'Cargo', 'Data de Registo'];
        const csvContent = [
            headers.join(','),
            ...users.map(u => [
                `"${u.name || ''}"`,
                `"${u.email || ''}"`,
                `"${u.phone || ''}"`,
                `"${u.role || ''}"`,
                `"${new Date(u.createdAt).toLocaleDateString('pt-BR')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `clientes_puculuxa_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-8 transition-colors duration-300">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Gestão de Clientes</h1>
                    <p className="text-text-secondary">Visualize e gerencie a base de clientes do ecossistema Puculuxa.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="pl-10 pr-4 py-2 rounded-xl border border-border-main focus:outline-none focus:ring-2 focus:ring-puculuxa-orange/20 w-64 bg-bg-card text-text-primary"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-bg-card border border-border-main rounded-xl text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <Filter size={18} />
                        Filtros
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={users.length === 0}
                        className="px-6 py-2 bg-puculuxa-orange text-white rounded-xl shadow-puculuxa hover:opacity-90 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Exportar CSV
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-bg-card p-6 rounded-3xl border border-border-main shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-puculuxa-orange/10 rounded-2xl text-puculuxa-orange">
                            <Users size={24} />
                        </div>
                        <span className="text-sm font-medium text-text-secondary">Total de Clientes</span>
                    </div>
                    <p className="text-3xl font-bold text-text-primary">{users.length}</p>
                </div>
                <div className="p-6 rounded-3xl text-white bg-gradient-to-br from-puculuxa-orange to-puculuxa-gold shadow-puculuxa">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <Calendar size={24} />
                        </div>
                        <span className="text-sm font-medium opacity-80">Novos este Mês</span>
                    </div>
                    <p className="text-3xl font-bold">{newCustomersThisMonth}</p>
                </div>
                <div className="bg-bg-card p-6 rounded-3xl border border-border-main shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-puculuxa-lime/10 rounded-2xl text-puculuxa-lime">
                            <Users size={24} />
                        </div>
                        <span className="text-sm font-medium text-text-secondary">Clientes Ativos</span>
                    </div>
                    <p className="text-3xl font-bold text-text-primary">{users.filter(u => u.role === 'CUSTOMER').length}</p>
                </div>
            </div>

            <div className="bg-bg-card rounded-3xl border border-border-main shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-border-main">
                        <tr>
                            <th className="px-6 py-4 text-sm font-bold text-text-secondary uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-4 text-sm font-bold text-text-secondary uppercase tracking-wider">E-mail</th>
                            <th className="px-6 py-4 text-sm font-bold text-text-secondary uppercase tracking-wider">Telefone</th>
                            <th className="px-6 py-4 text-sm font-bold text-text-secondary uppercase tracking-wider">Cargo</th>
                            <th className="px-6 py-4 text-sm font-bold text-text-secondary uppercase tracking-wider">Cadastro</th>
                            <th className="px-6 py-4 text-sm font-bold text-text-secondary uppercase tracking-wider text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                                    Carregando clientes...
                                </td>
                            </tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                                    Nenhum cliente encontrado.
                                </td>
                            </tr>
                        ) : filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-puculuxa-orange/10 flex items-center justify-center text-puculuxa-orange font-bold">
                                            {user.name?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                        <span className="font-bold text-text-primary">{user.name || 'Sem nome'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-text-secondary text-sm">
                                        <Mail size={14} />
                                        {user.email}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-text-secondary text-sm">
                                        <Phone size={14} />
                                        {user.phone || 'Não informado'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${user.role === 'ADMIN' ? 'bg-puculuxa-lime/20 text-puculuxa-lime' : 'bg-puculuxa-orange/20 text-puculuxa-orange'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-text-secondary">
                                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        title="Ações do cliente"
                                        aria-label="Ações do cliente"
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-text-secondary transition-colors"
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

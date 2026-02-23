'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Filter, Loader2, X } from 'lucide-react';
import { ProductWebService } from '@/services/productService';

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    description?: string;
    image?: string;
}

export default function CatalogPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newProduct, setNewProduct] = useState({ name: '', category: 'Bolos', price: '', description: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        const data = await ProductWebService.getAll();
        setProducts(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        setUploading(true);
        try {
            let imageUrl = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=500';

            if (selectedFile) {
                const uploadResult = await ProductWebService.uploadImage(selectedFile);
                imageUrl = uploadResult.url;
            }

            await ProductWebService.create({
                ...newProduct,
                price: parseFloat(newProduct.price) || 0,
                image: imageUrl,
            });
            setShowModal(false);
            setNewProduct({ name: '', category: 'Bolos', price: '', description: '' });
            setSelectedFile(null);
            loadProducts();
        } catch (error) {
            console.error('Error creating product:', error);
            alert('Erro ao criar produto');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Deseja realmente excluir este produto?')) {
            await ProductWebService.delete(id);
            loadProducts();
        }
    };
    return (
        <div className="p-8 transition-colors duration-300">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Catálogo de Produtos</h1>
                    <p className="text-text-secondary">Gerencie os itens da sua vitrine digital.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-puculuxa-orange text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-puculuxa hover:scale-105 transition-all"
                >
                    <Plus size={20} />
                    NOVO PRODUTO
                </button>
            </header>

            {/* Filters */}
            <div className="flex gap-4 mb-8">
                <div className="flex-1 bg-bg-card p-4 rounded-xl border border-border-main flex items-center gap-2">
                    <Filter size={20} className="text-text-secondary" />
                    <input type="text" placeholder="Filtrar por nome ou categoria..." className="flex-1 outline-none text-sm bg-transparent text-text-primary" />
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-bg-card rounded-2xl border border-border-main shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-text-secondary uppercase text-[10px] font-bold tracking-widest border-b border-border-main">
                        <tr>
                            <th className="p-6">Nome do Produto</th>
                            <th className="p-6">Categoria</th>
                            <th className="p-6">Preço Base</th>
                            <th className="p-6">Estoque/Disp.</th>
                            <th className="p-6 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-text-secondary">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="animate-spin text-primary" />
                                        <span>Carregando catálogo...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : products.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-text-secondary">
                                    Nenhum produto cadastrado.
                                </td>
                            </tr>
                        ) : products.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                <td className="p-6 font-bold text-text-primary">{product.name}</td>
                                <td className="p-6 text-sm text-text-secondary">{product.category}</td>
                                <td className="p-6 text-sm font-bold text-puculuxa-orange">Kz {product.price?.toFixed(2)}</td>
                                <td className="p-6">
                                    <span className="px-3 py-1 bg-puculuxa-lime/10 text-puculuxa-lime text-xs font-bold rounded-full">
                                        Disponível
                                    </span>
                                </td>
                                <td className="p-6 text-right flex justify-end gap-3">
                                    <button
                                        title="Editar produto"
                                        aria-label="Editar produto"
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-text-secondary transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        title="Excluir produto"
                                        aria-label="Excluir produto"
                                        onClick={() => handleDelete(product.id)}
                                        className="p-2 hover:bg-red-50 rounded-lg text-red-400 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Modal Simples */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border-main">
                        <div className="bg-gradient-to-r from-puculuxa-orange to-puculuxa-gold p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold">Novo Produto</h3>
                            <button onClick={() => setShowModal(false)} className="hover:rotate-90 transition-transform" title="Fechar modal" aria-label="Fechar modal"><X size={24} /></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label htmlFor="product-name" className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Nome</label>
                                <input
                                    id="product-name"
                                    title="Nome do Produto"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl outline-none focus:ring-2 ring-puculuxa-orange transition-all text-text-primary"
                                    value={newProduct.name}
                                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label htmlFor="product-image" className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Imagem do Produto</label>
                                <input
                                    id="product-image"
                                    title="Imagem do Produto"
                                    type="file"
                                    accept="image/*"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl outline-none focus:ring-2 ring-puculuxa-orange transition-all text-xs text-text-secondary"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                />
                                {selectedFile && <p className="text-[10px] text-puculuxa-lime mt-1 font-bold">✓ Selecionado: {selectedFile.name}</p>}
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={uploading}
                                className="w-full bg-primary text-white p-4 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all mt-4 disabled:opacity-50 flex justify-center items-center gap-2"
                            >
                                {uploading && <Loader2 className="animate-spin" size={20} />}
                                {uploading ? 'ENVIANDO...' : 'SALVAR PRODUTO'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Plus, Edit2, Trash2, Filter, Loader2, X } from 'lucide-react';
import { ProductWebService } from '@/services/productService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

const productSchema = z.object({
    name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
    category: z.string().min(1, 'A categoria é obrigatória'),
    price: z.coerce.number().min(0.01, 'O preço deve ser maior que zero'),
    description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

import { Product } from '@/types';

export default function CatalogPage() {
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 10;

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ProductFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(productSchema) as any,
        defaultValues: { name: '', category: 'Bolos', price: 0, description: '' }
    });

    // Replaces useEffect + local state
    const { data: products = [], isLoading: loading } = useQuery({
        queryKey: ['products'],
        queryFn: () => ProductWebService.getAll()
    });

    const createProductMutation = useMutation({
        mutationFn: async (data: ProductFormValues) => {
            let imageUrl = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=500';
            if (selectedFile) {
                const uploadResult = await ProductWebService.uploadImage(selectedFile);
                imageUrl = uploadResult.url;
            }

            if (editingProduct) {
                return ProductWebService.update(editingProduct.id, {
                    ...data,
                    ...(selectedFile ? { image: imageUrl } : {})
                });
            } else {
                return ProductWebService.create({
                    ...data,
                    image: imageUrl,
                });
            }
        },
        onSuccess: () => {
            handleCloseModal();
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success(editingProduct ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
        },
        onError: (error) => {
            console.error('Error creating/updating product:', error);
            toast.error('Erro ao processar produto. Verifique os dados e tente novamente.');
        }
    });

    const deleteProductMutation = useMutation({
        mutationFn: (id: string) => ProductWebService.delete(id),
        onSuccess: () => {
            setProductToDelete(null);
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.success('Produto excluído com sucesso!');
        }
    });

    const onSubmit = (data: ProductFormValues) => createProductMutation.mutate(data);

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setValue('name', product.name);
        setValue('category', product.category);
        setValue('price', product.price || 0);
        setValue('description', product.description || '');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setSelectedFile(null);
        reset();
    };

    const confirmDelete = () => {
        if (productToDelete) {
            deleteProductMutation.mutate(productToDelete);
        }
    };

    const categories = React.useMemo(() => {
        const cats = [...new Set(products.map((p: Product) => p.category).filter(Boolean))];
        return ['Todos', ...cats];
    }, [products]);

    const filteredProducts = products.filter((p: Product) => {
        const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCat = selectedCategory === 'Todos' || p.category === selectedCategory;
        return matchSearch && matchCat;
    });

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    const handlePageChange = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    const handleFilterChange = (term: string) => { setSearchTerm(term); setCurrentPage(1); };
    const handleCategoryChange = (cat: string) => { setSelectedCategory(cat); setCurrentPage(1); };

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
            <div className="space-y-4 mb-8">
                <div className="flex gap-4">
                    <div className="flex-1 bg-bg-card p-4 rounded-xl border border-border-main flex items-center gap-2">
                        <Filter size={20} className="text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Filtrar por nome..."
                            className="flex-1 outline-none text-sm bg-transparent text-text-primary"
                            value={searchTerm}
                            onChange={(e) => handleFilterChange(e.target.value)}
                        />
                    </div>
                </div>
                {/* Category Pills */}
                <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleCategoryChange(cat)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCategory === cat
                                    ? 'bg-puculuxa-orange text-white shadow-puculuxa'
                                    : 'bg-bg-card border border-border-main text-text-secondary hover:border-puculuxa-orange hover:text-puculuxa-orange'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                    {filteredProducts.length > 0 && (
                        <span className="ml-auto text-xs text-text-secondary font-bold self-center">
                            {filteredProducts.length} produto{filteredProducts.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-bg-card rounded-2xl border border-border-main shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-text-secondary uppercase text-[10px] font-bold tracking-widest border-b border-border-main">
                        <tr>
                            <th className="p-6">Produto</th>
                            <th className="p-6">Categoria</th>
                            <th className="p-6">Preço Base</th>
                            <th className="p-6">Estoque/Disp.</th>
                            <th className="p-6 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-main">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-text-secondary">
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="animate-spin text-primary" />
                                        <span>Carregando catálogo...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-text-secondary">
                                    Nenhum produto cadastrado com os filtros atuais.
                                </td>
                            </tr>
                        ) : paginatedProducts.map((product) => (
                            <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 relative">
                                            {product.image ? (
                                                <Image src={product.image} alt={product.name} fill className="object-cover" sizes="48px" unoptimized />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">📷</div>
                                            )}
                                        </div>
                                        <span className="font-bold text-text-primary">{product.name}</span>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-text-secondary text-xs font-bold rounded-full">{product.category}</span>
                                </td>
                                <td className="p-6 text-sm font-bold text-puculuxa-orange">Kz {product.price?.toFixed(2)}</td>
                                <td className="p-6">
                                    <span className="px-3 py-1 bg-puculuxa-lime/10 text-puculuxa-lime text-xs font-bold rounded-full">
                                        Disponível
                                    </span>
                                </td>
                                <td className="p-6 text-right flex justify-end gap-3">
                                    <button
                                        onClick={() => handleEdit(product)}
                                        title="Editar produto"
                                        aria-label="Editar produto"
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-text-secondary transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        title="Excluir produto"
                                        aria-label="Excluir produto"
                                        onClick={() => setProductToDelete(product.id)}
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-2">
                    <span className="text-xs text-text-secondary font-bold">
                        Página {currentPage} de {totalPages} &middot; {filteredProducts.length} resultados
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-xs font-bold rounded-xl bg-bg-card border border-border-main text-text-secondary hover:border-puculuxa-orange hover:text-puculuxa-orange disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            ← Anterior
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`w-9 h-9 text-xs font-bold rounded-xl transition-all ${page === currentPage
                                        ? 'bg-puculuxa-orange text-white shadow-puculuxa'
                                        : 'bg-bg-card border border-border-main text-text-secondary hover:border-puculuxa-orange'
                                    }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-xs font-bold rounded-xl bg-bg-card border border-border-main text-text-secondary hover:border-puculuxa-orange hover:text-puculuxa-orange disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            Próximo →
                        </button>
                    </div>
                </div>
            )}
            {/* Modal Simples */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-border-main">
                        <div className="bg-gradient-to-r from-puculuxa-orange to-puculuxa-gold p-6 text-white flex justify-between items-center">
                            <h3 className="text-xl font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                            <button onClick={handleCloseModal} className="hover:rotate-90 transition-transform" title="Fechar modal" aria-label="Fechar modal"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-4">
                            <div>
                                <label htmlFor="product-name" className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Nome</label>
                                <input
                                    id="product-name"
                                    title="Nome do Produto"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl outline-none focus:ring-2 ring-puculuxa-orange transition-all text-text-primary"
                                    {...register('name')}
                                />
                                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="product-price" className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Preço (Kz)</label>
                                <input
                                    id="product-price"
                                    title="Preço"
                                    type="number"
                                    step="0.01"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl outline-none focus:ring-2 ring-puculuxa-orange transition-all text-text-primary"
                                    {...register('price')}
                                />
                                {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                            </div>
                            <div>
                                <label htmlFor="product-image" className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-2 block">Imagem do Produto (Opcional)</label>
                                <input
                                    id="product-image"
                                    title="Imagem do Produto"
                                    type="file"
                                    accept="image/*"
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl outline-none focus:ring-2 ring-puculuxa-orange transition-all text-xs text-text-secondary"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setSelectedFile(file);
                                        if (file) setImagePreview(URL.createObjectURL(file));
                                    }}
                                />
                                {imagePreview && (
                                    <div className="mt-2 rounded-xl overflow-hidden w-full h-28 relative">
                                        <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="400px" unoptimized />
                                    </div>
                                )}
                                {editingProduct && editingProduct.image && !selectedFile && (
                                    <p className="text-[10px] text-text-secondary mt-1 italic">Imagem atual será mantida se não enviar outra.</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={createProductMutation.isPending}
                                className="w-full bg-gradient-to-r from-puculuxa-orange to-puculuxa-gold text-white p-4 rounded-2xl font-bold shadow-puculuxa hover:shadow-glow hover:-translate-y-0.5 transition-all mt-4 disabled:opacity-50 flex justify-center items-center gap-2 tracking-widest text-xs uppercase"
                            >
                                {createProductMutation.isPending && <Loader2 className="animate-spin" size={20} />}
                                {createProductMutation.isPending ? 'ENVIANDO...' : (editingProduct ? 'SALVAR ALTERAÇÕES' : 'SALVAR PRODUTO')}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Confirmação de Eliminação */}
            {productToDelete && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-bg-card rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-border-main p-8 text-center">
                        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-text-primary mb-2">Confirmar Exclusão</h3>
                        <p className="text-text-secondary mb-8 text-sm">Tem certeza que deseja remover este produto permanentemente? Esta ação não pode ser desfeita.</p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setProductToDelete(null)}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-text-secondary bg-slate-100 dark:bg-slate-800 hover:opacity-80 transition-all"
                            >
                                CANCELAR
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={deleteProductMutation.isPending}
                                className="flex-1 px-6 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all disabled:opacity-50 flex justify-center items-center"
                            >
                                {deleteProductMutation.isPending ? <Loader2 className="animate-spin" size={20} /> : 'EXCLUIR'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

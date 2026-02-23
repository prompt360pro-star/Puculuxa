import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Catálogo de Produtos | Puculuxa Admin',
    description: 'Gerencie os itens da sua vitrine digital.',
};

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

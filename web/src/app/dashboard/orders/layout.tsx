import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestão de Pedidos | Puculuxa Admin',
    description: 'Acompanhe e mova os pedidos pelo processo produtivo.',
};

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

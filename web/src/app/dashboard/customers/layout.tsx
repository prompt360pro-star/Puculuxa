import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gestão de Clientes | Puculuxa Admin',
    description: 'Visualize e gerencie a base de clientes do ecossistema Puculuxa.',
};

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

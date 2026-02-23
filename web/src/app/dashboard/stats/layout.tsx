import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Relatórios e Estatísticas | Puculuxa Admin',
    description: 'Acompanhe as métricas e relatórios financeiros da Puculuxa.',
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

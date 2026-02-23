import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Avaliações | Puculuxa Admin',
    description: 'O que os clientes estão dizendo sobre a Puculuxa.',
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}

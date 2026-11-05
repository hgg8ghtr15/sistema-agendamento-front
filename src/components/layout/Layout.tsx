import type { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
    children: ReactNode;
}

// Layout envolve todas as páginas com o cabeçalho comum
// children é o conteúdo específico de cada página
export function Layout({ children }: LayoutProps) {
    return (
        <div className="site-shell">
            <Header />
            <main className="page-main">
                {children}
            </main>
        </div>
    );
}
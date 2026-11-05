// src/pages/NaoEncontradaPage.tsx
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';

export function NaoEncontradaPage() {
    return (
        <Layout>
            <div className="not-found">
                <span className="eyebrow">Página não encontrada</span>
                <h1>404 — Página não encontrada</h1>
                <p>O endereço que você acessou não existe.</p>
                <Link className="text-link" to="/">Voltar para o início</Link>
            </div>
        </Layout>
    );
}
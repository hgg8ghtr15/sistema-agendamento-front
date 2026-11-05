// src/components/layout/Header.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Botao } from '../ui/Botao';

export function Header() {
    // useNavigate retorna uma função para navegar programaticamente
    // (sem o usuário clicar em um link)
    const navigate = useNavigate();
    const { sessao, estaLogado, eAdmin, fazerLogout } = useAuth();

    function handleLogout() {
        fazerLogout();
        navigate('/login');
    }

    return (
        <header className="site-header">
            <Link to="/" className="brand" aria-label="Serena — início">
                <span className="brand-mark" aria-hidden="true">S</span>
                <span className="brand-copy">
                    <strong>Serena</strong>
                    <span>massagem & bem-estar</span>
                </span>
            </Link>

            <nav className="site-nav" aria-label="Navegação principal">
                {estaLogado ? (
                    <>
                        <span className="welcome-message">
                            Olá, {sessao?.usuario.nome}
                        </span>
                        <Link to="/massagens">Massagens</Link>
                        {eAdmin && <Link to="/materiais">Materiais</Link>}
                        <Botao variante="secundario" onClick={handleLogout}>
                            Sair
                        </Botao>
                    </>
                ) : (
                    <Link to="/login">Entrar</Link>
                )}
            </nav>
        </header>
    );
}
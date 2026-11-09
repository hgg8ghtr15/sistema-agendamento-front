import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RotaProtegidaProps {
    // Se definido, somente usuários com esse perfil podem acessar
    perfilExigido?: 'ADMIN' | 'CLIENTE' | 'MASSAGISTA' | 'ADMINISTRATIVO';
}

export function RotaProtegida({ perfilExigido }: RotaProtegidaProps) {
    const { estaLogado, sessao } = useAuth();

    // Usuário não está logado: redireciona para /login
    // `replace` substitui a entrada no histórico (botão voltar não volta para a rota protegida)
    if (!estaLogado) {
        return <Navigate to="/login" replace />;
    }

    // Perfil específico exigido e usuário não tem esse perfil
    if (perfilExigido && !sessao?.usuario.perfis.includes(perfilExigido)) {
        return <Navigate to="/" replace />;
    }

    // `Outlet` renderiza a rota filha configurada no AppRoutes
    return <Outlet />;
}
// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, type ReactNode } from 'react';
import type { Usuario, SessaoAtual } from '../types/auth';

// Define a "forma" do que o contexto vai disponibilizar
interface AuthContextType {
    sessao: SessaoAtual | null;      // null quando não está logado
    estaLogado: boolean;
    eAdmin: boolean;
    fazerLogin: (token: string, usuario: Usuario) => void;
    fazerLogout: () => void;
}

// Cria o contexto com um valor inicial vazio
// O '!' diz ao TypeScript para confiar que o contexto sempre estará preenchido
// quando usado dentro do AuthProvider
export const AuthContext = createContext<AuthContextType>(null!);

// Props do provider: `children` representa todos os componentes filhos
interface AuthProviderProps {
    children: ReactNode;
}

// Provider: componente que envolve a aplicação e disponibiliza o contexto
export function AuthProvider({ children }: AuthProviderProps) {
    // Estado: null = não logado; SessaoAtual = logado
    const [sessao, setSessao] = useState<SessaoAtual | null>(null);

    // useEffect com array vazio [] roda apenas uma vez, quando o componente monta
    // Aqui recuperamos a sessão do localStorage ao recarregar a página
    useEffect(() => {
        const token = localStorage.getItem('token');
        const usuarioString = localStorage.getItem('usuario');

        if (token && usuarioString) {
            try {
                const usuario: Usuario = JSON.parse(usuarioString);
                setSessao({ token, usuario });
            } catch {
                // JSON corrompido: limpa e ignora
                localStorage.removeItem('token');
                localStorage.removeItem('usuario');
            }
        }
    }, []);

    function fazerLogin(token: string, usuario: Usuario) {
        // Salva no localStorage para sobreviver ao reload da página
        localStorage.setItem('token', token);
        localStorage.setItem('usuario', JSON.stringify(usuario));
        // Atualiza o estado React (causa re-render nos componentes que usam o contexto)
        setSessao({ token, usuario });
    }

    function fazerLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setSessao(null);
    }

    const estaLogado = sessao !== null;
    const eAdmin = sessao?.usuario.perfil === 'ADMIN';

    return (
        // Disponibiliza os valores para todos os componentes dentro do Provider
        <AuthContext.Provider value={{ sessao, estaLogado, eAdmin, fazerLogin, fazerLogout }}>
            {children}
        </AuthContext.Provider>
    );
}
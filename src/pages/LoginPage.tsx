import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import { Aviso } from '../components/ui/Aviso';
import { Botao } from '../components/ui/Botao';

export function LoginPage() {
    // useState gerencia o estado local do componente
    // Cada chamada retorna [valorAtual, funçãoParaAtualizar]
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(false);

    const { fazerLogin } = useAuth();
    const navigate = useNavigate();

    // Função chamada quando o formulário é enviado
    async function handleSubmit(evento: FormEvent) {
        // Impede o comportamento padrão do formulário (recarregar a página)
        evento.preventDefault();
        setErro(null);
        setCarregando(true);

        try {
            const resposta = await login(email, senha);
            // Salva a sessão no contexto e no localStorage
            fazerLogin(resposta.token, resposta.user);
            // Redireciona para a lista de massagens após o login
            navigate('/massagens');
        } catch (err: unknown) {
            // Extrai a mensagem de erro do back-end, se disponível
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setErro(axiosErr.response?.data?.message ?? 'Erro ao fazer login. Verifique suas credenciais.');
            } else {
                setErro('Erro ao fazer login. Verifique suas credenciais.');
            }
        } finally {
            // `finally` roda sempre, com erro ou sem
            setCarregando(false);
        }
    }

    return (
        <main className="login-page">
            <section className="login-aside" aria-label="Bem-vindo ao Serena">
                <div className="brand" aria-label="Serena — massagem e bem-estar">
                    <span className="brand-mark" aria-hidden="true">S</span>
                    <span className="brand-copy">
                        <strong>Serena</strong>
                        <span>massagem & bem-estar</span>
                    </span>
                </div>
                <div className="login-aside-copy">
                    <span className="eyebrow">Cuide de você</span>
                    <h1>Um espaço para respirar e renovar.</h1>
                    <p>
                        Acolha seu tempo. Encontre o cuidado ideal para o seu corpo
                        e transforme pequenas pausas em momentos especiais.
                    </p>
                </div>
                <span className="login-aside-note">Seu momento começa aqui</span>
            </section>

            <section className="login-panel">
                <div className="login-form-wrap">
                    <span className="eyebrow">Bem-vindo de volta</span>
                    <h2>Entrar</h2>
                    <p className="login-subtitle">Acesse sua conta para continuar.</p>

                    {erro && <Aviso tipo="erro" mensagem={erro} />}

                    <form onSubmit={handleSubmit}>
                        <div className="form-field">
                            <label htmlFor="email">E-mail</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label htmlFor="senha">Senha</label>
                            <input
                                id="senha"
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                        </div>

                        <Botao className="login-submit" type="submit" disabled={carregando}>
                            {carregando ? 'Entrando...' : 'Entrar na minha conta'}
                        </Botao>
                    </form>
                </div>
            </section>
        </main>
    );
}
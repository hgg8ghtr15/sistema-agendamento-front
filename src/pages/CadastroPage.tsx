import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cadastrarUsuario } from '../api/auth';
import { Aviso } from '../components/ui/Aviso';
import { Botao } from '../components/ui/Botao';
import { useAuth } from '../hooks/useAuth';

export function CadastroPage() {
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmacao, setConfirmacao] = useState('');
    const [erro, setErro] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(false);
    const { fazerLogin } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        setErro(null);

        if (senha !== confirmacao) {
            setErro('As senhas não conferem.');
            return;
        }

        setCarregando(true);
        try {
            const resposta = await cadastrarUsuario({ nome: nome.trim(), email, senha });
            fazerLogin(resposta.token, resposta.user);
            navigate('/massagens');
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
                const mensagem = axiosErr.response?.data?.message;
                setErro(Array.isArray(mensagem) ? mensagem.join(' ') : mensagem ?? 'Não foi possível criar sua conta.');
            } else {
                setErro('Não foi possível criar sua conta.');
            }
        } finally {
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
                    <h1>Seu momento de bem-estar começa aqui.</h1>
                    <p>Crie sua conta para conhecer nossas experiências de cuidado.</p>
                </div>
                <span className="login-aside-note">Seu momento começa aqui</span>
            </section>

            <section className="login-panel">
                <div className="login-form-wrap">
                    <span className="eyebrow">Faça seu cadastro</span>
                    <h2>Criar conta</h2>
                    <p className="login-subtitle">O cadastro cria uma conta de cliente.</p>
                    {erro && <Aviso tipo="erro" mensagem={erro} />}

                    <form onSubmit={handleSubmit}>
                        <div className="form-field">
                            <label htmlFor="nome">Nome</label>
                            <input
                                id="nome"
                                type="text"
                                minLength={2}
                                maxLength={100}
                                value={nome}
                                onChange={(evento) => setNome(evento.target.value)}
                                autoComplete="name"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="email">E-mail</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(evento) => setEmail(evento.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="senha">Senha</label>
                            <input
                                id="senha"
                                type="password"
                                minLength={6}
                                maxLength={50}
                                value={senha}
                                onChange={(evento) => setSenha(evento.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="confirmacao">Confirme a senha</label>
                            <input
                                id="confirmacao"
                                type="password"
                                value={confirmacao}
                                onChange={(evento) => setConfirmacao(evento.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                        <Botao className="login-submit" type="submit" disabled={carregando}>
                            {carregando ? 'Cadastrando...' : 'Criar minha conta'}
                        </Botao>
                    </form>

                    <p className="login-subtitle">
                        Já tem uma conta? <Link to="/login">Entrar</Link>
                    </p>
                </div>
            </section>
        </main>
    );
}

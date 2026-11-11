import { useEffect, useState } from 'react';
import { Aviso } from '../components/ui/Aviso';
import { Botao } from '../components/ui/Botao';
import { Layout } from '../components/layout/Layout';
import { listarUsuarios, atualizarPerfis, type UsuarioGerenciado } from '../api/usuarios';
import { useAuth } from '../hooks/useAuth';
import type { Perfil } from '../types/auth';

const perfis: Perfil[] = ['CLIENTE', 'ADMIN', 'ADMINISTRATIVO', 'MASSAGISTA'];

const nomesPerfis: Record<Perfil, string> = {
    CLIENTE: 'Cliente',
    ADMIN: 'Administrador',
    ADMINISTRATIVO: 'Administrativo',
    MASSAGISTA: 'Massagista',
};

function mensagemErro(err: unknown): string {
    if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
        const mensagem = axiosErr.response?.data?.message;
        return Array.isArray(mensagem) ? mensagem.join(' ') : mensagem ?? 'Não foi possível concluir a operação.';
    }
    return 'Não foi possível concluir a operação.';
}

export function UsuariosPage() {
    const { eAdmin, sessao, fazerLogin } = useAuth();
    const [usuarios, setUsuarios] = useState<UsuarioGerenciado[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [salvandoId, setSalvandoId] = useState<number | null>(null);
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);
    const [termoBusca, setTermoBusca] = useState('');
    const [perfisFiltro, setPerfisFiltro] = useState<Perfil[]>([]);

    const usuariosFiltrados = usuarios.filter((usuario) => {
        const termo = termoBusca.trim().toLocaleLowerCase('pt-BR');
        const correspondeAoTermo = !termo ||
            usuario.nome.toLocaleLowerCase('pt-BR').includes(termo) ||
            usuario.email.toLocaleLowerCase('pt-BR').includes(termo);
        const correspondeAoPerfil = perfisFiltro.length === 0 ||
            perfisFiltro.some((perfil) => usuario.perfis.includes(perfil));
        return correspondeAoTermo && correspondeAoPerfil;
    });

    useEffect(() => {
        async function carregar() {
            try {
                setUsuarios(await listarUsuarios());
            } catch (err: unknown) {
                setErro(mensagemErro(err));
            } finally {
                setCarregando(false);
            }
        }
        if (eAdmin) void carregar();
    }, [eAdmin]);

    function alternarPerfil(usuarioId: number, perfil: Perfil) {
        setErro(null);
        setSucesso(null);
        setUsuarios((atuais) => atuais.map((usuario) => {
            if (usuario.id !== usuarioId) return usuario;
            const possuiPerfil = usuario.perfis.includes(perfil);
            const novosPerfis = possuiPerfil
                ? usuario.perfis.filter((item) => item !== perfil)
                : [...usuario.perfis, perfil];
            return { ...usuario, perfis: novosPerfis };
        }));
    }

    async function salvarPerfis(usuario: UsuarioGerenciado) {
        if (usuario.perfis.length === 0) {
            setErro('Selecione ao menos um perfil para cada usuário.');
            return;
        }

        setErro(null);
        setSucesso(null);
        setSalvandoId(usuario.id);
        try {
            const atualizado = await atualizarPerfis(usuario.id, usuario.perfis);
            setUsuarios((atuais) => atuais.map((item) => item.id === usuario.id ? atualizado : item));
            if (sessao?.usuario.id === atualizado.id) {
                fazerLogin(sessao.token, atualizado);
            }
            setSucesso(`Perfis de ${atualizado.nome} atualizados.`);
        } catch (err: unknown) {
            setErro(mensagemErro(err));
        } finally {
            setSalvandoId(null);
        }
    }

    if (!eAdmin) {
        return (
            <Layout>
                <Aviso tipo="erro" mensagem="Acesso negado. Apenas administradores podem gerenciar usuários." />
            </Layout>
        );
    }

    return (
        <Layout>
            <section className="page-intro">
                <span className="eyebrow">Administração</span>
                <h1>Usuários e perfis</h1>
                <p>Cadastros públicos começam como clientes. Selecione um ou mais perfis e salve as alterações.</p>
            </section>

            {erro && <Aviso tipo="erro" mensagem={erro} />}
            {sucesso && <Aviso tipo="sucesso" mensagem={sucesso} />}
            {carregando && <Aviso tipo="info" mensagem="Carregando usuários..." />}
            {!carregando && usuarios.length === 0 && !erro && (
                <Aviso tipo="info" mensagem="Nenhum usuário cadastrado." />
            )}

            <section className="user-filters" aria-label="Filtros de usuários">
                <div className="form-field">
                    <label htmlFor="buscar-usuario">Buscar por nome ou e-mail</label>
                    <input
                        id="buscar-usuario"
                        type="search"
                        value={termoBusca}
                        onChange={(evento) => setTermoBusca(evento.target.value)}
                        placeholder="Digite um nome ou e-mail"
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="filtrar-perfis">Filtrar por perfil (opcional)</label>
                    <select
                        id="filtrar-perfis"
                        multiple
                        value={perfisFiltro}
                        onChange={(evento) => setPerfisFiltro(
                            Array.from(evento.currentTarget.selectedOptions, (option) => option.value as Perfil),
                        )}
                        aria-describedby="ajuda-filtro-perfis"
                    >
                        {perfis.map((perfil) => (
                            <option key={perfil} value={perfil}>{nomesPerfis[perfil]}</option>
                        ))}
                    </select>
                    <p className="field-hint" id="ajuda-filtro-perfis">
                        Sem seleção, todos os perfis são exibidos. Você pode selecionar mais de um.
                    </p>
                </div>
            </section>

            {!carregando && usuarios.length > 0 && usuariosFiltrados.length === 0 && (
                <Aviso tipo="info" mensagem="Nenhum usuário corresponde aos filtros selecionados." />
            )}

            <div className="users-list">
                {usuariosFiltrados.map((usuario) => (
                    <article className="user-card detail-panel" key={usuario.id}>
                        <div className="user-card-heading">
                            <div>
                                <h2>{usuario.nome}</h2>
                                <p>{usuario.email}</p>
                            </div>
                            <span className="user-created">
                                Cadastro em {new Date(usuario.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                        </div>
                        <fieldset className="user-roles">
                            <legend>Perfis de acesso</legend>
                            {perfis.map((perfil) => (
                                <label key={perfil}>
                                    <input
                                        type="checkbox"
                                        checked={usuario.perfis.includes(perfil)}
                                        onChange={() => alternarPerfil(usuario.id, perfil)}
                                    />
                                    {nomesPerfis[perfil]}
                                </label>
                            ))}
                        </fieldset>
                        <div className="form-actions">
                            <Botao
                                type="button"
                                disabled={salvandoId === usuario.id || usuario.perfis.length === 0}
                                onClick={() => void salvarPerfis(usuario)}
                            >
                                {salvandoId === usuario.id ? 'Salvando...' : 'Salvar perfis'}
                            </Botao>
                        </div>
                    </article>
                ))}
            </div>
        </Layout>
    );
}

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@mdi/react';
import {
    mdiArrowLeft,
    mdiArchiveArrowUp,
    mdiArchiveArrowDown,
    mdiPlus,
    mdiPencil,
    mdiClose,
    mdiContentSave,
} from '@mdi/js';
import { Aviso } from '../components/ui/Aviso';
import { Botao } from '../components/ui/Botao';
import { Carregando } from '../components/ui/Carregando';
import { Layout } from '../components/layout/Layout';
import { ToastSucesso } from '../components/ui/ToastSucesso';
import { useAuth } from '../hooks/useAuth';
import {
    atualizarMaterial,
    criarMaterial,
    definirMaterialAtivo,
    listarMateriais,
} from '../api/massagens';
import type { Material } from '../types/massagem';

export function MateriaisPage() {
    const { eAdmin } = useAuth();
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [materialEmEdicao, setMaterialEmEdicao] = useState<Material | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [materialEmAtualizacao, setMaterialEmAtualizacao] = useState<number | null>(null);
    const [erro, setErro] = useState<string | null>(null);
    const [notificacao, setNotificacao] = useState<{ id: number; mensagem: string } | null>(null);
    const proximoIdNotificacao = useRef(0);

    useEffect(() => {
        if (!eAdmin) return;

        async function carregarMateriais() {
            try {
                setMateriais(await listarMateriais());
            } catch {
                setErro('Não foi possível carregar o catálogo de materiais.');
            } finally {
                setCarregando(false);
            }
        }

        carregarMateriais();
    }, [eAdmin]);

    if (!eAdmin) {
        return (
            <Layout>
                <Aviso tipo="erro" mensagem="Acesso negado. Apenas administradores podem gerenciar materiais." />
            </Layout>
        );
    }

    async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        setErro(null);
        setSalvando(true);

        try {
            if (materialEmEdicao) {
                const atualizado = await atualizarMaterial(materialEmEdicao.id, {
                    nome: nome.trim(),
                    descricao: descricao.trim(),
                });
                setMateriais((atuais) => atuais
                    .map((item) => item.id === atualizado.id ? atualizado : item)
                    .sort((a, b) => a.nome.localeCompare(b.nome)));
                setNotificacao({
                    id: ++proximoIdNotificacao.current,
                    mensagem: 'Material atualizado com sucesso.',
                });
                setMaterialEmEdicao(null);
            } else {
                const material = await criarMaterial({
                    nome: nome.trim(),
                    ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
                });
                setMateriais((atuais) => [...atuais, material].sort((a, b) => a.nome.localeCompare(b.nome)));
                setNotificacao({
                    id: ++proximoIdNotificacao.current,
                    mensagem: 'Material cadastrado com sucesso.',
                });
            }
            setNome('');
            setDescricao('');
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
                const mensagem = axiosErr.response?.data?.message;
                setErro(Array.isArray(mensagem)
                    ? mensagem.join(' ')
                    : mensagem ?? `Não foi possível ${materialEmEdicao ? 'atualizar' : 'cadastrar'} o material.`);
            } else {
                setErro(`Não foi possível ${materialEmEdicao ? 'atualizar' : 'cadastrar'} o material.`);
            }
        } finally {
            setSalvando(false);
        }
    }

    function iniciarEdicao(material: Material) {
        setErro(null);
        setMaterialEmEdicao(material);
        setNome(material.nome);
        setDescricao(material.descricao ?? '');
    }

    function cancelarEdicao() {
        setMaterialEmEdicao(null);
        setNome('');
        setDescricao('');
        setErro(null);
    }

    async function alternarAtivo(material: Material) {
        setErro(null);
        setMaterialEmAtualizacao(material.id);

        try {
            const atualizado = await definirMaterialAtivo(material.id, !material.ativo);
            setMateriais((atuais) => atuais.map((item) => item.id === atualizado.id ? atualizado : item));
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
                const mensagem = axiosErr.response?.data?.message;
                setErro(Array.isArray(mensagem) ? mensagem.join(' ') : mensagem ?? 'Não foi possível alterar o status do material.');
            } else {
                setErro('Não foi possível alterar o status do material.');
            }
        } finally {
            setMaterialEmAtualizacao(null);
        }
    }

    return (
        <Layout>
            {notificacao && (
                <ToastSucesso
                    key={notificacao.id}
                    mensagem={notificacao.mensagem}
                    onFechar={() => setNotificacao(null)}
                />
            )}
            <section className="materials-page">
                <header className="materials-heading">
                    <div className="detail-title-row">
                        <Link className="detail-back-link detail-back-link--prominent" to="/massagens">
                            <Icon path={mdiArrowLeft} size="1.25rem" className="back-icon" />
                            <span>Voltar</span>
                        </Link>
                        <span className="eyebrow">Administração</span>
                    </div>
                </header>

                {erro && <Aviso tipo="erro" mensagem={erro} />}

                <div>
                    <h1>Materiais</h1>
                    <p>Cadastre e gerencie os materiais usados nas experiências.</p>
                </div>
                <div className="materials-layout">
                    <form className="materials-form" onSubmit={handleSubmit}>
                        <div>
                            <span className="eyebrow">{materialEmEdicao ? 'Editando material' : 'Novo item'}</span>
                            <h2>{materialEmEdicao ? 'Editar material' : 'Cadastrar material'}</h2>
                            <p>{materialEmEdicao
                                ? 'Atualize o nome ou a descrição deste material.'
                                : 'Os materiais ativos podem ser associados às massagens.'}</p>
                        </div>
                        <div className="form-field">
                            <label htmlFor="material-nome">Nome</label>
                            <input
                                id="material-nome"
                                type="text"
                                minLength={2}
                                maxLength={100}
                                value={nome}
                                onChange={(evento) => setNome(evento.target.value)}
                                required
                            />
                        </div>
                        <div className="form-field">
                            <label htmlFor="material-descricao">Descrição (opcional)</label>
                            <textarea
                                id="material-descricao"
                                maxLength={1000}
                                rows={3}
                                value={descricao}
                                onChange={(evento) => setDescricao(evento.target.value)}
                            />
                        </div>
                        <div className="form-actions">
                            {materialEmEdicao && (
                                <Botao type="button" variante="secundario" onClick={cancelarEdicao} disabled={salvando}>
                                    <Icon path={mdiClose} size="1rem" className="btn-icon" />
                                    Cancelar
                                </Botao>
                            )}
                            <Botao type="submit" disabled={salvando}>
                                <Icon
                                    path={materialEmEdicao ? mdiContentSave : mdiPlus}
                                    size="1rem"
                                    className="btn-icon"
                                />
                                {salvando
                                    ? materialEmEdicao ? 'Salvando...' : 'Cadastrando...'
                                    : materialEmEdicao ? 'Salvar alterações' : 'Cadastrar material'}
                            </Botao>
                        </div>
                    </form>

                    <section className="materials-list-panel">
                        <div className="materials-list-heading">
                            <div>
                                <span className="eyebrow">Catálogo</span>
                                <h2>Materiais cadastrados</h2>
                            </div>
                            <span className="materials-count">{materiais.length}</span>
                        </div>

                        {carregando ? (
                            <Carregando />
                        ) : materiais.length === 0 ? (
                            <Aviso tipo="info" mensagem="Nenhum material cadastrado. Use o formulário para adicionar o primeiro." />
                        ) : (
                            <ul className="materials-list">
                                {materiais.map((material) => (
                                    <li className="materials-list-item" key={material.id}>
                                        <div className="material-copy">
                                            <div className="material-name-row">
                                                <strong>{material.nome}</strong>
                                                <span className={`material-status ${material.ativo ? 'is-active' : 'is-inactive'}`}>
                                                    {material.ativo ? 'Ativo' : 'Arquivado'}
                                                </span>
                                            </div>
                                            {material.descricao && <p>{material.descricao}</p>}
                                        </div>
                                        <div className="material-actions">
                                            <Botao
                                                variante="secundario"
                                                disabled={salvando || materialEmAtualizacao === material.id}
                                                onClick={() => iniciarEdicao(material)}
                                            >
                                                <Icon path={mdiPencil} size="1rem" className="btn-icon" />
                                                Editar
                                            </Botao>
                                            <Botao
                                                variante="secundario"
                                                disabled={materialEmAtualizacao === material.id}
                                                onClick={() => alternarAtivo(material)}
                                            >
                                                <Icon
                                                    path={material.ativo ? mdiArchiveArrowDown : mdiArchiveArrowUp}
                                                    size="1rem"
                                                    className="btn-icon"
                                                />
                                                {materialEmAtualizacao === material.id
                                                    ? 'Atualizando...'
                                                    : material.ativo ? 'Arquivar' : 'Reativar'}
                                            </Botao>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </section>
        </Layout>
    );
}

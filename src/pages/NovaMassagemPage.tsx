import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { criarMassagem, vincularMassagista } from '../api/massagens';
import { listarUsuarios, type UsuarioGerenciado } from '../api/usuarios';
import type { CriarMassagemDto } from '../types/massagem';
import { Aviso } from '../components/ui/Aviso';
import { Botao } from '../components/ui/Botao';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '@mdi/react';
import { mdiArrowLeft, mdiClock, mdiContentSave, mdiCurrencyBrl } from '@mdi/js';
import { YoutubeThumbnail } from '../components/massagens/YoutubeThumbnail';

export function NovaMassagemPage() {
    const { eAdmin } = useAuth();
    const navigate = useNavigate();
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [duracaoMinutos, setDuracaoMinutos] = useState('');
    const [valorReais, setValorReais] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [massagistas, setMassagistas] = useState<UsuarioGerenciado[]>([]);
    const [massagistaId, setMassagistaId] = useState('');
    const [erroMassagistas, setErroMassagistas] = useState<string | null>(null);
    const [massagemCriadaId, setMassagemCriadaId] = useState<number | null>(null);
    const [erro, setErro] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        listarUsuarios()
            .then((usuarios) => setMassagistas(
                usuarios.filter((usuario) => usuario.perfis.includes('MASSAGISTA')),
            ))
            .catch(() => setErroMassagistas(
                'Não foi possível carregar os massagistas. Você poderá vinculá-los depois nos detalhes da massagem.',
            ));
    }, []);

    if (!eAdmin) {
        return (
            <Layout>
                <Aviso tipo="erro" mensagem="Acesso negado. Apenas administradores podem cadastrar massagens." />
            </Layout>
        );
    }

    async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        if (massagemCriadaId !== null) return;
        setErro(null);

        const duracao = Number(duracaoMinutos);
        const valor = Number(valorReais.replace(',', '.'));
        if (!Number.isInteger(duracao) || duracao < 1 || !Number.isFinite(valor) || valor < 0) {
            setErro('Informe uma duração válida e um valor igual ou maior que zero.');
            return;
        }

        const dados: CriarMassagemDto = {
            nome: nome.trim(),
            descricao: descricao.trim(),
            duracaoMinutos: duracao,
            valorCentavos: Math.round(valor * 100),
            ...(youtubeUrl.trim() ? { youtubeUrl: youtubeUrl.trim() } : {}),
        };

        setSalvando(true);
        try {
            const criada = await criarMassagem(dados);
            setMassagemCriadaId(criada.id);
            if (massagistaId) {
                try {
                    await vincularMassagista(criada.id, Number(massagistaId));
                } catch (err: unknown) {
                    if (err && typeof err === 'object' && 'response' in err) {
                        const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
                        const mensagem = axiosErr.response?.data?.message;
                        setErro(Array.isArray(mensagem) ? mensagem.join(' ') : mensagem ??
                            'A massagem foi cadastrada, mas não foi possível vincular o massagista.');
                    } else {
                        setErro('A massagem foi cadastrada, mas não foi possível vincular o massagista.');
                    }
                    return;
                }
            }
            navigate(`/massagens/${criada.id}`);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
                const mensagem = axiosErr.response?.data?.message;
                setErro(Array.isArray(mensagem) ? mensagem.join(' ') : mensagem ?? 'Não foi possível cadastrar a massagem.');
            } else {
                setErro('Não foi possível cadastrar a massagem.');
            }
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Layout>
            {erro && <Aviso tipo="erro" mensagem={erro} />}
            {erroMassagistas && <Aviso tipo="info" mensagem={erroMassagistas} />}
            {massagemCriadaId !== null && erro && (
                <p className="created-massage-link">
                    <Link to={`/massagens/${massagemCriadaId}`}>
                        Abrir detalhes da massagem para concluir o vínculo
                    </Link>
                </p>
            )}
            <article className="detail-panel">
                <header className="detail-heading">
                    <div className="detail-title-row">
                        <Link className="detail-back-link" to="/massagens" aria-label="Voltar para massagens">
                            <Icon path={mdiArrowLeft} size="1.25rem" className="back-icon" />
                        </Link>
                        <span className="eyebrow">Nova massagem</span>
                    </div>
                    <h1>Cadastrar uma experiência</h1>
                    <p className="detail-description">
                        Preencha as informações para adicionar uma massagem ao catálogo.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="form-field">
                        <label htmlFor="nome">Nome</label>
                        <input
                            id="nome"
                            type="text"
                            maxLength={100}
                            value={nome}
                            onChange={(evento) => setNome(evento.target.value)}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="descricao">Descrição</label>
                        <textarea
                            id="descricao"
                            maxLength={2000}
                            rows={4}
                            value={descricao}
                            onChange={(evento) => setDescricao(evento.target.value)}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="youtubeUrl">Link do YouTube (opcional)</label>
                        <input
                            id="youtubeUrl"
                            type="url"
                            maxLength={500}
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={youtubeUrl}
                            onChange={(evento) => setYoutubeUrl(evento.target.value)}
                        />
                        <p className="field-hint">O vídeo será exibido na miniatura do catálogo e nos detalhes da massagem.</p>
                        {youtubeUrl && (
                            <YoutubeThumbnail url={youtubeUrl} alt="Prévia do vídeo de apresentação" />
                        )}
                    </div>

                    <div className="form-field">
                        <label htmlFor="massagistaResponsavel">Massagista responsável (opcional)</label>
                        <select
                            id="massagistaResponsavel"
                            value={massagistaId}
                            onChange={(evento) => setMassagistaId(evento.target.value)}
                            disabled={massagistas.length === 0}
                        >
                            <option value="">Definir depois</option>
                            {massagistas.map((massagista) => (
                                <option key={massagista.id} value={massagista.id}>
                                    {massagista.nome} — {massagista.email}
                                </option>
                            ))}
                        </select>
                        <p className="field-hint">
                            Apenas usuários com o perfil Massagista podem ser selecionados.
                        </p>
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="duracaoMinutos">Duração (minutos)</label>
                            <div className="input-with-icon">
                                <Icon path={mdiClock} size="1.25rem" className="input-icon" />
                                <input
                                    id="duracaoMinutos"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={duracaoMinutos}
                                    onChange={(evento) => setDuracaoMinutos(evento.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label htmlFor="valorReais">Valor (R$)</label>
                            <div className="input-with-icon">
                                <Icon path={mdiCurrencyBrl} size="1.25rem" className="input-icon" />
                                <input
                                    id="valorReais"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={valorReais}
                                    onChange={(evento) => setValorReais(evento.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Botao type="button" variante="secundario" onClick={() => navigate('/massagens')}>
                            Cancelar
                        </Botao>
                        <Botao type="submit" disabled={salvando || massagemCriadaId !== null}>
                            <Icon path={mdiContentSave} size="1rem" className="btn-icon" />
                            {salvando ? 'Salvando...' : massagemCriadaId !== null ? 'Massagem cadastrada' : 'Cadastrar massagem'}
                        </Botao>
                    </div>
                </form>
            </article>
        </Layout>
    );
}

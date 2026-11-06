import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    buscarMassagem,
    atualizarMassagem,
    listarMateriais,
    substituirMateriaisMassagem,
} from '../api/massagens';
import type { Massagem, AtualizarMassagemDto, Material, MaterialMassagemDto } from '../types/massagem';
import { Layout } from '../components/layout/Layout';
import { Carregando } from '../components/ui/Carregando';
import { Aviso } from '../components/ui/Aviso';
import { Botao } from '../components/ui/Botao';
import { ToastSucesso } from '../components/ui/ToastSucesso';
import { YoutubeThumbnail } from '../components/massagens/YoutubeThumbnail';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '@mdi/react';
import { mdiArrowLeft, mdiContentSave, mdiClose, mdiClock, mdiCurrencyUsd, mdiPlus, mdiDeleteOutline } from '@mdi/js';

export function EditarMassagemPage() {
    const { id } = useParams<{ id: string }>();
    const { eAdmin } = useAuth();
    const navigate = useNavigate();

    const [massagem, setMassagem] = useState<Massagem | null>(null);
    const [materiais, setMateriais] = useState<Material[]>([]);
    const [fichaMateriais, setFichaMateriais] = useState<MaterialMassagemDto[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);
    const [salvandoMateriais, setSalvandoMateriais] = useState(false);
    const [notificacao, setNotificacao] = useState<{ id: number; mensagem: string } | null>(null);
    const proximoIdNotificacao = useRef(0);

    const [formData, setFormData] = useState<AtualizarMassagemDto>({
        nome: '',
        descricao: '',
        duracaoMinutos: 0,
        valorCentavos: 0,
        youtubeUrl: '',
    });

    useEffect(() => {
        if (!eAdmin) return;

        async function buscar() {
            if (!id) return;

            try {
                const [dados, catalogoMateriais] = await Promise.all([
                    buscarMassagem(parseInt(id, 10)),
                    listarMateriais(),
                ]);
                setMassagem(dados);
                setMateriais(catalogoMateriais);
                setFichaMateriais(dados.materiais.map(({ material, quantidade, unidade }) => ({
                    materialId: material.id,
                    quantidade,
                    unidade,
                })));
                setFormData({
                    nome: dados.nome,
                    descricao: dados.descricao,
                    duracaoMinutos: dados.duracaoMinutos,
                    valorCentavos: dados.valorCentavos,
                    youtubeUrl: dados.youtubeUrl ?? '',
                });
            } catch (err: unknown) {
                if (err && typeof err === 'object' && 'response' in err) {
                    const axiosErr = err as { response?: { status?: number } };
                    if (axiosErr.response?.status === 404) {
                        setErro('Massagem não encontrada.');
                    } else {
                        setErro('Erro ao carregar a massagem.');
                    }
                } else {
                    setErro('Erro ao carregar a massagem.');
                }
            } finally {
                setCarregando(false);
            }
        }

        buscar();
    }, [id, eAdmin]);

    if (!eAdmin) {
        return (
            <Layout>
                <Aviso tipo="erro" mensagem="Acesso negado. Apenas administradores podem editar massagens." />
            </Layout>
        );
    }

    function handleChange(campo: keyof AtualizarMassagemDto, valor: string | number) {
        setFormData((prev) => ({ ...prev, [campo]: valor }));
    }

    async function handleSubmit(evento: React.FormEvent) {
        evento.preventDefault();
        if (!id) return;

        setErro(null);
        setSalvando(true);

        try {
            const atualizada = await atualizarMassagem(parseInt(id, 10), formData);
            setMassagem(atualizada);
            setNotificacao({
                id: ++proximoIdNotificacao.current,
                mensagem: 'Massagem salva com sucesso.',
            });
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string } } };
                setErro(axiosErr.response?.data?.message ?? 'Erro ao atualizar a massagem.');
            } else {
                setErro('Erro ao atualizar a massagem.');
            }
        } finally {
            setSalvando(false);
        }
    }

    function atualizarItemMaterial(
        indice: number,
        campo: keyof MaterialMassagemDto,
        valor: number | string,
    ) {
        setFichaMateriais((atuais) => atuais.map((item, index) =>
            index === indice ? { ...item, [campo]: valor } : item,
        ));
    }

    function adicionarMaterial() {
        const materialDisponivel = materiais.find((material) =>
            material.ativo && !fichaMateriais.some((item) => item.materialId === material.id),
        );

        setFichaMateriais((atuais) => [
            ...atuais,
            { materialId: materialDisponivel?.id ?? 0, quantidade: 1, unidade: '' },
        ]);
    }

    async function handleSalvarMateriais(evento: React.FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        if (!id) return;

        if (fichaMateriais.some((item) =>
            !Number.isInteger(item.materialId) || item.materialId < 1 ||
            !Number.isInteger(item.quantidade) || item.quantidade < 1 ||
            !item.unidade.trim() || item.unidade.trim().length > 30,
        )) {
            setErro('Selecione um material e informe quantidade e unidade válidas para cada item.');
            return;
        }

        const ids = fichaMateriais.map((item) => item.materialId);
        if (new Set(ids).size !== ids.length) {
            setErro('Cada material só pode aparecer uma vez na ficha.');
            return;
        }

        setErro(null);
        setSalvandoMateriais(true);
        try {
            const atualizada = await substituirMateriaisMassagem(
                parseInt(id, 10),
                fichaMateriais.map((item) => ({ ...item, unidade: item.unidade.trim() })),
            );
            setMassagem(atualizada);
            setFichaMateriais(atualizada.materiais.map(({ material, quantidade, unidade }) => ({
                materialId: material.id,
                quantidade,
                unidade,
            })));
            setNotificacao({
                id: ++proximoIdNotificacao.current,
                mensagem: 'Materiais salvos com sucesso.',
            });
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
                const mensagem = axiosErr.response?.data?.message;
                setErro(Array.isArray(mensagem) ? mensagem.join(' ') : mensagem ?? 'Não foi possível salvar a ficha de materiais.');
            } else {
                setErro('Não foi possível salvar a ficha de materiais.');
            }
        } finally {
            setSalvandoMateriais(false);
        }
    }

    if (carregando) {
        return <Layout><Carregando /></Layout>;
    }

    if (erro && !massagem) {
        return <Layout><Aviso tipo="erro" mensagem={erro} /></Layout>;
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
            {erro && <Aviso tipo="erro" mensagem={erro} />}

            <article className="detail-panel">
                <div className="detail-heading">
                    <div className="detail-title-row">
                        <Link className="detail-back-link detail-back-link--prominent" to="/massagens">
                            <Icon path={mdiArrowLeft} size="1.25rem" className="back-icon" />
                            <span>Voltar</span>
                        </Link>
                        <span className="eyebrow">Editar massagem</span>
                    </div>
                    <div>
                        <h1>Massagem</h1>
                        <p>Gerencie as informações das massagens.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="form-field">
                        <label htmlFor="nome">Nome</label>
                        <input
                            id="nome"
                            type="text"
                            value={formData.nome}
                            onChange={(e) => handleChange('nome', e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="descricao">Descrição</label>
                        <textarea
                            id="descricao"
                            value={formData.descricao}
                            onChange={(e) => handleChange('descricao', e.target.value)}
                            rows={4}
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
                            value={formData.youtubeUrl ?? ''}
                            onChange={(evento) => handleChange('youtubeUrl', evento.target.value)}
                        />
                        <p className="field-hint">Deixe vazio para remover o vídeo da massagem.</p>
                        {formData.youtubeUrl && (
                            <YoutubeThumbnail url={formData.youtubeUrl} alt="Prévia do vídeo de apresentação" />
                        )}
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
                                    value={formData.duracaoMinutos}
                                    onChange={(e) => handleChange('duracaoMinutos', parseInt(e.target.value, 10) || 0)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label htmlFor="valorCentavos">Valor (centavos)</label>
                            <div className="input-with-icon">
                                <Icon path={mdiCurrencyUsd} size="1.25rem" className="input-icon" />
                                <input
                                    id="valorCentavos"
                                    type="number"
                                    min="0"
                                    value={formData.valorCentavos}
                                    onChange={(e) => handleChange('valorCentavos', parseInt(e.target.value, 10) || 0)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Botao
                            type="button"
                            variante="secundario"
                            onClick={() => navigate('/massagens')}
                        >
                            <Icon path={mdiClose} size="1rem" className="btn-icon" />
                            Cancelar
                        </Botao>
                        <Botao type="submit" disabled={salvando}>
                            <Icon path={mdiContentSave} size="1rem" className="btn-icon" />
                            {salvando ? 'Salvando...' : 'Salvar alterações'}
                        </Botao>
                    </div>
                </form>

                <section className="massage-materials-editor">
                    <div className="materials-list-heading">
                        <div>
                            <span className="eyebrow">Composição</span>
                            <h2>Materiais desta massagem</h2>
                            <p>Defina materiais ativos, quantidades e unidades utilizadas.</p>
                        </div>
                        <Botao
                            type="button"
                            variante="secundario"
                            onClick={adicionarMaterial}
                            disabled={!materiais.some((material) =>
                                material.ativo && !fichaMateriais.some((item) => item.materialId === material.id),
                            )}
                        >
                            <Icon path={mdiPlus} size="1rem" className="btn-icon" />
                            Adicionar item
                        </Botao>
                    </div>

                    {materiais.length === 0 && (
                        <Aviso tipo="info" mensagem="Cadastre materiais ativos na área Materiais antes de adicioná-los à ficha." />
                    )}

                    <form onSubmit={handleSalvarMateriais} className="materials-assignment-form">
                        {fichaMateriais.map((item, indice) => (
                            <div className="material-assignment-row" key={`${item.materialId}-${indice}`}>
                                <div className="form-field">
                                    <label htmlFor={`material-${indice}`}>Material</label>
                                    <select
                                        id={`material-${indice}`}
                                        value={item.materialId || ''}
                                        onChange={(evento) => atualizarItemMaterial(indice, 'materialId', Number(evento.target.value))}
                                        required
                                    >
                                        <option value="" disabled>Selecione um material</option>
                                        {materiais.map((material) => {
                                            const usadoEmOutroItem = fichaMateriais.some((outro, outroIndice) =>
                                                outroIndice !== indice && outro.materialId === material.id,
                                            );
                                            const selecionadoInativo = item.materialId === material.id && !material.ativo;
                                            return (
                                                <option
                                                    key={material.id}
                                                    value={material.id}
                                                    disabled={usadoEmOutroItem || (!material.ativo && !selecionadoInativo)}
                                                >
                                                    {material.nome}{material.ativo ? '' : ' (arquivado)'}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="form-field">
                                    <label htmlFor={`quantidade-${indice}`}>Quantidade</label>
                                    <input
                                        id={`quantidade-${indice}`}
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={item.quantidade}
                                        onChange={(evento) => atualizarItemMaterial(indice, 'quantidade', Number(evento.target.value))}
                                        required
                                    />
                                </div>
                                <div className="form-field">
                                    <label htmlFor={`unidade-${indice}`}>Unidade</label>
                                    <input
                                        id={`unidade-${indice}`}
                                        type="text"
                                        maxLength={30}
                                        placeholder="Ex.: ml, unidade"
                                        value={item.unidade}
                                        onChange={(evento) => atualizarItemMaterial(indice, 'unidade', evento.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="remove-material-button"
                                    aria-label="Remover material da ficha"
                                    onClick={() => setFichaMateriais((atuais) => atuais.filter((_, index) => index !== indice))}
                                >
                                    <Icon path={mdiDeleteOutline} size="1.1rem" className="btn-icon" />
                                </button>
                            </div>
                        ))}

                        <div className="form-actions">
                            <Botao type="submit" disabled={salvandoMateriais || !massagem}>
                                <Icon path={mdiContentSave} size="1rem" className="btn-icon" />
                                {salvandoMateriais ? 'Salvando ficha...' : 'Salvar materiais'}
                            </Botao>
                        </div>
                    </form>
                </section>
            </article>
        </Layout>
    );
}
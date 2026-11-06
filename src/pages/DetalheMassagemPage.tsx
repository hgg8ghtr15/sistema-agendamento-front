import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { buscarMassagem } from '../api/massagens';
import type { Massagem } from '../types/massagem';
import { Layout } from '../components/layout/Layout';
import { Carregando } from '../components/ui/Carregando';
import { Aviso } from '../components/ui/Aviso';
import { formatarMoeda } from '../utils/formatarMoeda';
import { formatarDuracao } from '../utils/formatarDuracao';
import { obterYoutubeEmbedUrl } from '../utils/youtube';
import { Icon } from '@mdi/react';
import { mdiArrowLeft, mdiClock, mdiCurrencyUsd, mdiAccountGroup } from '@mdi/js';

export function DetalheMassagemPage() {
    // useParams extrai os parâmetros da URL
    // Para a rota /massagens/:id, retorna { id: "5" } (sempre string na URL)
    const { id } = useParams<{ id: string }>();

    const [massagem, setMassagem] = useState<Massagem | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        async function buscar() {
            if (!id) return;

            try {
                // Converte a string "5" para o número 5 com parseInt
                const dados = await buscarMassagem(parseInt(id, 10));
                setMassagem(dados);
            } catch (err: unknown) {
                if (err && typeof err === 'object' && 'response' in err) {
                    const axiosErr = err as { response?: { status?: number } };
                    if (axiosErr.response?.status === 404) {
                        setErro('Massagem não encontrada.');
                    } else {
                        setErro('Erro ao carregar os detalhes da massagem.');
                    }
                } else {
                    setErro('Erro ao carregar os detalhes da massagem.');
                }
            } finally {
                setCarregando(false);
            }
        }

        buscar();
    }, [id]); // O efeito roda novamente se o `id` da URL mudar

    const youtubeEmbedUrl = massagem?.youtubeUrl
        ? obterYoutubeEmbedUrl(massagem.youtubeUrl)
        : null;

    return (
        <Layout>
            {carregando && <Carregando />}
            {erro && <Aviso tipo="erro" mensagem={erro} />}

            {massagem && (
                <article className="detail-panel">
                    <div className="detail-heading">
                        <div className="detail-title-row">
                            <Link className="detail-back-link detail-back-link--prominent" to="/massagens">
                                <Icon path={mdiArrowLeft} size="1.25rem" className="back-icon" />
                                <span>Voltar</span>
                            </Link>
                            <span className="eyebrow">Detalhes da experiência</span>
                        </div>
                        <h1>{massagem.nome}</h1>
                        <p className="detail-description">{massagem.descricao}</p>
                    </div>

                    {youtubeEmbedUrl && (
                        <section className="detail-video-section" aria-label="Vídeo de apresentação">
                            <h2>Conheça esta massagem</h2>
                            <div className="youtube-embed">
                                <iframe
                                    src={youtubeEmbedUrl}
                                    title={`Vídeo de apresentação de ${massagem.nome}`}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                />
                            </div>
                        </section>
                    )}

                    <div className="detail-stats">
                        <div className="detail-stat">
                            <strong>Duração</strong>
                            <span>
                                <Icon path={mdiClock} size="1rem" className="stat-icon" />
                                {formatarDuracao(massagem.duracaoMinutos)}
                            </span>
                        </div>
                        <div className="detail-stat">
                            <strong>Investimento</strong>
                            <span>
                                <Icon path={mdiCurrencyUsd} size="1rem" className="stat-icon" />
                                {formatarMoeda(massagem.valorCentavos)}
                            </span>
                        </div>
                    </div>

                    <div className="detail-sections">
                        {massagem.materiais.length > 0 && (
                            <section className="detail-section">
                                <h2>Materiais utilizados</h2>
                                <ul>
                                    {massagem.materiais.map((item) => (
                                        <li key={item.material.id}>
                                            <Icon path={mdiAccountGroup} size="1rem" className="section-icon" />
                                            {item.material.nome} — {item.quantidade} {item.unidade}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {massagem.massagistas.length > 0 && (
                            <section className="detail-section">
                                <h2>Massagistas</h2>
                                <ul>
                                    {massagem.massagistas.map((vinculo) => (
                                        <li key={vinculo.usuario.id}>
                                            <Icon path={mdiAccountGroup} size="1rem" className="section-icon" />
                                            {vinculo.usuario.nome}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </article>
            )}
        </Layout>
    );
}
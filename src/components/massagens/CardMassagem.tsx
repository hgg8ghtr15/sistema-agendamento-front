import { Link } from 'react-router-dom';
import type { Massagem } from '../../types/massagem';
import { formatarMoeda } from '../../utils/formatarMoeda';
import { formatarDuracao } from '../../utils/formatarDuracao';
import { YoutubeThumbnail } from './YoutubeThumbnail';
import { useAuth } from '../../hooks/useAuth';
import { Icon } from '@mdi/react';
import { mdiEye, mdiPencil, mdiClock, mdiCurrencyUsd, mdiAccountGroup } from '@mdi/js';

interface CardMassagemProps {
    massagem: Massagem;
}

export function CardMassagem({ massagem }: CardMassagemProps) {
    const { eAdmin } = useAuth();

    return (
        <article className="massage-card">
            {/* <span className="massage-card-mark" aria-hidden="true">✦</span> */}
            <h2>{massagem.nome}</h2>

            <p className="massage-card-description">
                {massagem.descricao}
            </p>

            {massagem.youtubeUrl && (
                <Link
                    to={`/massagens/${massagem.id}`}
                    className="massage-card-video"
                    aria-label={`Assistir apresentação de ${massagem.nome}`}
                >
                    <YoutubeThumbnail url={massagem.youtubeUrl} alt={`Vídeo de apresentação de ${massagem.nome}`} />
                </Link>
            )}

            <div className="massage-meta">
                <span className="meta-item">
                    <Icon path={mdiClock} size="1rem" className="meta-icon" />
                    {formatarDuracao(massagem.duracaoMinutos)}
                </span>
                <span className="meta-item">
                    <Icon path={mdiCurrencyUsd} size="1rem" className="meta-icon" />
                    {formatarMoeda(massagem.valorCentavos)}
                </span>
                <span className="meta-item">
                    <Icon path={mdiAccountGroup} size="1rem" className="meta-icon" />
                    {massagem.massagistas.length} massagista(s)
                </span>
            </div>

            <div className="massage-card-actions">
                <Link
                    to={`/massagens/${massagem.id}`}
                    className="massage-card-link"
                >
                    <Icon path={mdiEye} size="1rem" className="link-icon" />
                    Visualizar
                </Link>
                {eAdmin && (
                    <Link
                        to={`/massagens/${massagem.id}/editar`}
                        className="massage-card-link massage-card-link--edit"
                    >
                        <Icon path={mdiPencil} size="1rem" className="link-icon" />
                        Editar
                    </Link>
                )}
            </div>
        </article>
    );
}
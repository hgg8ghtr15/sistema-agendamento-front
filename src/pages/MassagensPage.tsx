
import { useMassagens } from '../hooks/useMassagens';
import { CardMassagem } from '../components/massagens/CardMassagem';
import { Carregando } from '../components/ui/Carregando';
import { Aviso } from '../components/ui/Aviso';
import { Layout } from '../components/layout/Layout';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '@mdi/react';
import { mdiPlus } from '@mdi/js';

export function MassagensPage() {
    // O hook encapsula toda a lógica de busca
    const { massagens, carregando, erro } = useMassagens();
    const { eAdmin } = useAuth();

    return (
        <Layout>
            <div className="massages-page-heading">
                <section className="page-intro">
                    <span className="eyebrow">Um momento para você</span>
                    <h1>Seu bem-estar começa com uma pausa.</h1>
                    <p>
                        Descubra experiências de cuidado pensadas para desacelerar,
                        aliviar tensões e renovar as energias.
                    </p>
                </section>
                {eAdmin && (
                    <Link to="/massagens/nova" className="button button--primary new-massage-button">
                        <Icon path={mdiPlus} size="1rem" className="btn-icon" />
                        Adicionar massagem
                    </Link>
                )}
            </div>

            {/* Renderização condicional: exibe estados diferentes conforme a situação */}
            {carregando && <Carregando />}

            {erro && <Aviso tipo="erro" mensagem={erro} />}

            {!carregando && !erro && massagens.length === 0 && (
                <Aviso tipo="info" mensagem="Nenhuma massagem disponível no momento." />
            )}

            {/* Renderiza um CardMassagem para cada item da lista */}
            {/* O `key` é obrigatório quando o React renderiza uma lista;
          ele ajuda o React a identificar quais itens mudaram, foram adicionados ou removidos */}
            <div className="massage-grid">
                {massagens.map((massagem) => (
                    <CardMassagem key={massagem.id} massagem={massagem} />
                ))}
            </div>
        </Layout>
    );
}
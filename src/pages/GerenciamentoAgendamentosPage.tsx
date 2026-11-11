import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
    cancelarAgendamento,
    confirmarAgendamento,
    consultarHorariosLivres,
    consultarOpcoesFiltro,
    detalharAgendamento,
    listarAgendamentos,
    listarSolicitacoesReagendamento,
    reagendarAgendamento,
    responderSolicitacaoReagendamento,
} from '../api/agendamentos';
import { Aviso } from '../components/ui/Aviso';
import { Botao } from '../components/ui/Botao';
import { Carregando } from '../components/ui/Carregando';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import type {
    Agendamento,
    AgendamentoDetalhado,
    HistoricoAgendamento,
    HorarioLivre,
    OpcoesFiltroAgendamento,
    RespostaListaAgendamentos,
    SolicitacaoReagendamento,
    StatusAgendamento,
} from '../types/agendamento';

const FUSO_HORARIO = 'America/Cuiaba';
const TAMANHO_PAGINA = 100;

type Visualizacao = 'dia' | 'semana' | 'lista';
type AcaoAgendamento = 'confirmar' | 'reagendar' | 'cancelar';
type ModalGestao =
    | { tipo: 'agendamento'; acao: AcaoAgendamento; agendamento: Agendamento }
    | { tipo: 'solicitacao'; solicitacao: SolicitacaoReagendamento; aprovar: boolean }
    | { tipo: 'historico'; agendamentoId: number }
    | null;

const nomesStatus: Record<StatusAgendamento, string> = {
    PENDENTE: 'Pendente',
    CONFIRMADO: 'Confirmado',
    REAGENDAMENTO_SOLICITADO: 'Reagendamento solicitado',
    REAGENDADO: 'Reagendado',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
    NAO_COMPARECEU: 'Não compareceu',
};

const opcoesStatus: StatusAgendamento[] = [
    'PENDENTE',
    'CONFIRMADO',
    'REAGENDAMENTO_SOLICITADO',
    'REAGENDADO',
    'CONCLUIDO',
    'CANCELADO',
    'NAO_COMPARECEU',
];

function erroDaApi(erro: unknown, mensagemPadrao: string): string {
    if (erro && typeof erro === 'object' && 'response' in erro) {
        const erroAxios = erro as {
            response?: { data?: { message?: unknown } | string };
        };
        const resposta = erroAxios.response?.data;
        const mensagem = typeof resposta === 'string' ? resposta : resposta?.message;
        if (Array.isArray(mensagem)) {
            return mensagem.filter((item): item is string => typeof item === 'string').join(' ');
        }
        if (typeof mensagem === 'string' && mensagem.trim()) return mensagem;
    }
    return mensagemPadrao;
}

function obterDataLocal(valor: string | Date): string {
    const data = valor instanceof Date ? valor : new Date(valor);
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: FUSO_HORARIO,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(data);
    const campos = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
    return `${campos.year}-${campos.month}-${campos.day}`;
}

function dataAtual(): string {
    return obterDataLocal(new Date());
}

function adicionarDias(data: string, dias: number): string {
    const dataUtc = new Date(`${data}T00:00:00.000Z`);
    dataUtc.setUTCDate(dataUtc.getUTCDate() + dias);
    return dataUtc.toISOString().slice(0, 10);
}

function datasDaSemana(data: string): string[] {
    const diaDaSemana = new Date(`${data}T00:00:00.000Z`).getUTCDay();
    const deslocamentoAteSegunda = (diaDaSemana + 6) % 7;
    const segunda = adicionarDias(data, -deslocamentoAteSegunda);
    return Array.from({ length: 7 }, (_, indice) => adicionarDias(segunda, indice));
}

function formatarData(valor: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: FUSO_HORARIO,
        dateStyle: 'full',
    }).format(new Date(`${valor}T12:00:00.000Z`));
}

function formatarDataHora(valor: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: FUSO_HORARIO,
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(valor));
}

function formatarHora(valor: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: FUSO_HORARIO,
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(valor));
}

async function listarTodasAsPaginas(
    filtros: Parameters<typeof listarAgendamentos>[0],
): Promise<Agendamento[]> {
    const resultados: Agendamento[] = [];
    let pagina = 1;
    let temMais = true;
    while (temMais) {
        const resposta: RespostaListaAgendamentos = await listarAgendamentos({
            ...filtros,
            page: pagina,
            limit: TAMANHO_PAGINA,
        });
        resultados.push(...resposta.data);
        temMais = resposta.pagination.hasMore;
        pagina = resposta.pagination.page + 1;
    }
    return resultados;
}

async function listarTodasSolicitacoesPendentes(): Promise<SolicitacaoReagendamento[]> {
    const solicitacoes: SolicitacaoReagendamento[] = [];
    let pagina = 1;
    let temMais = true;
    while (temMais) {
        const resposta = await listarSolicitacoesReagendamento({
            status: 'PENDENTE',
            page: pagina,
            limit: TAMANHO_PAGINA,
        });
        solicitacoes.push(...resposta.data);
        temMais = resposta.pagination.hasMore;
        pagina = resposta.pagination.page + 1;
    }
    return solicitacoes;
}

function HistoricoItem({ item }: { item: HistoricoAgendamento }) {
    return (
        <article className="manager-history-item">
            <div className="manager-history-item__heading">
                <strong>{item.acao.replaceAll('_', ' ')}</strong>
                <time dateTime={item.createdAt}>{formatarDataHora(item.createdAt)}</time>
            </div>
            <p>Registrado por {item.autor.nome}</p>
            {(item.valoresAnteriores || item.valoresNovos) && (
                <details>
                    <summary>Ver alterações</summary>
                    <div className="manager-history-values">
                        {item.valoresAnteriores && (
                            <div>
                                <strong>Antes</strong>
                                <pre>{JSON.stringify(item.valoresAnteriores, null, 2)}</pre>
                            </div>
                        )}
                        {item.valoresNovos && (
                            <div>
                                <strong>Depois</strong>
                                <pre>{JSON.stringify(item.valoresNovos, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                </details>
            )}
        </article>
    );
}

function CartaoAgendamento({
    agendamento,
    onAcao,
    onHistorico,
}: {
    agendamento: Agendamento;
    onAcao: (acao: AcaoAgendamento, agendamento: Agendamento) => void;
    onHistorico: (id: number) => void;
}) {
    const podeConfirmar = agendamento.status === 'PENDENTE';
    const podeReagendar = ['PENDENTE', 'CONFIRMADO', 'REAGENDADO'].includes(agendamento.status);
    const podeCancelar = ['PENDENTE', 'CONFIRMADO', 'REAGENDAMENTO_SOLICITADO', 'REAGENDADO']
        .includes(agendamento.status);

    return (
        <article className={`manager-appointment manager-appointment--${agendamento.status.toLowerCase()}`}>
            <div className="manager-appointment__heading">
                <time dateTime={agendamento.dataHora}>{formatarHora(agendamento.dataHora)}</time>
                <span className={`manager-status manager-status--${agendamento.status.toLowerCase()}`}>
                    {nomesStatus[agendamento.status]}
                </span>
            </div>
            <h3>{agendamento.massagem?.nome ?? 'Massagem indisponível'}</h3>
            <dl className="manager-appointment__people">
                <div>
                    <dt>Cliente</dt>
                    <dd>{agendamento.usuario?.nome ?? `#${agendamento.usuarioId}`}</dd>
                </div>
                <div>
                    <dt>Massagista</dt>
                    <dd>{agendamento.massagista?.nome ?? 'Não definido'}</dd>
                </div>
            </dl>
            <div className="manager-appointment__actions">
                {podeConfirmar && (
                    <Botao
                        type="button"
                        onClick={() => onAcao('confirmar', agendamento)}
                    >
                        Confirmar
                    </Botao>
                )}
                {podeReagendar && (
                    <Botao
                        type="button"
                        variante="secundario"
                        onClick={() => onAcao('reagendar', agendamento)}
                    >
                        Reagendar
                    </Botao>
                )}
                {podeCancelar && (
                    <Botao
                        type="button"
                        variante="perigo"
                        onClick={() => onAcao('cancelar', agendamento)}
                    >
                        Cancelar
                    </Botao>
                )}
                <Botao
                    type="button"
                    variante="secundario"
                    onClick={() => onHistorico(agendamento.id)}
                >
                    Histórico
                </Botao>
            </div>
        </article>
    );
}

export function GerenciamentoAgendamentosPage() {
    const { sessao } = useAuth();
    const perfis = sessao?.usuario.perfis ?? [];
    const eGestor = perfis.includes('ADMIN') || perfis.includes('ADMINISTRATIVO');

    const [opcoes, setOpcoes] = useState<OpcoesFiltroAgendamento>({
        clientes: [],
        massagistas: [],
    });
    const [data, setData] = useState(dataAtual);
    const [visualizacao, setVisualizacao] = useState<Visualizacao>('dia');
    const [massagistaFiltro, setMassagistaFiltro] = useState('');
    const [clienteFiltro, setClienteFiltro] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('');
    const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoReagendamento[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [carregandoSolicitacoes, setCarregandoSolicitacoes] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);
    const [versao, setVersao] = useState(0);

    const [modal, setModal] = useState<ModalGestao>(null);
    const [salvando, setSalvando] = useState(false);
    const [motivoCancelamento, setMotivoCancelamento] = useState('');
    const [dataReagendamento, setDataReagendamento] = useState(dataAtual);
    const [horariosReagendamento, setHorariosReagendamento] = useState<HorarioLivre[]>([]);
    const [horarioReagendamento, setHorarioReagendamento] = useState('');
    const [carregandoHorarios, setCarregandoHorarios] = useState(false);
    const [detalhes, setDetalhes] = useState<AgendamentoDetalhado | null>(null);
    const [carregandoHistorico, setCarregandoHistorico] = useState(false);

    const datasVisiveis = useMemo(
        () => visualizacao === 'semana' ? datasDaSemana(data) : [data],
        [data, visualizacao],
    );

    useEffect(() => {
        let ativo = true;
        if (!eGestor) {
            return () => { ativo = false; };
        }

        async function carregarOpcoesESolicitacoes() {
            try {
                const [opcoesFiltro, pendentes] = await Promise.all([
                    consultarOpcoesFiltro(),
                    listarTodasSolicitacoesPendentes(),
                ]);
                if (!ativo) return;
                setOpcoes(opcoesFiltro);
                setSolicitacoes(pendentes);
            } catch (erroApi: unknown) {
                if (ativo) {
                    setErro(erroDaApi(erroApi, 'Não foi possível carregar as opções e solicitações.'));
                }
            } finally {
                if (ativo) setCarregandoSolicitacoes(false);
            }
        }

        void carregarOpcoesESolicitacoes();
        return () => { ativo = false; };
    }, [eGestor, versao]);

    useEffect(() => {
        let ativo = true;
        if (!eGestor) return () => { ativo = false; };

        async function carregarAgendamentos() {
            const filtrosBase = {
                ...(massagistaFiltro ? { massagistaId: Number(massagistaFiltro) } : {}),
                ...(clienteFiltro ? { clienteId: Number(clienteFiltro) } : {}),
                ...(statusFiltro ? { status: statusFiltro as StatusAgendamento } : {}),
            };
            try {
                const resultadosPorData = await Promise.all(
                    datasVisiveis.map((dia) =>
                        listarTodasAsPaginas({ ...filtrosBase, data: dia }),
                    ),
                );
                if (!ativo) return;
                const unicos = new Map<number, Agendamento>();
                for (const agendamento of resultadosPorData.flat()) {
                    unicos.set(agendamento.id, agendamento);
                }
                setAgendamentos(
                    [...unicos.values()].sort(
                        (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime(),
                    ),
                );
            } catch (erroApi: unknown) {
                if (ativo) {
                    setErro(erroDaApi(erroApi, 'Não foi possível carregar os agendamentos.'));
                }
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        void carregarAgendamentos();
        return () => { ativo = false; };
    }, [clienteFiltro, data, datasVisiveis, eGestor, massagistaFiltro, statusFiltro, versao]);

    const agendamentoDoModal = modal?.tipo === 'agendamento' ? modal.agendamento : null;
    useEffect(() => {
        let ativo = true;
        if (
            modal?.tipo !== 'agendamento' ||
            modal.acao !== 'reagendar' ||
            !agendamentoDoModal?.massagemId ||
            !agendamentoDoModal.massagistaId
        ) {
            return () => { ativo = false; };
        }

        consultarHorariosLivres(
            agendamentoDoModal.massagemId,
            dataReagendamento,
            agendamentoDoModal.massagistaId,
        ).then((resposta) => {
            if (ativo) setHorariosReagendamento(resposta.horarios);
        }).catch((erroApi: unknown) => {
            if (ativo) {
                setErro(erroDaApi(erroApi, 'Não foi possível consultar os horários disponíveis.'));
            }
        }).finally(() => {
            if (ativo) setCarregandoHorarios(false);
        });

        return () => { ativo = false; };
    }, [agendamentoDoModal, dataReagendamento, modal]);

    useEffect(() => {
        let ativo = true;
        if (modal?.tipo !== 'historico') {
            return () => { ativo = false; };
        }

        detalharAgendamento(modal.agendamentoId).then((resposta) => {
            if (ativo) setDetalhes(resposta);
        }).catch((erroApi: unknown) => {
            if (ativo) setErro(erroDaApi(erroApi, 'Não foi possível carregar o histórico.'));
        }).finally(() => {
            if (ativo) setCarregandoHistorico(false);
        });

        return () => { ativo = false; };
    }, [modal]);

    function atualizarFiltros() {
        setErro(null);
        setCarregando(true);
    }

    function abrirAcao(acao: AcaoAgendamento, agendamento: Agendamento) {
        setErro(null);
        setSucesso(null);
        setModal({ tipo: 'agendamento', acao, agendamento });
        if (acao === 'cancelar') setMotivoCancelamento('');
        if (acao === 'reagendar') {
            const dataOriginal = obterDataLocal(agendamento.dataHora);
            setDataReagendamento(dataOriginal < dataAtual() ? dataAtual() : dataOriginal);
            setHorariosReagendamento([]);
            setHorarioReagendamento('');
            setCarregandoHorarios(Boolean(agendamento.massagemId && agendamento.massagistaId));
        }
    }

    function abrirRespostaSolicitacao(
        solicitacao: SolicitacaoReagendamento,
        aprovar: boolean,
    ) {
        setErro(null);
        setSucesso(null);
        setModal({ tipo: 'solicitacao', solicitacao, aprovar });
    }

    function abrirHistorico(agendamentoId: number) {
        setErro(null);
        setDetalhes(null);
        setCarregandoHistorico(true);
        setModal({ tipo: 'historico', agendamentoId });
    }

    async function executarAcao(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        if (!modal || modal.tipo === 'historico') return;

        if (
            modal.tipo === 'agendamento' &&
            modal.acao === 'reagendar' &&
            !horarioReagendamento
        ) {
            setErro('Selecione um horário disponível para reagendar.');
            return;
        }

        setErro(null);
        setSucesso(null);
        setSalvando(true);
        try {
            if (modal.tipo === 'solicitacao') {
                await responderSolicitacaoReagendamento(modal.solicitacao.id, {
                    aprovar: modal.aprovar,
                });
                setSucesso(
                    modal.aprovar
                        ? 'Solicitação aprovada e agendamento atualizado.'
                        : 'Solicitação recusada; o status anterior foi restaurado.',
                );
            } else if (modal.acao === 'confirmar') {
                await confirmarAgendamento(modal.agendamento.id);
                setSucesso('Agendamento confirmado.');
            } else if (modal.acao === 'cancelar') {
                await cancelarAgendamento(modal.agendamento.id, {
                    ...(motivoCancelamento.trim()
                        ? { motivo: motivoCancelamento.trim() }
                        : {}),
                });
                setSucesso('Agendamento cancelado.');
            } else {
                await reagendarAgendamento(modal.agendamento.id, {
                    dataHora: horarioReagendamento,
                });
                setSucesso('Agendamento reagendado.');
            }

            setModal(null);
            setCarregando(true);
            setCarregandoSolicitacoes(true);
            setVersao((atual) => atual + 1);
        } catch (erroApi: unknown) {
            setErro(erroDaApi(erroApi, 'Não foi possível concluir a ação.'));
        } finally {
            setSalvando(false);
        }
    }

    function fecharModal() {
        if (salvando) return;
        setModal(null);
    }

    function renderizarAgendamento(agendamento: Agendamento) {
        return (
            <CartaoAgendamento
                key={agendamento.id}
                agendamento={agendamento}
                onAcao={abrirAcao}
                onHistorico={abrirHistorico}
            />
        );
    }

    if (!eGestor) {
        return (
            <Layout>
                <Aviso tipo="erro" mensagem="Acesso negado. Apenas administradores e administrativos podem gerenciar agendamentos." />
            </Layout>
        );
    }

    return (
        <Layout>
            <section className="page-intro">
                <span className="eyebrow">Área de gerenciamento</span>
                <h1>Agenda da clínica</h1>
                <p>Consulte e gerencie os atendimentos, solicitações e alterações de agenda.</p>
            </section>

            {erro && !modal && <Aviso tipo="erro" mensagem={erro} />}
            {sucesso && <Aviso tipo="sucesso" mensagem={sucesso} />}

            <section className="manager-pending-section" aria-labelledby="solicitacoes-pendentes-titulo">
                <div className="manager-section-heading">
                    <div>
                        <span className="eyebrow">Aguardando resposta</span>
                        <h2 id="solicitacoes-pendentes-titulo">
                            Solicitações de reagendamento
                            <span className="manager-pending-count" aria-label={`${solicitacoes.length} pendentes`}>
                                {carregandoSolicitacoes ? '…' : solicitacoes.length}
                            </span>
                        </h2>
                    </div>
                </div>
                {carregandoSolicitacoes ? (
                    <Carregando />
                ) : solicitacoes.length === 0 ? (
                    <Aviso tipo="info" mensagem="Não há solicitações de reagendamento pendentes." />
                ) : (
                    <div className="manager-request-list">
                        {solicitacoes.map((solicitacao) => {
                            const agendamento = solicitacao.agendamento;
                            return (
                                <article className="manager-request-card" key={solicitacao.id}>
                                    <div>
                                        <span className="manager-request-card__label">
                                            {agendamento?.massagem?.nome ?? 'Agendamento'} · #{solicitacao.agendamentoId}
                                        </span>
                                        <h3>{agendamento?.usuario?.nome ?? 'Cliente'}</h3>
                                        <p>
                                            {agendamento
                                                ? `Atual: ${formatarDataHora(agendamento.dataHora)}`
                                                : 'Horário atual indisponível'}
                                        </p>
                                        <p>
                                            Sugerido: <strong>{formatarDataHora(solicitacao.dataHoraSugerida)}</strong>
                                        </p>
                                        {solicitacao.motivo && <p>Motivo: {solicitacao.motivo}</p>}
                                    </div>
                                    <div className="manager-request-card__actions">
                                        <Botao
                                            type="button"
                                            onClick={() => abrirRespostaSolicitacao(solicitacao, true)}
                                        >
                                            Aprovar
                                        </Botao>
                                        <Botao
                                            type="button"
                                            variante="secundario"
                                            onClick={() => abrirRespostaSolicitacao(solicitacao, false)}
                                        >
                                            Recusar
                                        </Botao>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="manager-filters" aria-label="Filtros de agendamento">
                <div className="form-field">
                    <label htmlFor="filtro-data-agenda">Data</label>
                    <input
                        id="filtro-data-agenda"
                        type="date"
                        value={data}
                        onChange={(evento) => {
                            atualizarFiltros();
                            setData(evento.target.value);
                        }}
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="filtro-massagista">Massagista</label>
                    <select
                        id="filtro-massagista"
                        value={massagistaFiltro}
                        onChange={(evento) => {
                            atualizarFiltros();
                            setMassagistaFiltro(evento.target.value);
                        }}
                    >
                        <option value="">Todos os massagistas</option>
                        {opcoes.massagistas.map((item) => (
                            <option key={item.id} value={item.id}>{item.nome}</option>
                        ))}
                    </select>
                </div>
                <div className="form-field">
                    <label htmlFor="filtro-cliente">Cliente</label>
                    <select
                        id="filtro-cliente"
                        value={clienteFiltro}
                        onChange={(evento) => {
                            atualizarFiltros();
                            setClienteFiltro(evento.target.value);
                        }}
                    >
                        <option value="">Todos os clientes</option>
                        {opcoes.clientes.map((item) => (
                            <option key={item.id} value={item.id}>{item.nome}</option>
                        ))}
                    </select>
                </div>
                <div className="form-field">
                    <label htmlFor="filtro-status-agenda">Status</label>
                    <select
                        id="filtro-status-agenda"
                        value={statusFiltro}
                        onChange={(evento) => {
                            atualizarFiltros();
                            setStatusFiltro(evento.target.value);
                        }}
                    >
                        <option value="">Todos os status</option>
                        {opcoesStatus.map((status) => (
                            <option key={status} value={status}>{nomesStatus[status]}</option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="manager-calendar-section" aria-labelledby="calendario-agendamentos-titulo">
                <div className="manager-calendar-toolbar">
                    <div>
                        <span className="eyebrow">Agenda</span>
                        <h2 id="calendario-agendamentos-titulo">
                            {visualizacao === 'semana' ? 'Semana selecionada' : formatarData(data)}
                        </h2>
                    </div>
                    <div className="manager-view-switch" role="group" aria-label="Visualização da agenda">
                        {(['dia', 'semana', 'lista'] as const).map((modo) => (
                            <button
                                key={modo}
                                type="button"
                                className={`manager-view-button ${visualizacao === modo ? 'manager-view-button--active' : ''}`}
                                aria-pressed={visualizacao === modo}
                                onClick={() => {
                                    atualizarFiltros();
                                    setVisualizacao(modo);
                                }}
                            >
                                {modo === 'dia' ? 'Dia' : modo === 'semana' ? 'Semana' : 'Lista'}
                            </button>
                        ))}
                    </div>
                </div>

                {carregando ? (
                    <Carregando />
                ) : agendamentos.length === 0 ? (
                    <Aviso tipo="info" mensagem="Nenhum agendamento corresponde aos filtros selecionados." />
                ) : visualizacao === 'lista' ? (
                    <div className="manager-appointment-list">
                        {agendamentos.map(renderizarAgendamento)}
                    </div>
                ) : (
                    <div className={`manager-calendar-grid ${visualizacao === 'dia' ? 'manager-calendar-grid--day' : ''}`}>
                        {datasVisiveis.map((dia) => (
                            <section className="manager-calendar-day" key={dia}>
                                <h3>{formatarData(dia)}</h3>
                                <div className="manager-calendar-day__items">
                                    {agendamentos
                                        .filter((item) => obterDataLocal(item.dataHora) === dia)
                                        .map(renderizarAgendamento)}
                                </div>
                            </section>
                        ))}
                    </div>
                )}
            </section>

            {modal && (
                <div
                    className="manager-modal-backdrop"
                    role="presentation"
                    onMouseDown={(evento) => {
                        if (evento.target === evento.currentTarget) fecharModal();
                    }}
                >
                    <section
                        className="manager-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="manager-modal-title"
                    >
                        <div className="manager-modal__heading">
                            <h2 id="manager-modal-title">
                                {modal.tipo === 'historico'
                                    ? 'Histórico do agendamento'
                                    : modal.tipo === 'solicitacao'
                                        ? modal.aprovar ? 'Aprovar solicitação' : 'Recusar solicitação'
                                        : modal.acao === 'confirmar'
                                            ? 'Confirmar agendamento'
                                            : modal.acao === 'reagendar'
                                                ? 'Reagendar atendimento'
                                                : 'Cancelar agendamento'}
                            </h2>
                            <button
                                type="button"
                                className="manager-modal__close"
                                onClick={fecharModal}
                                aria-label="Fechar janela"
                                disabled={salvando}
                            >
                                ×
                            </button>
                        </div>
                        {erro && <Aviso tipo="erro" mensagem={erro} />}

                        {modal.tipo === 'historico' ? (
                            carregandoHistorico ? (
                                <Carregando />
                            ) : detalhes ? (
                                <div className="manager-history-list">
                                    {detalhes.historico.length === 0 ? (
                                        <Aviso tipo="info" mensagem="Este agendamento ainda não possui alterações registradas." />
                                    ) : (
                                        detalhes.historico.map((item) => (
                                            <HistoricoItem key={item.id} item={item} />
                                        ))
                                    )}
                                </div>
                            ) : (
                                <Aviso tipo="erro" mensagem="Não foi possível exibir o histórico." />
                            )
                        ) : (
                            <form className="edit-form manager-action-form" onSubmit={(evento) => void executarAcao(evento)}>
                                {modal.tipo === 'solicitacao' ? (
                                    <div className="manager-action-summary">
                                        <p>
                                            {modal.solicitacao.agendamento?.usuario?.nome ?? 'Cliente'} sugeriu{' '}
                                            <strong>{formatarDataHora(modal.solicitacao.dataHoraSugerida)}</strong>.
                                        </p>
                                        <p>
                                            A aprovação executará o reagendamento nesse horário e o backend validará
                                            novamente a disponibilidade.
                                        </p>
                                    </div>
                                ) : modal.acao === 'confirmar' ? (
                                    <p>Confirma o atendimento de {modal.agendamento.usuario?.nome ?? 'este cliente'}?</p>
                                ) : modal.acao === 'cancelar' ? (
                                    <>
                                        <p>
                                            O atendimento de {modal.agendamento.usuario?.nome ?? 'este cliente'} será cancelado.
                                        </p>
                                        <div className="form-field">
                                            <label htmlFor="motivo-cancelamento-gestao">Motivo (opcional)</label>
                                            <textarea
                                                id="motivo-cancelamento-gestao"
                                                maxLength={1000}
                                                value={motivoCancelamento}
                                                onChange={(evento) => setMotivoCancelamento(evento.target.value)}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <p>
                                            Escolha uma nova data e um dos horários disponíveis para{' '}
                                            {modal.agendamento.usuario?.nome ?? 'o cliente'}.
                                        </p>
                                        <div className="form-row">
                                            <div className="form-field">
                                                <label htmlFor="data-reagendamento-gestao">Data</label>
                                                <input
                                                    id="data-reagendamento-gestao"
                                                    type="date"
                                                    min={dataAtual()}
                                                    value={dataReagendamento}
                                                    onChange={(evento) => {
                                                        setDataReagendamento(evento.target.value);
                                                        setHorarioReagendamento('');
                                                        setHorariosReagendamento([]);
                                                        setCarregandoHorarios(Boolean(
                                                            modal.agendamento.massagemId && modal.agendamento.massagistaId,
                                                        ));
                                                    }}
                                                    required
                                                />
                                            </div>
                                            <div className="form-field">
                                                <label htmlFor="horario-reagendamento-gestao">Horário disponível</label>
                                                <select
                                                    id="horario-reagendamento-gestao"
                                                    value={horarioReagendamento}
                                                    onChange={(evento) => setHorarioReagendamento(evento.target.value)}
                                                    disabled={carregandoHorarios || horariosReagendamento.length === 0}
                                                    required
                                                >
                                                    <option value="">
                                                        {carregandoHorarios
                                                            ? 'Consultando horários...'
                                                            : 'Selecione um horário'}
                                                    </option>
                                                    {horariosReagendamento.map((horario) => (
                                                        <option key={horario.dataHora} value={horario.dataHora}>
                                                            {formatarHora(horario.dataHora)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        {!modal.agendamento.massagemId || !modal.agendamento.massagistaId ? (
                                            <Aviso tipo="erro" mensagem="O agendamento não possui massagem e massagista vinculados para validar horários." />
                                        ) : horariosReagendamento.length === 0 && !carregandoHorarios ? (
                                            <Aviso tipo="info" mensagem="Não há horários disponíveis com este massagista nesta data." />
                                        ) : null}
                                    </>
                                )}
                                <div className="form-actions manager-modal__actions">
                                    <Botao
                                        type="button"
                                        variante="secundario"
                                        onClick={fecharModal}
                                        disabled={salvando}
                                    >
                                        Voltar
                                    </Botao>
                                    {modal.tipo === 'solicitacao' ? (
                                        <Botao
                                            type="submit"
                                            variante={modal.aprovar ? 'primario' : 'perigo'}
                                            disabled={salvando}
                                        >
                                            {salvando
                                                ? 'Salvando...'
                                                : modal.aprovar ? 'Aprovar solicitação' : 'Recusar solicitação'}
                                        </Botao>
                                    ) : (
                                        <Botao
                                            type="submit"
                                            variante={modal.acao === 'cancelar' ? 'perigo' : 'primario'}
                                            disabled={
                                                salvando ||
                                                (modal.acao === 'reagendar' &&
                                                    (carregandoHorarios || !horarioReagendamento))
                                            }
                                        >
                                            {salvando
                                                ? 'Salvando...'
                                                : modal.acao === 'confirmar'
                                                    ? 'Confirmar'
                                                    : modal.acao === 'cancelar'
                                                        ? 'Cancelar agendamento'
                                                        : 'Salvar novo horário'}
                                        </Botao>
                                    )}
                                </div>
                            </form>
                        )}
                    </section>
                </div>
            )}
        </Layout>
    );
}

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Aviso } from '../components/ui/Aviso';
import { Botao } from '../components/ui/Botao';
import { Carregando } from '../components/ui/Carregando';
import { Layout } from '../components/layout/Layout';
import {
    confirmarAgendamento,
    consultarHorariosLivres,
    criarAgendamento,
    listarAgendamentos,
    solicitarReagendamento,
} from '../api/agendamentos';
import { listarMassagens } from '../api/massagens';
import { useAuth } from '../hooks/useAuth';
import type { Massagem } from '../types/massagem';
import type {
    Agendamento,
    HorarioLivre,
    StatusAgendamento,
} from '../types/agendamento';

const FUSO_HORARIO = 'America/Cuiaba';
const TAMANHO_PAGINA = 100;

const nomesStatus: Record<StatusAgendamento, string> = {
    PENDENTE: 'Pendente',
    CONFIRMADO: 'Confirmado',
    REAGENDAMENTO_SOLICITADO: 'Reagendamento solicitado',
    REAGENDADO: 'Reagendado',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
    NAO_COMPARECEU: 'Não compareceu',
};

function dataHoje(): string {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: FUSO_HORARIO,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const valores = Object.fromEntries(partes.map(({ type, value }) => [type, value]));
    return `${valores.year}-${valores.month}-${valores.day}`;
}

function formatarDataHora(valor: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: FUSO_HORARIO,
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(valor));
}

function formatarHorario(valor: string): string {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: FUSO_HORARIO,
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(valor));
}

function mensagemErroApi(erro: unknown, mensagemPadrao: string): string {
    if (erro && typeof erro === 'object' && 'response' in erro) {
        const erroAxios = erro as {
            response?: { data?: { message?: unknown } | string };
        };
        const resposta = erroAxios.response?.data;
        const mensagem = typeof resposta === 'string' ? resposta : resposta?.message;
        if (Array.isArray(mensagem)) {
            return mensagem.filter((item): item is string => typeof item === 'string').join(' ');
        }
        if (typeof mensagem === 'string' && mensagem.trim()) {
            return mensagem;
        }
    }
    return mensagemPadrao;
}

function podeSolicitarReagendamento(status: StatusAgendamento): boolean {
    return ['PENDENTE', 'CONFIRMADO', 'REAGENDADO'].includes(status);
}

function AgendamentoCard({
    agendamento,
    children,
}: {
    agendamento: Agendamento;
    children?: ReactNode;
}) {
    return (
        <article className="appointment-card">
            <div className="appointment-card__heading">
                <div>
                    <h3>{agendamento.massagem?.nome ?? 'Massagem indisponível'}</h3>
                    <p>{formatarDataHora(agendamento.dataHora)}</p>
                </div>
                <span className="appointment-status">
                    {nomesStatus[agendamento.status]}
                </span>
            </div>
            <dl className="appointment-card__details">
                {agendamento.massagista && (
                    <div>
                        <dt>Massagista</dt>
                        <dd>{agendamento.massagista.nome}</dd>
                    </div>
                )}
                {agendamento.usuario && (
                    <div>
                        <dt>Cliente</dt>
                        <dd>{agendamento.usuario.nome}</dd>
                    </div>
                )}
            </dl>
            {children}
        </article>
    );
}

export function AgendamentosPage() {
    const { sessao } = useAuth();
    const usuarioId = sessao?.usuario.id;
    const perfis = sessao?.usuario.perfis ?? [];
    const eCliente = perfis.includes('CLIENTE');
    const eMassagista = perfis.includes('MASSAGISTA');

    const [massagens, setMassagens] = useState<Massagem[]>([]);
    const [carregandoMassagens, setCarregandoMassagens] = useState(true);
    const [dataAgendamento, setDataAgendamento] = useState(dataHoje);
    const [massagemSelecionada, setMassagemSelecionada] = useState('');
    const [massagistaSelecionado, setMassagistaSelecionado] = useState('');
    const [horariosLivres, setHorariosLivres] = useState<HorarioLivre[]>([]);
    const [horarioSelecionado, setHorarioSelecionado] = useState('');
    const [carregandoHorarios, setCarregandoHorarios] = useState(false);
    const [salvandoAgendamento, setSalvandoAgendamento] = useState(false);

    const [agendamentosCliente, setAgendamentosCliente] = useState<Agendamento[]>([]);
    const [clienteTemMais, setClienteTemMais] = useState(false);
    const [paginaCliente, setPaginaCliente] = useState(1);
    const [carregandoMaisCliente, setCarregandoMaisCliente] = useState(false);
    const [agendaMassagista, setAgendaMassagista] = useState<Agendamento[]>([]);
    const [agendaTemMais, setAgendaTemMais] = useState(false);
    const [paginaAgenda, setPaginaAgenda] = useState(1);
    const [carregandoMaisAgenda, setCarregandoMaisAgenda] = useState(false);
    const [dataAgenda, setDataAgenda] = useState(dataHoje);
    const [versaoAgendamentos, setVersaoAgendamentos] = useState(0);
    const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

    const [solicitacaoAbertaId, setSolicitacaoAbertaId] = useState<number | null>(null);
    const [dataSugerida, setDataSugerida] = useState(dataHoje);
    const [motivo, setMotivo] = useState('');
    const [horariosSugeridos, setHorariosSugeridos] = useState<HorarioLivre[]>([]);
    const [horarioSugerido, setHorarioSugerido] = useState('');
    const [carregandoHorariosSugeridos, setCarregandoHorariosSugeridos] = useState(false);
    const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);

    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);
    const [carregando, setCarregando] = useState(true);

    const massagemAtual = useMemo(
        () => massagens.find((item) => item.id === Number(massagemSelecionada)),
        [massagens, massagemSelecionada],
    );

    useEffect(() => {
        let ativo = true;
        async function carregarCatalogo() {
            try {
                const dados = await listarMassagens();
                if (ativo) setMassagens(dados);
            } catch (erroApi: unknown) {
                if (ativo) {
                    setErro(mensagemErroApi(erroApi, 'Não foi possível carregar as massagens.'));
                }
            } finally {
                if (ativo) setCarregandoMassagens(false);
            }
        }
        void carregarCatalogo();
        return () => { ativo = false; };
    }, []);

    useEffect(() => {
        let ativo = true;
        async function carregarAgendamentos() {
            if (usuarioId === undefined) return;

            try {
                const filtrosCliente = {
                    clienteId: usuarioId,
                    page: 1,
                    limit: TAMANHO_PAGINA,
                };
                const filtrosAgenda = {
                    massagistaId: usuarioId,
                    data: dataAgenda,
                    page: 1,
                    limit: TAMANHO_PAGINA,
                };
                const [respostaCliente, respostaAgenda] = await Promise.all([
                    listarAgendamentos(filtrosCliente),
                    eMassagista
                        ? listarAgendamentos(filtrosAgenda)
                        : Promise.resolve(null),
                ]);
                if (!ativo) return;

                setAgendamentosCliente(respostaCliente.data);
                setClienteTemMais(respostaCliente.pagination.hasMore);
                setPaginaCliente(2);
                if (respostaAgenda) {
                    setAgendaMassagista(respostaAgenda.data);
                    setAgendaTemMais(respostaAgenda.pagination.hasMore);
                    setPaginaAgenda(2);
                } else {
                    setAgendaMassagista([]);
                    setAgendaTemMais(false);
                    setPaginaAgenda(1);
                }
            } catch (erroApi: unknown) {
                if (ativo) {
                    setErro(mensagemErroApi(erroApi, 'Não foi possível carregar seus agendamentos.'));
                }
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        void carregarAgendamentos();
        return () => { ativo = false; };
    }, [dataAgenda, eMassagista, usuarioId, versaoAgendamentos]);

    useEffect(() => {
        let ativo = true;
        if (!massagemSelecionada || !dataAgendamento) {
            return () => { ativo = false; };
        }

        consultarHorariosLivres(
            Number(massagemSelecionada),
            dataAgendamento,
            massagistaSelecionado ? Number(massagistaSelecionado) : undefined,
        ).then((resposta) => {
            if (ativo) setHorariosLivres(resposta.horarios);
        }).catch((erroApi: unknown) => {
            if (ativo) {
                setErro(mensagemErroApi(erroApi, 'Não foi possível consultar os horários livres.'));
            }
        }).finally(() => {
            if (ativo) setCarregandoHorarios(false);
        });

        return () => { ativo = false; };
    }, [dataAgendamento, massagemSelecionada, massagistaSelecionado]);

    const agendamentoSolicitado = useMemo(
        () => agendamentosCliente.find((item) => item.id === solicitacaoAbertaId),
        [agendamentosCliente, solicitacaoAbertaId],
    );

    useEffect(() => {
        let ativo = true;
        if (
            !agendamentoSolicitado?.massagemId ||
            !agendamentoSolicitado.massagistaId ||
            !dataSugerida
        ) {
            return () => { ativo = false; };
        }

        consultarHorariosLivres(
            agendamentoSolicitado.massagemId,
            dataSugerida,
            agendamentoSolicitado.massagistaId,
        ).then((resposta) => {
            if (ativo) setHorariosSugeridos(resposta.horarios);
        }).catch((erroApi: unknown) => {
            if (ativo) {
                setErro(mensagemErroApi(erroApi, 'Não foi possível consultar os horários sugeridos.'));
            }
        }).finally(() => {
            if (ativo) setCarregandoHorariosSugeridos(false);
        });

        return () => { ativo = false; };
    }, [agendamentoSolicitado, dataSugerida]);

    async function carregarMaisCliente() {
        if (usuarioId === undefined) return;
        setCarregandoMaisCliente(true);
        setErro(null);
        try {
            const resposta = await listarAgendamentos({
                clienteId: usuarioId,
                page: paginaCliente,
                limit: TAMANHO_PAGINA,
            });
            setAgendamentosCliente((atuais) => [...atuais, ...resposta.data]);
            setClienteTemMais(resposta.pagination.hasMore);
            setPaginaCliente(resposta.pagination.page + 1);
        } catch (erroApi: unknown) {
            setErro(mensagemErroApi(erroApi, 'Não foi possível carregar mais agendamentos.'));
        } finally {
            setCarregandoMaisCliente(false);
        }
    }

    async function carregarMaisAgenda() {
        if (!usuarioId) return;
        setCarregandoMaisAgenda(true);
        setErro(null);
        try {
            const resposta = await listarAgendamentos({
                massagistaId: usuarioId,
                data: dataAgenda,
                page: paginaAgenda,
                limit: TAMANHO_PAGINA,
            });
            setAgendaMassagista((atuais) => [...atuais, ...resposta.data]);
            setAgendaTemMais(resposta.pagination.hasMore);
            setPaginaAgenda(resposta.pagination.page + 1);
        } catch (erroApi: unknown) {
            setErro(mensagemErroApi(erroApi, 'Não foi possível carregar mais atendimentos.'));
        } finally {
            setCarregandoMaisAgenda(false);
        }
    }

    async function criarNovoAgendamento(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        const horario = horariosLivres.find((item) => item.dataHora === horarioSelecionado);
        if (!horario || !massagemSelecionada) {
            setErro('Escolha uma massagem e um horário disponível.');
            return;
        }

        setErro(null);
        setSucesso(null);
        setSalvandoAgendamento(true);
        try {
            await criarAgendamento({
                dataHora: horario.dataHora,
                massagemId: Number(massagemSelecionada),
                ...(massagistaSelecionado
                    ? { massagistaId: Number(massagistaSelecionado) }
                    : {}),
            });
            setSucesso('Agendamento criado. Ele ficará pendente até ser confirmado.');
            setHorarioSelecionado('');
            setCarregando(true);
            setVersaoAgendamentos((versao) => versao + 1);
        } catch (erroApi: unknown) {
            setErro(mensagemErroApi(erroApi, 'Não foi possível criar o agendamento.'));
        } finally {
            setSalvandoAgendamento(false);
        }
    }

    async function confirmar(id: number) {
        setErro(null);
        setSucesso(null);
        setConfirmandoId(id);
        try {
            await confirmarAgendamento(id);
            setSucesso('Agendamento confirmado.');
            setCarregando(true);
            setVersaoAgendamentos((versao) => versao + 1);
        } catch (erroApi: unknown) {
            setErro(mensagemErroApi(erroApi, 'Não foi possível confirmar o agendamento.'));
        } finally {
            setConfirmandoId(null);
        }
    }

    function abrirSolicitacao(agendamento: Agendamento) {
        setErro(null);
        setSucesso(null);
        setDataSugerida(dataHoje());
        setMotivo('');
        setHorarioSugerido('');
        setHorariosSugeridos([]);
        setCarregandoHorariosSugeridos(Boolean(agendamento.massagemId && agendamento.massagistaId));
        setSolicitacaoAbertaId(agendamento.id);
    }

    async function enviarSolicitacao(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        if (!agendamentoSolicitado || !horarioSugerido) {
            setErro('Escolha um horário disponível para a solicitação.');
            return;
        }

        setErro(null);
        setSucesso(null);
        setEnviandoSolicitacao(true);
        try {
            await solicitarReagendamento(agendamentoSolicitado.id, {
                dataHoraSugerida: horarioSugerido,
                ...(motivo.trim() ? { motivo: motivo.trim() } : {}),
            });
            setSucesso('Solicitação de reagendamento enviada para análise.');
            setSolicitacaoAbertaId(null);
            setCarregando(true);
            setVersaoAgendamentos((versao) => versao + 1);
        } catch (erroApi: unknown) {
            setErro(mensagemErroApi(erroApi, 'Não foi possível enviar a solicitação.'));
        } finally {
            setEnviandoSolicitacao(false);
        }
    }

    return (
        <Layout>
            <section className="page-intro">
                <span className="eyebrow">Cuidado no seu tempo</span>
                <h1>Agendamentos</h1>
                <p>Escolha uma experiência e encontre um horário disponível.</p>
            </section>

            {erro && <Aviso tipo="erro" mensagem={erro} />}
            {sucesso && <Aviso tipo="sucesso" mensagem={sucesso} />}

            <section className="appointment-panel" aria-labelledby="novo-agendamento-titulo">
                <div className="appointment-section-heading">
                    <div>
                        <span className="eyebrow">Novo atendimento</span>
                        <h2 id="novo-agendamento-titulo">Encontre seu horário</h2>
                    </div>
                    <p>O sistema valida os horários e a disponibilidade novamente ao criar o agendamento.</p>
                </div>

                {carregandoMassagens ? (
                    <Carregando />
                ) : massagens.length === 0 ? (
                    <Aviso tipo="info" mensagem="Nenhuma massagem está disponível para agendamento." />
                ) : (
                    <form className="edit-form appointment-form" onSubmit={criarNovoAgendamento}>
                        <div className="form-row">
                            <div className="form-field">
                                <label htmlFor="agendamento-massagem">Massagem</label>
                                <select
                                    id="agendamento-massagem"
                                    value={massagemSelecionada}
                                    onChange={(evento) => {
                                        setMassagemSelecionada(evento.target.value);
                                        setMassagistaSelecionado('');
                                        setHorarioSelecionado('');
                                        setHorariosLivres([]);
                                        setCarregandoHorarios(Boolean(evento.target.value));
                                    }}
                                    required
                                >
                                    <option value="">Selecione uma massagem</option>
                                    {massagens.map((massagem) => (
                                        <option key={massagem.id} value={massagem.id}>
                                            {massagem.nome} — {massagem.duracaoMinutos} min
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-field">
                                <label htmlFor="agendamento-massagista">Massagista</label>
                                <select
                                    id="agendamento-massagista"
                                    value={massagistaSelecionado}
                                    onChange={(evento) => {
                                        setMassagistaSelecionado(evento.target.value);
                                        setHorarioSelecionado('');
                                        setHorariosLivres([]);
                                        setCarregandoHorarios(Boolean(massagemSelecionada));
                                    }}
                                    disabled={!massagemAtual}
                                >
                                    <option value="">Qualquer disponível</option>
                                    {massagemAtual?.massagistas.map(({ usuario }) => (
                                        <option key={usuario.id} value={usuario.id}>
                                            {usuario.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-field">
                                <label htmlFor="agendamento-data">Data</label>
                                <input
                                    id="agendamento-data"
                                    type="date"
                                    min={dataHoje()}
                                    value={dataAgendamento}
                                    onChange={(evento) => {
                                        setDataAgendamento(evento.target.value);
                                        setHorarioSelecionado('');
                                        setHorariosLivres([]);
                                        setCarregandoHorarios(Boolean(massagemSelecionada));
                                    }}
                                    required
                                />
                            </div>
                            <div className="form-field">
                                <label htmlFor="agendamento-horario">Horário disponível</label>
                                <select
                                    id="agendamento-horario"
                                    value={horarioSelecionado}
                                    onChange={(evento) => setHorarioSelecionado(evento.target.value)}
                                    disabled={carregandoHorarios || horariosLivres.length === 0}
                                    required
                                >
                                    <option value="">
                                        {carregandoHorarios
                                            ? 'Consultando horários...'
                                            : 'Selecione um horário'}
                                    </option>
                                    {horariosLivres.map((horario) => (
                                        <option key={horario.dataHora} value={horario.dataHora}>
                                            {formatarHorario(horario.dataHora)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {!carregandoHorarios && massagemSelecionada && horariosLivres.length === 0 && (
                            <Aviso tipo="info" mensagem="Não há horários livres para esta combinação de data e massagem." />
                        )}
                        <div className="form-actions">
                            <Botao
                                type="submit"
                                disabled={salvandoAgendamento || carregandoHorarios || !horarioSelecionado}
                            >
                                {salvandoAgendamento ? 'Agendando...' : 'Solicitar agendamento'}
                            </Botao>
                        </div>
                    </form>
                )}
            </section>

            <section className="appointment-list-section" aria-labelledby="meus-agendamentos-titulo">
                <div className="appointment-section-heading">
                    <div>
                        <span className="eyebrow">Sua conta</span>
                        <h2 id="meus-agendamentos-titulo">Meus agendamentos</h2>
                    </div>
                </div>
                {carregando ? (
                    <Carregando />
                ) : agendamentosCliente.length === 0 ? (
                    <Aviso tipo="info" mensagem="Você ainda não possui agendamentos como cliente." />
                ) : (
                    <>
                        <div className="appointment-list">
                            {agendamentosCliente.map((agendamento) => (
                                <AgendamentoCard key={agendamento.id} agendamento={agendamento}>
                                    {eCliente && podeSolicitarReagendamento(agendamento.status) && (
                                        <div className="appointment-actions">
                                            {solicitacaoAbertaId === agendamento.id ? (
                                                <form className="edit-form reschedule-form" onSubmit={enviarSolicitacao}>
                                                    <div className="form-row">
                                                        <div className="form-field">
                                                            <label htmlFor={`data-sugerida-${agendamento.id}`}>
                                                                Data sugerida
                                                            </label>
                                                            <input
                                                                id={`data-sugerida-${agendamento.id}`}
                                                                type="date"
                                                                min={dataHoje()}
                                                                value={dataSugerida}
                                                                onChange={(evento) => {
                                                                    setDataSugerida(evento.target.value);
                                                                    setHorarioSugerido('');
                                                                    setHorariosSugeridos([]);
                                                                    setCarregandoHorariosSugeridos(Boolean(
                                                                        agendamento.massagemId && agendamento.massagistaId,
                                                                    ));
                                                                }}
                                                                required
                                                            />
                                                        </div>
                                                        <div className="form-field">
                                                            <label htmlFor={`horario-sugerido-${agendamento.id}`}>
                                                                Horário disponível
                                                            </label>
                                                            <select
                                                                id={`horario-sugerido-${agendamento.id}`}
                                                                value={horarioSugerido}
                                                                onChange={(evento) => setHorarioSugerido(evento.target.value)}
                                                                disabled={carregandoHorariosSugeridos || horariosSugeridos.length === 0}
                                                                required
                                                            >
                                                                <option value="">
                                                                    {carregandoHorariosSugeridos
                                                                        ? 'Consultando horários...'
                                                                        : 'Selecione um horário'}
                                                                </option>
                                                                {horariosSugeridos.map((horario) => (
                                                                    <option key={horario.dataHora} value={horario.dataHora}>
                                                                        {formatarHorario(horario.dataHora)}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                    <div className="form-field">
                                                        <label htmlFor={`motivo-${agendamento.id}`}>
                                                            Motivo (opcional)
                                                        </label>
                                                        <textarea
                                                            id={`motivo-${agendamento.id}`}
                                                            maxLength={1000}
                                                            value={motivo}
                                                            onChange={(evento) => setMotivo(evento.target.value)}
                                                        />
                                                    </div>
                                                    {horariosSugeridos.length === 0 && !carregandoHorariosSugeridos && (
                                                        <Aviso tipo="info" mensagem="Não há horários disponíveis com este massagista nesta data." />
                                                    )}
                                                    <div className="form-actions">
                                                        <Botao
                                                            type="button"
                                                            variante="secundario"
                                                            onClick={() => setSolicitacaoAbertaId(null)}
                                                        >
                                                            Fechar
                                                        </Botao>
                                                        <Botao
                                                            type="submit"
                                                            disabled={enviandoSolicitacao || carregandoHorariosSugeridos || !horarioSugerido}
                                                        >
                                                            {enviandoSolicitacao ? 'Enviando...' : 'Enviar solicitação'}
                                                        </Botao>
                                                    </div>
                                                </form>
                                            ) : (
                                                <Botao
                                                    type="button"
                                                    variante="secundario"
                                                    onClick={() => abrirSolicitacao(agendamento)}
                                                >
                                                    Solicitar reagendamento
                                                </Botao>
                                            )}
                                        </div>
                                    )}
                                </AgendamentoCard>
                            ))}
                        </div>
                        {clienteTemMais && (
                            <div className="appointment-more">
                                <Botao
                                    type="button"
                                    variante="secundario"
                                    disabled={carregandoMaisCliente}
                                    onClick={() => void carregarMaisCliente()}
                                >
                                    {carregandoMaisCliente ? 'Carregando...' : 'Carregar mais agendamentos'}
                                </Botao>
                            </div>
                        )}
                    </>
                )}
            </section>

            {eMassagista && (
                <section className="appointment-list-section" aria-labelledby="agenda-massagista-titulo">
                    <div className="appointment-section-heading appointment-section-heading--filter">
                        <div>
                            <span className="eyebrow">Atendimentos</span>
                            <h2 id="agenda-massagista-titulo">Minha agenda</h2>
                        </div>
                        <div className="form-field appointment-date-filter">
                            <label htmlFor="data-agenda-massagista">Data da agenda</label>
                            <input
                                id="data-agenda-massagista"
                                type="date"
                                value={dataAgenda}
                                onChange={(evento) => {
                                    setErro(null);
                                    setCarregando(true);
                                    setDataAgenda(evento.target.value);
                                }}
                            />
                        </div>
                    </div>
                    {carregando ? (
                        <Carregando />
                    ) : agendaMassagista.length === 0 ? (
                        <Aviso tipo="info" mensagem="Não há atendimentos na sua agenda nesta data." />
                    ) : (
                        <>
                            <div className="appointment-list">
                                {agendaMassagista.map((agendamento) => (
                                    <AgendamentoCard key={agendamento.id} agendamento={agendamento}>
                                        {agendamento.status === 'PENDENTE' && (
                                            <div className="appointment-actions">
                                                <Botao
                                                    type="button"
                                                    disabled={confirmandoId === agendamento.id}
                                                    onClick={() => void confirmar(agendamento.id)}
                                                >
                                                    {confirmandoId === agendamento.id ? 'Confirmando...' : 'Confirmar atendimento'}
                                                </Botao>
                                            </div>
                                        )}
                                    </AgendamentoCard>
                                ))}
                            </div>
                            {agendaTemMais && (
                                <div className="appointment-more">
                                    <Botao
                                        type="button"
                                        variante="secundario"
                                        disabled={carregandoMaisAgenda}
                                        onClick={() => void carregarMaisAgenda()}
                                    >
                                        {carregandoMaisAgenda ? 'Carregando...' : 'Carregar mais atendimentos'}
                                    </Botao>
                                </div>
                            )}
                        </>
                    )}
                </section>
            )}
        </Layout>
    );
}

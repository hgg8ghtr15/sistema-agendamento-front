export type StatusAgendamento =
    | 'PENDENTE'
    | 'CONFIRMADO'
    | 'REAGENDAMENTO_SOLICITADO'
    | 'REAGENDADO'
    | 'CONCLUIDO'
    | 'CANCELADO'
    | 'NAO_COMPARECEU';

export type StatusSolicitacaoReagendamento =
    | 'PENDENTE'
    | 'APROVADA'
    | 'RECUSADA'
    | 'CANCELADA';

export interface PessoaAgendamento {
    id: number;
    nome: string;
    email?: string;
}

export interface Agendamento {
    id: number;
    dataHora: string;
    dataHoraFim: string | null;
    status: StatusAgendamento;
    observacoes: string | null;
    usuarioId: number;
    massagemId: number | null;
    massagistaId: number | null;
    usuario?: PessoaAgendamento;
    massagista?: PessoaAgendamento | null;
    massagem?: {
        id: number;
        nome: string;
        duracaoMinutos: number;
        valorCentavos: number;
    } | null;
}

export interface HorarioLivre {
    dataHora: string;
    dataHoraFim: string;
    massagistaIds: number[];
}

export interface RespostaHorariosLivres {
    data: string;
    massagemId: number;
    horarios: HorarioLivre[];
}

export interface RespostaListaAgendamentos {
    data: Agendamento[];
    pagination: {
        page: number;
        limit: number;
        hasMore: boolean;
    };
}

export interface FiltrosAgendamentos {
    data?: string;
    massagistaId?: number;
    clienteId?: number;
    status?: StatusAgendamento;
    page?: number;
    limit?: number;
}

export interface CriarAgendamentoDto {
    dataHora: string;
    massagemId: number;
    massagistaId?: number;
}

export interface SolicitarReagendamentoDto {
    dataHoraSugerida: string;
    motivo?: string;
}

export interface CancelarAgendamentoDto {
    motivo?: string;
}

export interface ReagendarAgendamentoDto {
    dataHora: string;
}

export interface ResponderReagendamentoDto {
    aprovar: boolean;
}

export interface SolicitacaoReagendamento {
    id: number;
    agendamentoId: number;
    dataHoraSugerida: string;
    motivo: string | null;
    status: StatusSolicitacaoReagendamento;
    statusAnterior?: StatusAgendamento;
    respondidoEm?: string | null;
    respondidoPor?: PessoaAgendamento | null;
    createdAt?: string;
    agendamento?: Agendamento;
}

export interface HistoricoAgendamento {
    id: number;
    acao: string;
    createdAt: string;
    valoresAnteriores: Record<string, unknown> | null;
    valoresNovos: Record<string, unknown> | null;
    autor: PessoaAgendamento;
}

export interface AgendamentoDetalhado extends Agendamento {
    solicitacoes: SolicitacaoReagendamento[];
    historico: HistoricoAgendamento[];
}

export interface OpcaoFiltroAgendamento {
    id: number;
    nome: string;
}

export interface OpcoesFiltroAgendamento {
    clientes: OpcaoFiltroAgendamento[];
    massagistas: OpcaoFiltroAgendamento[];
}

export interface RespostaListaSolicitacoes {
    data: SolicitacaoReagendamento[];
    pagination: {
        page: number;
        limit: number;
        hasMore: boolean;
    };
}

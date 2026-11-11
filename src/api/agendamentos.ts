import api from './axios';
import type {
    Agendamento,
    AgendamentoDetalhado,
    CancelarAgendamentoDto,
    CriarAgendamentoDto,
    FiltrosAgendamentos,
    OpcoesFiltroAgendamento,
    RespostaHorariosLivres,
    RespostaListaAgendamentos,
    RespostaListaSolicitacoes,
    ReagendarAgendamentoDto,
    ResponderReagendamentoDto,
    StatusSolicitacaoReagendamento,
    SolicitacaoReagendamento,
    SolicitarReagendamentoDto,
} from '../types/agendamento';

export async function consultarHorariosLivres(
    massagemId: number,
    data: string,
    massagistaId?: number,
): Promise<RespostaHorariosLivres> {
    const resposta = await api.get<RespostaHorariosLivres>(
        '/agendamentos/horarios-livres',
        { params: { massagemId, data, massagistaId } },
    );
    return resposta.data;
}

export async function listarAgendamentos(
    filtros: FiltrosAgendamentos,
): Promise<RespostaListaAgendamentos> {
    const resposta = await api.get<RespostaListaAgendamentos>(
        '/agendamentos',
        { params: filtros },
    );
    return resposta.data;
}

export async function consultarOpcoesFiltro(): Promise<OpcoesFiltroAgendamento> {
    const resposta = await api.get<OpcoesFiltroAgendamento>(
        '/agendamentos/opcoes-filtro',
    );
    return resposta.data;
}

export async function listarSolicitacoesReagendamento(
    filtros: { status?: StatusSolicitacaoReagendamento; page?: number; limit?: number },
): Promise<RespostaListaSolicitacoes> {
    const resposta = await api.get<RespostaListaSolicitacoes>(
        '/agendamentos/solicitacoes-reagendamento',
        { params: filtros },
    );
    return resposta.data;
}

export async function criarAgendamento(
    dados: CriarAgendamentoDto,
): Promise<Agendamento> {
    const resposta = await api.post<Agendamento>('/agendamentos', dados);
    return resposta.data;
}

export async function detalharAgendamento(id: number): Promise<AgendamentoDetalhado> {
    const resposta = await api.get<AgendamentoDetalhado>(`/agendamentos/${id}`);
    return resposta.data;
}

export async function confirmarAgendamento(id: number): Promise<Agendamento> {
    const resposta = await api.post<Agendamento>(`/agendamentos/${id}/confirmar`);
    return resposta.data;
}

export async function cancelarAgendamento(
    id: number,
    dados: CancelarAgendamentoDto,
): Promise<Agendamento> {
    const resposta = await api.post<Agendamento>(
        `/agendamentos/${id}/cancelar`,
        dados,
    );
    return resposta.data;
}

export async function reagendarAgendamento(
    id: number,
    dados: ReagendarAgendamentoDto,
): Promise<Agendamento> {
    const resposta = await api.post<Agendamento>(
        `/agendamentos/${id}/reagendar`,
        dados,
    );
    return resposta.data;
}

export async function responderSolicitacaoReagendamento(
    id: number,
    dados: ResponderReagendamentoDto,
): Promise<Agendamento> {
    const resposta = await api.post<Agendamento>(
        `/agendamentos/solicitacoes-reagendamento/${id}/responder`,
        dados,
    );
    return resposta.data;
}

export async function solicitarReagendamento(
    id: number,
    dados: SolicitarReagendamentoDto,
): Promise<SolicitacaoReagendamento> {
    const resposta = await api.post<SolicitacaoReagendamento>(
        `/agendamentos/${id}/solicitacoes-reagendamento`,
        dados,
    );
    return resposta.data;
}

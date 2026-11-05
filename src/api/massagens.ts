// src/api/massagens.ts
import api from './axios';
import type {
    Massagem,
    Material,
    CriarMaterialDto,
    CriarMassagemDto,
    AtualizarMassagemDto,
    MaterialMassagemDto,
} from '../types/massagem';

// Busca todas as massagens ativas
export async function listarMassagens(): Promise<Massagem[]> {
    const resposta = await api.get<Massagem[]>('/massagens');
    return resposta.data;
}

// Busca uma massagem pelo ID
export async function buscarMassagem(id: number): Promise<Massagem> {
    const resposta = await api.get<Massagem>(`/massagens/${id}`);
    return resposta.data;
}

// Cria uma nova massagem (somente ADMIN)
export async function criarMassagem(dados: CriarMassagemDto): Promise<Massagem> {
    const resposta = await api.post<Massagem>('/massagens', dados);
    return resposta.data;
}

// Atualiza campos de uma massagem (somente ADMIN)
export async function atualizarMassagem(
    id: number,
    dados: AtualizarMassagemDto,
): Promise<Massagem> {
    const resposta = await api.patch<Massagem>(`/massagens/${id}`, dados);
    return resposta.data;
}

// Arquiva ou reativa uma massagem (somente ADMIN)
export async function definirMassagemAtiva(id: number, ativo: boolean): Promise<Massagem> {
    const resposta = await api.patch<Massagem>(`/massagens/${id}/ativo`, { ativo });
    return resposta.data;
}

export async function listarMateriais(): Promise<Material[]> {
    const resposta = await api.get<Material[]>('/materiais');
    return resposta.data;
}

export async function criarMaterial(dados: CriarMaterialDto): Promise<Material> {
    const resposta = await api.post<Material>('/materiais', dados);
    return resposta.data;
}

export async function definirMaterialAtivo(id: number, ativo: boolean): Promise<Material> {
    const resposta = await api.patch<Material>(`/materiais/${id}/ativo`, { ativo });
    return resposta.data;
}

export async function substituirMateriaisMassagem(
    massagemId: number,
    materiais: MaterialMassagemDto[],
): Promise<Massagem> {
    const resposta = await api.put<Massagem>(`/massagens/${massagemId}/materiais`, { materiais });
    return resposta.data;
}
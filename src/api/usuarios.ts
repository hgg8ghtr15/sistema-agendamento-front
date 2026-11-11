import api from './axios';
import type { Perfil, Usuario } from '../types/auth';
import type { HorarioTrabalho, HorarioTrabalhoInput, Massagista } from '../types/usuario';

export interface UsuarioGerenciado extends Usuario {
    createdAt: string;
}

export async function listarUsuarios(): Promise<UsuarioGerenciado[]> {
    const resposta = await api.get<UsuarioGerenciado[]>('/usuarios');
    return resposta.data;
}

export async function atualizarPerfis(
    id: number,
    perfis: Perfil[],
): Promise<UsuarioGerenciado> {
    const resposta = await api.patch<UsuarioGerenciado>(`/usuarios/${id}/perfis`, { perfis });
    return resposta.data;
}

export async function listarMassagistas(): Promise<Massagista[]> {
    const resposta = await api.get<Massagista[]>('/usuarios/massagistas');
    return resposta.data;
}

export async function buscarHorariosTrabalho(id: number): Promise<HorarioTrabalho[]> {
    const resposta = await api.get<HorarioTrabalho[]>(`/usuarios/${id}/horarios-trabalho`);
    return resposta.data;
}

export async function substituirHorariosTrabalho(
    id: number,
    horarios: HorarioTrabalhoInput[],
): Promise<HorarioTrabalho[]> {
    const resposta = await api.put<HorarioTrabalho[]>(`/usuarios/${id}/horarios-trabalho`, {
        horarios,
    });
    return resposta.data;
}

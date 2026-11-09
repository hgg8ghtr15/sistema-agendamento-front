import api from './axios';
import type { Perfil, Usuario } from '../types/auth';

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

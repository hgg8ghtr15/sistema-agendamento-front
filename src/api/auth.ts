import api from './axios';
import type { RespostaLogin } from '../types/auth';

// Envia as credenciais e retorna o token + dados do usuário
export async function login(email: string, senha: string): Promise<RespostaLogin> {
    const resposta = await api.post<RespostaLogin>('/auth/login', { email, senha });
    return resposta.data;
}

export async function cadastrarUsuario(dados: {
    nome: string;
    email: string;
    senha: string;
}): Promise<RespostaLogin> {
    const resposta = await api.post<RespostaLogin>('/usuarios/register', dados);
    return resposta.data;
}

// (Logout é feito localmente: apenas remove os dados do localStorage)
// O back-end pode ter uma rota de revogação; implemente aqui quando necessário.
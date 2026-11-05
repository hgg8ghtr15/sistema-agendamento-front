// Perfis possíveis — devem coincidir com o enum do back-end
export type Perfil = 'ADMIN' | 'CLIENTE' | 'MASSAGISTA' | 'ADMINISTRATIVO';

// Dados do usuário disponíveis após o login
export interface Usuario {
    id: number;
    nome: string;
    email: string;
    perfil: Perfil;
}

// Resposta que o back-end retorna ao fazer login
// Atenção: o back-end usa "token" e "user" (não "access_token" e "usuario")
export interface RespostaLogin {
    token: string;
    user: Usuario;
}

// O que é armazenado em memória após o login
export interface SessaoAtual {
    token: string;
    usuario: Usuario;
}
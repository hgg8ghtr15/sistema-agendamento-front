// src/api/axios.ts
import axios from 'axios';

// Cria uma instância do Axios com configuração base
const api = axios.create({
    // import.meta.env.VITE_API_URL lê a variável do arquivo .env
    baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor de requisição: roda antes de cada chamada HTTP
// Adiciona o token JWT ao cabeçalho Authorization automaticamente
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        // O back-end espera o cabeçalho no formato: "Bearer <token>"
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

// Interceptor de resposta: roda quando a resposta chega
// Se o back-end retornar 401 (não autorizado), o token expirou
api.interceptors.response.use(
    // Resposta com sucesso: retorna normalmente
    (response) => response,

    // Resposta com erro
    (error) => {
        if (error.response?.status === 401) {
            // Remove os dados da sessão e redireciona para o login
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = '/login';
        }

        // Propaga o erro para quem fez a chamada lidar com ele
        return Promise.reject(error);
    },
);

export default api;
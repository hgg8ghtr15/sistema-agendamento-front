// src/hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

// Hook personalizado: encapsula o useContext para melhor experiência de uso
export function useAuth() {
    const contexto = useContext(AuthContext);

    // Protege contra uso fora do AuthProvider
    if (!contexto) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }

    return contexto;
}
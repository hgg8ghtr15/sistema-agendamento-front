import { useState, useEffect } from 'react';
import { listarMassagens } from '../api/massagens';
import type { Massagem } from '../types/massagem';

// Hook personalizado que encapsula a busca da lista de massagens
// Componentes que usam este hook não precisam saber como a busca funciona
export function useMassagens() {
    const [massagens, setMassagens] = useState<Massagem[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        // Função assíncrona dentro do useEffect (useEffect não pode ser async diretamente)
        async function buscar() {
            try {
                const dados = await listarMassagens();
                setMassagens(dados);
            } catch {
                setErro('Não foi possível carregar as massagens. Tente novamente.');
            } finally {
                setCarregando(false);
            }
        }

        buscar();
        // Array vazio [] significa que este efeito roda apenas uma vez (na montagem do componente)
    }, []);

    return { massagens, carregando, erro };
}
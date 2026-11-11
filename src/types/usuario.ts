export interface Massagista {
    id: number;
    nome: string;
}

export interface HorarioTrabalho {
    id: number;
    usuarioId: number;
    diaSemana: number;
    inicio: string;
    fim: string;
}

export type HorarioTrabalhoInput = Omit<HorarioTrabalho, 'id' | 'usuarioId'>;

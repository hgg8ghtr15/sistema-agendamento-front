// Tipos de massagem
export interface Material {
    id: number;
    nome: string;
    descricao?: string;
    ativo: boolean;
}

export interface CriarMaterialDto {
    nome: string;
    descricao?: string;
}

export interface AtualizarMaterialDto {
    nome?: string;
    descricao?: string;
}

// Um item de material dentro da ficha de uma massagem
// (quantidade e unidade variam por massagem)
export interface ItemMaterialMassagem {
    material: Material;
    quantidade: number;
    unidade: string;
}

export interface MaterialMassagemDto {
    materialId: number;
    quantidade: number;
    unidade: string;
}

// Dados mínimos do massagista vinculado (o back-end não expõe senha)
export interface MassistaResumo {
    id: number;
    nome: string;
    email: string;
    perfil: string;
}

export interface MassagemVinculo {
    usuario: MassistaResumo;
}

// Massagem completa retornada pelo back-end
export interface Massagem {
    id: number;
    nome: string;
    descricao: string;
    duracaoMinutos: number;
    valorCentavos: number;  // valor em centavos; use formatarMoeda() para exibir
    youtubeUrl?: string | null;
    ativo: boolean;
    materiais: ItemMaterialMassagem[];
    massagistas: MassagemVinculo[];
    createdAt: string;
    updatedAt: string;
}

// Dados enviados para criar uma massagem (somente admin)
export interface CriarMassagemDto {
    nome: string;
    descricao: string;
    duracaoMinutos: number;
    valorCentavos: number;
    youtubeUrl?: string;
}

// Dados enviados para atualizar (todos opcionais)
export interface AtualizarMassagemDto {
    nome?: string;
    descricao?: string;
    duracaoMinutos?: number;
    valorCentavos?: number;
    youtubeUrl?: string | null;
}
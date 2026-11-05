// Converte centavos para reais formatados
// Exemplo: formatarMoeda(15000) → "R$ 150,00"
// Exemplo: formatarMoeda(500)   → "R$ 5,00"
export function formatarMoeda(centavos: number): string {
    // Divide por 100 para converter centavos em reais
    const reais = centavos / 100;

    // Intl.NumberFormat usa a API nativa do navegador para formatar moeda
    // 'pt-BR' define vírgula como separador decimal e ponto como separador de milhar
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(reais);
}
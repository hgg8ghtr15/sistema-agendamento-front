// Converte minutos para texto legível
// Exemplo: formatarDuracao(90)  → "1h 30min"
// Exemplo: formatarDuracao(60)  → "1h"
// Exemplo: formatarDuracao(45)  → "45min"
export function formatarDuracao(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    if (horas === 0) return `${minutosRestantes}min`;
    if (minutosRestantes === 0) return `${horas}h`;
    return `${horas}h ${minutosRestantes}min`;
}
// Componente simples de indicador de carregamento
// Exibido enquanto dados estão sendo buscados do back-end
export function Carregando() {
    return (
        <div className="loading-state" role="status" aria-live="polite">
            <span className="loading-spinner" aria-hidden="true" />
            <p>Carregando...</p>
        </div>
    );
}
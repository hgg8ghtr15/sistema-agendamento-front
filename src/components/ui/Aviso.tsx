// Tipos de aviso suportados
type TipoAviso = 'erro' | 'sucesso' | 'info';

interface AvisoProps {
    tipo: TipoAviso;
    mensagem: string;
}

export function Aviso({ tipo, mensagem }: AvisoProps) {
    return (
        <div
            className={`notice notice--${tipo}`}
            role={tipo === 'erro' ? 'alert' : 'status'}
        >
            {mensagem}
        </div>
    );
}
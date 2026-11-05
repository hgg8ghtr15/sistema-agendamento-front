// Estende os atributos nativos de um botão HTML
// Assim, propriedades como `onClick`, `type` e `disabled` funcionam automaticamente
interface BotaoProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variante?: 'primario' | 'perigo' | 'secundario';
    children: React.ReactNode;
}

const classesVariante = {
    primario: 'button--primary',
    perigo: 'button--danger',
    secundario: 'button--secondary',
};

export function Botao({ variante = 'primario', children, className, style, ...resto }: BotaoProps) {
    return (
        <button
            className={`button ${classesVariante[variante]} ${className ?? ''}`.trim()}
            style={style}
            {...resto}
        >
            {children}
        </button>
    );
}
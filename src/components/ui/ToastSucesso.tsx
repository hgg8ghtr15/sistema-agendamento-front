import { useEffect } from 'react';

interface ToastSucessoProps {
    mensagem: string;
    onFechar: () => void;
}

export function ToastSucesso({ mensagem, onFechar }: ToastSucessoProps) {
    useEffect(() => {
        const timeout = window.setTimeout(onFechar, 4000);
        return () => window.clearTimeout(timeout);
    }, [onFechar]);

    return (
        <div className="success-toast" role="status" aria-live="polite">
            {mensagem}
        </div>
    );
}

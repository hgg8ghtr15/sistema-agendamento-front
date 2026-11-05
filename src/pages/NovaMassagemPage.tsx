import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { criarMassagem } from '../api/massagens';
import type { CriarMassagemDto } from '../types/massagem';
import { Aviso } from '../components/ui/Aviso';
import { Botao } from '../components/ui/Botao';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../hooks/useAuth';
import { Icon } from '@mdi/react';
import { mdiArrowLeft, mdiClock, mdiCurrencyUsd, mdiContentSave } from '@mdi/js';

export function NovaMassagemPage() {
    const { eAdmin } = useAuth();
    const navigate = useNavigate();
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [duracaoMinutos, setDuracaoMinutos] = useState('');
    const [valorReais, setValorReais] = useState('');
    const [erro, setErro] = useState<string | null>(null);
    const [salvando, setSalvando] = useState(false);

    if (!eAdmin) {
        return (
            <Layout>
                <Aviso tipo="erro" mensagem="Acesso negado. Apenas administradores podem cadastrar massagens." />
            </Layout>
        );
    }

    async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        setErro(null);

        const duracao = Number(duracaoMinutos);
        const valor = Number(valorReais.replace(',', '.'));
        if (!Number.isInteger(duracao) || duracao < 1 || !Number.isFinite(valor) || valor < 0) {
            setErro('Informe uma duração válida e um valor igual ou maior que zero.');
            return;
        }

        const dados: CriarMassagemDto = {
            nome: nome.trim(),
            descricao: descricao.trim(),
            duracaoMinutos: duracao,
            valorCentavos: Math.round(valor * 100),
        };

        setSalvando(true);
        try {
            const criada = await criarMassagem(dados);
            navigate(`/massagens/${criada.id}`);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
                const mensagem = axiosErr.response?.data?.message;
                setErro(Array.isArray(mensagem) ? mensagem.join(' ') : mensagem ?? 'Não foi possível cadastrar a massagem.');
            } else {
                setErro('Não foi possível cadastrar a massagem.');
            }
        } finally {
            setSalvando(false);
        }
    }

    return (
        <Layout>
            {erro && <Aviso tipo="erro" mensagem={erro} />}
            <article className="detail-panel">
                <header className="detail-heading">
                    <div className="detail-title-row">
                        <Link className="detail-back-link" to="/massagens" aria-label="Voltar para massagens">
                            <Icon path={mdiArrowLeft} size="1.25rem" className="back-icon" />
                        </Link>
                        <span className="eyebrow">Nova massagem</span>
                    </div>
                    <h1>Cadastrar uma experiência</h1>
                    <p className="detail-description">
                        Preencha as informações para adicionar uma massagem ao catálogo.
                    </p>
                </header>

                <form onSubmit={handleSubmit} className="edit-form">
                    <div className="form-field">
                        <label htmlFor="nome">Nome</label>
                        <input
                            id="nome"
                            type="text"
                            maxLength={100}
                            value={nome}
                            onChange={(evento) => setNome(evento.target.value)}
                            required
                        />
                    </div>

                    <div className="form-field">
                        <label htmlFor="descricao">Descrição</label>
                        <textarea
                            id="descricao"
                            maxLength={2000}
                            rows={4}
                            value={descricao}
                            onChange={(evento) => setDescricao(evento.target.value)}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label htmlFor="duracaoMinutos">Duração (minutos)</label>
                            <div className="input-with-icon">
                                <Icon path={mdiClock} size="1.25rem" className="input-icon" />
                                <input
                                    id="duracaoMinutos"
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={duracaoMinutos}
                                    onChange={(evento) => setDuracaoMinutos(evento.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-field">
                            <label htmlFor="valorReais">Valor (R$)</label>
                            <div className="input-with-icon">
                                <Icon path={mdiCurrencyUsd} size="1.25rem" className="input-icon" />
                                <input
                                    id="valorReais"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={valorReais}
                                    onChange={(evento) => setValorReais(evento.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <Botao type="button" variante="secundario" onClick={() => navigate('/massagens')}>
                            Cancelar
                        </Botao>
                        <Botao type="submit" disabled={salvando}>
                            <Icon path={mdiContentSave} size="1rem" className="btn-icon" />
                            {salvando ? 'Salvando...' : 'Cadastrar massagem'}
                        </Botao>
                    </div>
                </form>
            </article>
        </Layout>
    );
}

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Icon } from '@mdi/react';
import { mdiContentSave, mdiDeleteOutline, mdiPlus } from '@mdi/js';
import { Aviso } from '../components/ui/Aviso';
import { Botao } from '../components/ui/Botao';
import { Carregando } from '../components/ui/Carregando';
import { Layout } from '../components/layout/Layout';
import {
    buscarHorariosTrabalho,
    listarMassagistas,
    substituirHorariosTrabalho,
} from '../api/usuarios';
import { useAuth } from '../hooks/useAuth';
import type { HorarioTrabalhoInput, Massagista } from '../types/usuario';

const diasDaSemana = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
];

interface HorarioEditavel extends HorarioTrabalhoInput {
    chave: number;
}

function mensagemErro(erro: unknown, padrao: string): string {
    if (erro && typeof erro === 'object' && 'response' in erro) {
        const erroAxios = erro as {
            response?: { data?: { message?: unknown } | string };
        };
        const resposta = erroAxios.response?.data;
        const mensagem = typeof resposta === 'string' ? resposta : resposta?.message;
        if (Array.isArray(mensagem)) {
            return mensagem.filter((item): item is string => typeof item === 'string').join(' ');
        }
        if (typeof mensagem === 'string' && mensagem.trim()) return mensagem;
    }
    return padrao;
}

export function HorariosTrabalhoPage() {
    const { eAdmin } = useAuth();
    const [massagistas, setMassagistas] = useState<Massagista[]>([]);
    const [massagistaSelecionada, setMassagistaSelecionada] = useState('');
    const [horarios, setHorarios] = useState<HorarioEditavel[]>([]);
    const [carregandoMassagistas, setCarregandoMassagistas] = useState(true);
    const [carregandoHorarios, setCarregandoHorarios] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);
    const [sucesso, setSucesso] = useState<string | null>(null);
    const proximaChave = useRef(0);

    useEffect(() => {
        if (!eAdmin) return;

        let ativo = true;
        async function carregarMassagistas() {
            try {
                const resultado = await listarMassagistas();
                if (!ativo) return;
                setMassagistas(resultado);
                setCarregandoHorarios(resultado.length > 0);
                setMassagistaSelecionada(resultado[0] ? String(resultado[0].id) : '');
            } catch (erroApi: unknown) {
                if (ativo) setErro(mensagemErro(erroApi, 'Não foi possível carregar as massagistas.'));
            } finally {
                if (ativo) setCarregandoMassagistas(false);
            }
        }

        void carregarMassagistas();
        return () => {
            ativo = false;
        };
    }, [eAdmin]);

    useEffect(() => {
        if (!massagistaSelecionada) {
            return;
        }

        let ativo = true;

        async function carregarHorarios() {
            try {
                const resultado = await buscarHorariosTrabalho(Number(massagistaSelecionada));
                if (ativo) {
                    setHorarios(resultado.map(({ id, diaSemana, inicio, fim }) => ({
                        chave: id,
                        diaSemana,
                        inicio,
                        fim,
                    })));
                }
            } catch (erroApi: unknown) {
                if (ativo) {
                    setErro(mensagemErro(erroApi, 'Não foi possível carregar os horários de trabalho.'));
                }
            } finally {
                if (ativo) setCarregandoHorarios(false);
            }
        }

        void carregarHorarios();
        return () => {
            ativo = false;
        };
    }, [massagistaSelecionada]);

    function adicionarIntervalo(diaSemana: number) {
        setHorarios((atuais) => [
            ...atuais,
            {
                chave: --proximaChave.current,
                diaSemana,
                inicio: '09:00',
                fim: '17:00',
            },
        ]);
    }

    function atualizarIntervalo(chave: number, campo: 'inicio' | 'fim', valor: string) {
        setHorarios((atuais) => atuais.map((horario) =>
            horario.chave === chave ? { ...horario, [campo]: valor } : horario,
        ));
    }

    function removerIntervalo(chave: number) {
        setHorarios((atuais) => atuais.filter((horario) => horario.chave !== chave));
    }

    function selecionarMassagista(valor: string) {
        setErro(null);
        setSucesso(null);
        setCarregandoHorarios(Boolean(valor));
        setMassagistaSelecionada(valor);
    }

    async function salvar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        if (!massagistaSelecionada) return;

        setErro(null);
        setSucesso(null);
        setSalvando(true);
        const dados: HorarioTrabalhoInput[] = horarios.map(({ diaSemana, inicio, fim }) => ({
            diaSemana,
            inicio,
            fim,
        }));

        try {
            const atualizados = await substituirHorariosTrabalho(
                Number(massagistaSelecionada),
                dados,
            );
            setHorarios(atualizados.map(({ id, diaSemana, inicio, fim }) => ({
                chave: id,
                diaSemana,
                inicio,
                fim,
            })));
            setSucesso('Horários de trabalho salvos com sucesso.');
        } catch (erroApi: unknown) {
            setErro(mensagemErro(erroApi, 'Não foi possível salvar os horários de trabalho.'));
        } finally {
            setSalvando(false);
        }
    }

    if (!eAdmin) {
        return (
            <Layout>
                <Aviso tipo="erro" mensagem="Acesso negado. Apenas administradores podem gerenciar horários de trabalho." />
            </Layout>
        );
    }

    return (
        <Layout>
            <section className="schedule-page">
                <header className="schedule-heading">
                    <span className="eyebrow">Administração</span>
                    <h1>Horários de trabalho</h1>
                    <p>Configure os períodos semanais em que cada massagista atende.</p>
                </header>

                {erro && <Aviso tipo="erro" mensagem={erro} />}
                {sucesso && <Aviso tipo="sucesso" mensagem={sucesso} />}

                <div className="schedule-selector materials-form">
                    <div className="form-field">
                        <label htmlFor="selecionar-massagista">Massagista</label>
                        {carregandoMassagistas ? (
                            <Carregando />
                        ) : (
                            <select
                                id="selecionar-massagista"
                                value={massagistaSelecionada}
                                onChange={(evento) => selecionarMassagista(evento.target.value)}
                                disabled={massagistas.length === 0 || salvando}
                            >
                                {massagistas.length === 0 && <option value="">Nenhuma massagista cadastrada</option>}
                                {massagistas.map((massagista) => (
                                    <option key={massagista.id} value={massagista.id}>
                                        {massagista.nome}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {!carregandoMassagistas && massagistas.length === 0 && !erro && (
                    <Aviso tipo="info" mensagem="Não há usuários com perfil de massagista. Atribua esse perfil em Usuários antes de configurar a agenda." />
                )}

                {massagistaSelecionada && (
                    <form className="schedule-form" onSubmit={salvar}>
                        {carregandoHorarios ? (
                            <div className="materials-list-panel"><Carregando /></div>
                        ) : (
                            <div className="schedule-days">
                                {diasDaSemana.map((dia, diaSemana) => {
                                    const intervalos = horarios
                                        .filter((horario) => horario.diaSemana === diaSemana);

                                    return (
                                        <section className="schedule-day materials-list-panel" key={diaSemana}>
                                            <div className="schedule-day-heading">
                                                <div>
                                                    <h2>{dia}</h2>
                                                    <p>{intervalos.length === 0
                                                        ? 'Sem atendimento'
                                                        : `${intervalos.length} ${intervalos.length === 1 ? 'intervalo' : 'intervalos'}`}</p>
                                                </div>
                                                <Botao
                                                    type="button"
                                                    variante="secundario"
                                                    disabled={salvando}
                                                    onClick={() => adicionarIntervalo(diaSemana)}
                                                >
                                                    <Icon path={mdiPlus} size="1rem" className="btn-icon" />
                                                    Adicionar intervalo
                                                </Botao>
                                            </div>

                                            {intervalos.length === 0 ? (
                                                <p className="schedule-empty-day">Nenhum horário definido para este dia.</p>
                                            ) : (
                                                <div className="schedule-intervals">
                                                    {intervalos.map((horario) => (
                                                        <div className="schedule-interval" key={horario.chave}>
                                                            <div className="form-field">
                                                                <label htmlFor={`inicio-${horario.chave}`}>Início</label>
                                                                <input
                                                                    id={`inicio-${horario.chave}`}
                                                                    type="time"
                                                                    value={horario.inicio}
                                                                    onChange={(evento) => atualizarIntervalo(
                                                                        horario.chave,
                                                                        'inicio',
                                                                        evento.target.value,
                                                                    )}
                                                                    required
                                                                    disabled={salvando}
                                                                />
                                                            </div>
                                                            <div className="form-field">
                                                                <label htmlFor={`fim-${horario.chave}`}>Fim</label>
                                                                <input
                                                                    id={`fim-${horario.chave}`}
                                                                    type="time"
                                                                    value={horario.fim}
                                                                    onChange={(evento) => atualizarIntervalo(
                                                                        horario.chave,
                                                                        'fim',
                                                                        evento.target.value,
                                                                    )}
                                                                    required
                                                                    disabled={salvando}
                                                                />
                                                            </div>
                                                            <Botao
                                                                type="button"
                                                                variante="perigo"
                                                                className="schedule-remove-button"
                                                                aria-label={`Remover intervalo de ${horario.inicio} a ${horario.fim} de ${dia}`}
                                                                disabled={salvando}
                                                                onClick={() => removerIntervalo(horario.chave)}
                                                            >
                                                                <Icon path={mdiDeleteOutline} size="1rem" className="btn-icon" />
                                                                Remover
                                                            </Botao>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </section>
                                    );
                                })}
                            </div>
                        )}

                        <div className="form-actions schedule-actions">
                            <Botao type="submit" disabled={salvando || carregandoHorarios}>
                                <Icon path={mdiContentSave} size="1rem" className="btn-icon" />
                                {salvando ? 'Salvando...' : 'Salvar semana'}
                            </Botao>
                        </div>
                    </form>
                )}
            </section>
        </Layout>
    );
}

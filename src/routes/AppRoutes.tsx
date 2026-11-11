import { Routes, Route, Navigate } from 'react-router-dom';
import { RotaProtegida } from './RotaProtegida';
import { LoginPage } from '../pages/LoginPage';
import { CadastroPage } from '../pages/CadastroPage';
import { UsuariosPage } from '../pages/UsuariosPage';
import { HorariosTrabalhoPage } from '../pages/HorariosTrabalhoPage';
import { MassagensPage } from '../pages/MassagensPage';
import { DetalheMassagemPage } from '../pages/DetalheMassagemPage';
import { EditarMassagemPage } from '../pages/EditarMassagemPage';
import { NovaMassagemPage } from '../pages/NovaMassagemPage';
import { MateriaisPage } from '../pages/MateriaisPage';
import { AgendamentosPage } from '../pages/AgendamentosPage';
import { GerenciamentoAgendamentosPage } from '../pages/GerenciamentoAgendamentosPage';
import { NaoEncontradaPage } from '../pages/NaoEncontradaPage';

export function AppRoutes() {
    return (
        <Routes>
            {/* Rota pública: qualquer um pode acessar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/cadastro" element={<CadastroPage />} />

            {/* Rotas protegidas: exigem login */}
            {/* RotaProtegida sem `perfilExigido` aceita qualquer usuário autenticado */}
            <Route element={<RotaProtegida />}>
                {/* Redireciona a raiz "/" para "/massagens" */}
                <Route path="/" element={<Navigate to="/massagens" replace />} />
                <Route path="/massagens" element={<MassagensPage />} />
                <Route path="/agendamentos" element={<AgendamentosPage />} />
                <Route
                    path="/gerenciamento/agendamentos"
                    element={<GerenciamentoAgendamentosPage />}
                />
                <Route path="/materiais" element={<MateriaisPage />} />
                <Route path="/usuarios" element={<UsuariosPage />} />
                <Route path="/horarios-trabalho" element={<HorariosTrabalhoPage />} />
                <Route path="/massagens/nova" element={<NovaMassagemPage />} />
                {/* :id é um parâmetro dinâmico — pode ser qualquer número */}
                <Route path="/massagens/:id" element={<DetalheMassagemPage />} />
                <Route path="/massagens/:id/editar" element={<EditarMassagemPage />} />
            </Route>

            {/* Rota curinga: captura qualquer URL não mapeada */}
            <Route path="*" element={<NaoEncontradaPage />} />
        </Routes>
    );
}
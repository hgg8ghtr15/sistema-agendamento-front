import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppRoutes } from './routes/AppRoutes';

// App é o componente raiz. Ele define a ordem dos providers:
// BrowserRouter precisa envolver tudo que usa rotas
// AuthProvider precisa envolver tudo que usa autenticação
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAutenticacao } from '../contexto/AutenticacaoContexto';
import { Layout } from '../components/Layout';
import LandingPage from '../paginas/LandingPage';
import Login from '../paginas/Login';
import Cadastro from '../paginas/Cadastro';
import Dashboard from '../paginas/Dashboard';
import Quiz from '../paginas/Quiz';
import Gramatica from '../paginas/Gramatica';
import Analisador from '../paginas/Analisador';
import Gerador from '../paginas/Gerador';
import Flashcards from '../paginas/Flashcards';
import Mapas from '../paginas/Mapas';
import Parafrase from '../paginas/Parafrase';
import Configuracoes from '../paginas/Configuracoes';
import Lousa from '../paginas/Lousa';
import ListaLousas from '../paginas/ListaLousas';
import RotaProtegida from './RotaProtegida';

export function RotasApp() {
  const { usuario } = useAutenticacao();

  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={usuario ? <Navigate to="/app/dashboard" /> : <Login />} />
      <Route path="/cadastro" element={usuario ? <Navigate to="/app/dashboard" /> : <Cadastro />} />

      {/* Rotas protegidas */}
      <Route path="/app" element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="gramatica" element={<Gramatica />} />
          <Route path="parafrase" element={<Parafrase />} />
          <Route path="analisador" element={<Analisador />} />
          <Route path="gerador" element={<Gerador />} />
          <Route path="quiz" element={<Quiz />} />
          <Route path="flashcards" element={<Flashcards />} />
          <Route path="mapas" element={<Mapas />} />
          <Route path="configuracoes" element={<Configuracoes />} />
          <Route path="lousa/:id" element={<Lousa />} />
          <Route path="nova-lousa" element={<Lousa />} />
          <Route path="minhas-lousas" element={<ListaLousas />} />
          <Route path="lousa" element={<Navigate to="/app/minhas-lousas" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
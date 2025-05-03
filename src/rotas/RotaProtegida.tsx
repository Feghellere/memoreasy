import { Navigate, Outlet } from 'react-router-dom';
import { useAutenticacao } from '../contexto/AutenticacaoContexto';

export default function RotaProtegida() {
  const { usuario, carregando } = useAutenticacao();

  if (carregando) {
    return <div>Carregando...</div>;
  }

  return usuario ? <Outlet /> : <Navigate to="/" />;
}
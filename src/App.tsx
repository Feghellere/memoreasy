import { BrowserRouter as Router } from 'react-router-dom';
import { AutenticacaoProvider } from './contexto/AutenticacaoContexto';
import { RotasApp } from './rotas';

function App() {
  return (
    <Router>
      <AutenticacaoProvider>
        <RotasApp />
      </AutenticacaoProvider>
    </Router>
  );
}

export default App;
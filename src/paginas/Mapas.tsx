import { Network } from 'lucide-react';
import { EmConstrucao } from '../components/EmConstrucao';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Mapas() {
  const { darkMode } = useDarkMode();

  return (
    <EmConstrucao
      titulo="Mapa Mental"
      descricao="Uma ferramenta poderosa para criar mapas mentais interativos está sendo desenvolvida para ajudar você a organizar e conectar conceitos de forma visual."
      icone={<Network className="w-12 h-12 text-white" />}
      cor="bg-indigo-500"
      corBarra="bg-gradient-to-r from-indigo-500 to-indigo-600"
      darkMode={darkMode}
    />
  );
}
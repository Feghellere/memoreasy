import { PenTool } from 'lucide-react';
import { EmConstrucao } from '../components/EmConstrucao';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Parafrase() {
  const { darkMode } = useDarkMode();

  return (
    <EmConstrucao
      titulo="Paráfrase"
      descricao="Estamos desenvolvendo uma ferramenta inteligente que ajudará você a reescrever textos mantendo o significado original, mas com uma estrutura única e personalizada."
      icone={<PenTool className="w-12 h-12 text-white" />}
      cor="bg-blue-500"
      corBarra="bg-gradient-to-r from-blue-500 to-blue-600"
      darkMode={darkMode}
    />
  );
}
import { Check } from 'lucide-react';
import { EmConstrucao } from '../components/EmConstrucao';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Gramatica() {
  const { darkMode } = useDarkMode();

  return (
    <EmConstrucao
      titulo="Corretor Gramatical"
      descricao="Estamos desenvolvendo uma ferramenta avançada de correção gramatical que identificará erros de ortografia, pontuação e estilo em seus textos."
      icone={<Check className="w-12 h-12 text-white" />}
      cor="bg-emerald-500"
      corBarra="bg-gradient-to-r from-emerald-500 to-emerald-600"
      darkMode={darkMode}
    />
  );
}
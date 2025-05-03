import { FlaskConical } from 'lucide-react';
import { EmConstrucao } from '../components/EmConstrucao';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Flashcards() {
  const { darkMode } = useDarkMode();

  return (
    <EmConstrucao
      titulo="Cartões de Memória"
      descricao="Estamos criando uma ferramenta interativa para gerar e gerenciar flashcards personalizados que ajudarão em seus estudos com técnicas de memorização eficientes."
      icone={<FlaskConical className="w-12 h-12 text-white" />}
      cor="bg-cyan-500"
      corBarra="bg-gradient-to-r from-cyan-500 to-cyan-600"
      darkMode={darkMode}
    />
  );
}
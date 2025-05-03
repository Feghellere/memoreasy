import { BookOpen } from 'lucide-react';
import { EmConstrucao } from '../components/EmConstrucao';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Gerador() {
  const { darkMode } = useDarkMode();

  return (
    <EmConstrucao
      titulo="Gerador de Textos"
      descricao="Nossa ferramenta de geração de conteúdo está sendo desenvolvida para criar artigos, resumos e outros textos acadêmicos com assistência de IA."
      icone={<BookOpen className="w-12 h-12 text-white" />}
      cor="bg-violet-500"
      corBarra="bg-gradient-to-r from-violet-500 to-violet-600"
      darkMode={darkMode}
    />
  );
}
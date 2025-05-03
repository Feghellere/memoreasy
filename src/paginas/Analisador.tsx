import { FileText } from 'lucide-react';
import { EmConstrucao } from '../components/EmConstrucao';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Analisador() {
  const { darkMode } = useDarkMode();

  return (
    <EmConstrucao
      titulo="Analisador de Textos"
      descricao="Estamos construindo um analisador avançado que fornecerá feedback detalhado sobre a estrutura, coesão e clareza dos seus textos acadêmicos."
      icone={<FileText className="w-12 h-12 text-white" />}
      cor="bg-orange-500"
      corBarra="bg-gradient-to-r from-orange-500 to-orange-600"
      darkMode={darkMode}
    />
  );
}
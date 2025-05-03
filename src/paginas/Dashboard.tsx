import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, PenTool, Network, FileText, Search, FlaskConical, Car as Cards } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Dashboard() {
  const { darkMode } = useDarkMode();
  
  const ferramentas = [
    {
      titulo: 'Gramática',
      descricao: 'Análise e correção gramatical',
      icone: FileText,
      cor: darkMode ? 'bg-[#3D9CD3]' : 'bg-blue-600',
      rota: '/app/gramatica'
    },
    {
      titulo: 'Paráfrase',
      descricao: 'Reescreva textos de forma única',
      icone: PenTool,
      cor: darkMode ? 'bg-[#3D9CD3]' : 'bg-blue-600',
      rota: '/app/parafrase'
    },
    {
      titulo: 'Analisador',
      descricao: 'Análise profunda de textos',
      icone: Search,
      cor: darkMode ? 'bg-[#3D9CD3]' : 'bg-blue-600',
      rota: '/app/analisador'
    },
    {
      titulo: 'Gerador',
      descricao: 'Gere conteúdo inteligente',
      icone: FlaskConical,
      cor: darkMode ? 'bg-[#3D9CD3]' : 'bg-blue-600',
      rota: '/app/gerador'
    },
    {
      titulo: 'Quiz',
      descricao: 'Teste seu conhecimento',
      icone: BookOpen,
      cor: darkMode ? 'bg-[#3D9CD3]' : 'bg-blue-600',
      rota: '/app/quiz'
    },
    {
      titulo: 'Flashcards',
      descricao: 'Estude com cartões de memória',
      icone: Cards,
      cor: darkMode ? 'bg-[#3D9CD3]' : 'bg-blue-600',
      rota: '/app/flashcards'
    },
    {
      titulo: 'Mapa Mental',
      descricao: 'Organize suas ideias visualmente',
      icone: Network,
      cor: darkMode ? 'bg-[#3D9CD3]' : 'bg-blue-600',
      rota: '/app/mapas'
    },
  ];

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 ${
          darkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Dashboard
        </h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {ferramentas.map((ferramenta, index) => {
            const Icon = ferramenta.icone;
            return (
              <motion.div
                key={ferramenta.titulo}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`overflow-hidden shadow-lg rounded-lg border ${
                  darkMode 
                    ? 'bg-[#1e293b] border-gray-700' 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="p-4 sm:p-5">
                  <div className={`inline-flex p-2 sm:p-3 rounded-lg ${ferramenta.cor}`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <h3 className={`mt-3 sm:mt-4 text-base sm:text-lg font-medium ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {ferramenta.titulo}
                  </h3>
                  <p className={`mt-1 text-xs sm:text-sm ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {ferramenta.descricao}
                  </p>
                </div>
                <div className={`px-4 sm:px-5 py-2 sm:py-3 ${
                  darkMode ? 'bg-[#131c31]' : 'bg-gray-50'
                }`}>
                  <Link
                    to={ferramenta.rota}
                    className={`text-xs sm:text-sm font-medium ${
                      darkMode 
                        ? 'text-[#3D9CD3] hover:text-[#2D8BA8]' 
                        : 'text-blue-600 hover:text-blue-700'
                    } transition-colors`}
                  >
                    Acessar &rarr;
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
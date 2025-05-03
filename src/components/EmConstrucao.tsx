import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface EmConstrucaoProps {
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  cor: string;
  corBarra: string;
  darkMode?: boolean;
}

export function EmConstrucao({ titulo, descricao, icone, cor, corBarra, darkMode = true }: EmConstrucaoProps) {
  return (
    <div>
      <div className="max-w-7xl mx-auto py-8 sm:py-12 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center text-center px-4 sm:px-6"
        >
          <div className={`w-20 h-20 sm:w-24 sm:h-24 ${cor} rounded-full flex items-center justify-center mb-6 sm:mb-8`}>
            {icone}
          </div>

          <h1 className={`text-3xl sm:text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            {titulo}
          </h1>
          
          <div className={`inline-flex items-center px-4 py-2 rounded-full ${
            darkMode ? 'bg-[#1e293b] border-gray-700' : 'bg-white border-gray-200'
          } border mb-6 sm:mb-8`}>
            <span className="text-yellow-500 font-medium flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
              </span>
              Em construção
            </span>
          </div>

          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} max-w-2xl mb-8 sm:mb-12 text-sm sm:text-base`}>
            {descricao}
          </p>

          <div className="w-full max-w-md px-4">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs sm:text-sm font-medium uppercase tracking-wider ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                PROGRESSO
              </span>
              <span className={`text-xs sm:text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                50%
              </span>
            </div>
            <div className={`w-full h-2 sm:h-3 ${
              darkMode ? 'bg-gray-700/30' : 'bg-gray-200'
            } rounded-full overflow-hidden`}>
              <div 
                className={`h-full ${corBarra} rounded-full transition-all duration-500 ease-out`} 
                style={{ width: '50%' }}
              />
            </div>
          </div>

          <div className={`mt-6 sm:mt-8 flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} text-sm sm:text-base`}>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span>Lançamento em breve.</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
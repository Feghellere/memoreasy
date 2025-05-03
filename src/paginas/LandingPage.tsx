import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, PenTool, Network, Shield, Sparkles, ChevronRight, Check } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function LandingPage() {
  const features = [
    {
      icon: BookOpen,
      title: 'Conteúdo Personalizado',
      description: 'Material de estudo adaptado ao seu ritmo e estilo de aprendizagem'
    },
    {
      icon: PenTool,
      title: 'Exercícios Práticos',
      description: 'Pratique com exercícios interativos e receba feedback instantâneo'
    },
    {
      icon: Network,
      title: 'Mapas Mentais',
      description: 'Organize seu conhecimento visualmente e melhore sua compreensão'
    },
    {
      icon: Shield,
      title: 'Progresso Seguro',
      description: 'Acompanhe seu desenvolvimento com métricas detalhadas'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* Header/Navigation */}
      <nav className="bg-[#0B1120] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#3D9CD3] to-[#2D8BA8] rounded flex items-center justify-center">
                  <Logo className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">MemorEasy</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/cadastro"
                className="px-4 py-2 bg-[#3D9CD3] text-white rounded-lg hover:bg-[#2D8BA8] transition-colors"
              >
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#1e293b] border border-gray-700">
                <Sparkles className="h-4 w-4 text-[#3D9CD3] mr-2" />
                <span className="text-sm text-gray-300">Potencializado por IA Avançada</span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white">
                MemorEasy
              </h1>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#3D9CD3]">
                Seu Assistente<br />de Estudos com IA
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                MemorEasy ajuda você a escrever melhores trabalhos, criar materiais de estudo e melhorar seu desempenho acadêmico com ferramentas poderosas de IA.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
                <Link
                  to="/cadastro"
                  className="w-full sm:w-auto px-8 py-3 bg-[#3D9CD3] text-white rounded-lg hover:bg-[#2D8BA8] transition-colors flex items-center justify-center"
                >
                  Começar Agora
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  to="/sobre"
                  className="w-full sm:w-auto px-8 py-3 border border-gray-700 text-white rounded-lg hover:bg-[#1e293b] transition-colors text-center"
                >
                  Saiba Mais
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ferramentas e Recursos
          </h2>
          <div className="inline-flex items-center space-x-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-full">
            <Check className="h-4 w-4" />
            <span className="text-sm">Todas as ferramentas são GRATUITAS!</span>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto mt-4">
            Acesse nossa suite completa de ferramentas profissionais de estudo - sem necessidade de assinatura ou pagamento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#1e293b] p-6 rounded-lg border border-gray-700 hover:border-[#3D9CD3] transition-colors"
              >
                <div className="bg-gradient-to-br from-[#3D9CD3] to-[#2D8BA8] p-3 rounded-lg inline-block mb-4">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-[#1e293b] border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para transformar seus estudos?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de estudantes que já estão aproveitando nossa plataforma
            para alcançar seus objetivos acadêmicos.
          </p>
          <Link
            to="/cadastro"
            className="inline-flex items-center px-8 py-3 bg-[#3D9CD3] text-white rounded-lg hover:bg-[#2D8BA8] transition-colors"
          >
            <Logo className="w-5 h-5 mr-2" />
            Começar Agora
          </Link>
        </div>
      </div>
    </div>
  );
}